import { NextResponse } from "next/server";
import { env } from "@/app/config/env";

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1/text-to-speech";
const MAX_TEXT_LENGTH = 5000;

export async function POST(request: Request) {
    if (!env.elevenLabs.apiKey) {
        return NextResponse.json(
            { error: "ELEVENLABS_API_KEY is not configured on the server." },
            { status: 500 }
        );
    }

    try {
        const body = await request.json().catch(() => ({}));
        const text = typeof body.text === "string" ? body.text.trim() : "";
        const voiceId = typeof body.voiceId === "string" ? body.voiceId.trim() : "";

        if (!text) {
            return NextResponse.json({ error: "Missing text." }, { status: 400 });
        }
        if (!voiceId) {
            return NextResponse.json({ error: "Missing voiceId." }, { status: 400 });
        }

        const res = await fetch(`${ELEVENLABS_BASE}/${voiceId}`, {
            method: "POST",
            headers: {
                "xi-api-key": env.elevenLabs.apiKey,
                "Content-Type": "application/json",
                Accept: "audio/mpeg",
            },
            body: JSON.stringify({
                text: text.slice(0, MAX_TEXT_LENGTH),
                model_id: env.elevenLabs.model,
            }),
        });

        if (!res.ok) {
            const detail = await res.text().catch(() => "");
            console.error("[tts] ElevenLabs error:", res.status, detail);
            return NextResponse.json(
                { error: `Text-to-speech failed (${res.status}).` },
                { status: 502 }
            );
        }

        const audio = await res.arrayBuffer();
        return new NextResponse(audio, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("[tts] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "TTS request failed." },
            { status: 500 }
        );
    }
}
