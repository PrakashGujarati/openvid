import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, readFile, rm, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

// This handler relies on Node-only APIs (child_process, fs/promises) so it must
// never be deployed to the Edge runtime.
export const runtime = "nodejs";

const FFMPEG_PATH =
    process.platform === "win32" ? "C:/ffmpeg/bin/ffmpeg.exe" : "ffmpeg";

// Bounds to keep FFmpeg encoding from becoming a CPU/disk exhaustion vector.
const MAX_FRAMES = 18000; // ~10 min at 30fps
const MAX_DIMENSION = 3840; // 4K
const MIN_DIMENSION = 16;
const MAX_FPS = 120;
const MIN_FPS = 1;
const MAX_BITRATE = 200_000_000; // 200 Mbps
const MIN_BITRATE = 100_000; // 100 kbps

// Naive in-memory fixed-window rate limiter (per client IP). Good enough to blunt
// abuse of this expensive endpoint; swap for a shared store if running multi-instance.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const bucket = rateBuckets.get(ip);
    if (!bucket || now > bucket.resetAt) {
        rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }
    bucket.count += 1;
    return bucket.count > RATE_LIMIT_MAX;
}

function clampInt(value: number, min: number, max: number, fallback: number): number {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, Math.round(value)));
}

function runFFmpeg(args: string[]): { proc: ReturnType<typeof spawn>; done: Promise<void> } {
    const proc = spawn(FFMPEG_PATH, args, { windowsHide: true });
    const done = new Promise<void>((resolve, reject) => {
        let stderr = "";
        proc.stderr.on("data", (d: Buffer) => {
            stderr += d.toString();
        });
        proc.on("close", (code: number | null) => {
            if (code === 0) {
                resolve();
            } else {
                console.error("[NVENC] FFmpeg error:\n" + stderr.slice(-3000));
                reject(new Error(`FFmpeg exited with code ${code}. Check server logs.`));
            }
        });
        proc.on("error", (e) => reject(new Error(`Failed to spawn FFmpeg: ${e.message}`)));
    });
    return { proc, done };
}

async function writeFramesToStdin(
    proc: ReturnType<typeof spawn>,
    frames: File[]
): Promise<void> {
    for (const frame of frames) {
        const buf = Buffer.from(await frame.arrayBuffer());
        const canWrite = proc.stdin!.write(buf);
        if (!canWrite) {
            await new Promise<void>((resolve) => proc.stdin!.once("drain", resolve));
        }
    }
    proc.stdin!.end();
}

export async function POST(req: NextRequest) {
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";
    if (isRateLimited(ip)) {
        return NextResponse.json(
            { error: "Too many export requests. Please wait a moment and try again." },
            { status: 429 }
        );
    }

    const sessionId = randomUUID();
    const tempDir = join(tmpdir(), `openvid-gpu-${sessionId}`);

    try {
        await mkdir(tempDir, { recursive: true });

        const formData = await req.formData();

        const fps = clampInt(parseFloat((formData.get("fps") as string) || "30"), MIN_FPS, MAX_FPS, 30);
        const width = clampInt(parseInt((formData.get("width") as string) || "1920"), MIN_DIMENSION, MAX_DIMENSION, 1920);
        const height = clampInt(parseInt((formData.get("height") as string) || "1080"), MIN_DIMENSION, MAX_DIMENSION, 1080);
        const bitrate = clampInt(parseInt((formData.get("bitrate") as string) || "8000000"), MIN_BITRATE, MAX_BITRATE, 8000000);
        const format = (formData.get("format") as string) || "mp4";

        const frames = formData.getAll("frames") as File[];
        if (frames.length === 0) {
            return NextResponse.json({ error: "No frames provided" }, { status: 400 });
        }
        if (frames.length > MAX_FRAMES) {
            return NextResponse.json(
                { error: `Too many frames (${frames.length}). Maximum is ${MAX_FRAMES}.` },
                { status: 413 }
            );
        }

        const outputPath = join(tempDir, `output.${format === "gif" ? "gif" : "mp4"}`);

        let ffmpegArgs: string[];

        if (format === "gif") {
            const palettePath = join(tempDir, "palette.png");

            // We need to write frames to temp files for GIF (two-pass palette requires seeking)
            for (let i = 0; i < frames.length; i++) {
                const buf = Buffer.from(await frames[i].arrayBuffer());
                await writeFile(join(tempDir, `frame${String(i).padStart(5, "0")}.jpg`), buf);
            }

            await runFFmpeg([
                "-f", "image2",
                "-framerate", String(fps),
                "-i", join(tempDir, "frame%05d.jpg"),
                "-vf", `scale=${width}:${height}:flags=lanczos,palettegen=stats_mode=diff:max_colors=256`,
                "-y", palettePath,
            ]).done;

            await runFFmpeg([
                "-f", "image2",
                "-framerate", String(fps),
                "-i", join(tempDir, "frame%05d.jpg"),
                "-i", palettePath,
                "-lavfi", `scale=${width}:${height}:flags=lanczos [scaled]; [scaled][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
                "-y", outputPath,
            ]).done;

        } else {
            // MP4 with h264_nvenc — pipe frames directly to FFmpeg stdin
            ffmpegArgs = [
                "-f", "image2pipe",
                "-r", String(fps),
                "-i", "pipe:0",
                "-c:v", "h264_nvenc",
                "-preset", "p4",
                "-tune", "hq",
                "-rc", "vbr",
                "-b:v", String(bitrate),
                "-maxrate:v", String(Math.round(bitrate * 1.5)),
                "-bufsize:v", String(bitrate * 2),
                "-vf", `scale=${width}:${height}`,
                "-y",
                outputPath,
            ];

            const { proc, done } = runFFmpeg(ffmpegArgs);

            // Log GPU usage info
            proc.stderr!.on("data", (d: Buffer) => {
                const line = d.toString();
                if (line.includes("nvenc") || line.includes("cuda") || line.includes("fps=")) {
                    process.stdout.write("[NVENC] " + line);
                }
            });

            await Promise.all([writeFramesToStdin(proc, frames), done]);
        }

        const outputData = await readFile(outputPath);
        const mimeType = format === "gif" ? "image/gif" : "video/mp4";
        const ext = format === "gif" ? "gif" : "mp4";

        return new NextResponse(outputData, {
            headers: {
                "Content-Type": mimeType,
                "Content-Disposition": `attachment; filename="export-${width}x${height}.${ext}"`,
                "X-GPU-Encoded": "h264_nvenc",
            },
        });
    } catch (error) {
        console.error("[GPU Export] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "GPU export failed" },
            { status: 500 }
        );
    } finally {
        await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
}
