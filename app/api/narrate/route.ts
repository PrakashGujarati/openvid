import { NextResponse } from "next/server";
import { env } from "@/app/config/env";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

interface NarrateResult {
    script: string;
    language: string;
}

function buildPrompt(tone: string): string {
    return [
        "You are a professional voiceover scriptwriter for short marketing/explainer videos.",
        "Look at the attached slide/image and write an engaging spoken narration for it.",
        "Rules:",
        "- First detect the dominant language of the image's content.",
        "- Write the narration in that SAME language.",
        `- Use a ${tone} tone.`,
        "- Keep it concise: about 2 to 4 natural spoken sentences.",
        "- Plain prose only: no markdown, no bullet points, no stage directions, no quotes.",
        "- Do not mention that it is a slide or an image.",
        'Return ONLY a JSON object of the form {"language": "<language name>", "script": "<the narration>"}.',
    ].join("\n");
}

export async function POST(request: Request) {
    if (!env.groq.apiKey) {
        return NextResponse.json(
            { error: "GROQ_API_KEY is not configured on the server." },
            { status: 500 }
        );
    }

    try {
        const formData = await request.formData();
        const image = formData.get("image");
        const tone = (formData.get("tone") as string) || "neutral, professional";

        if (!(image instanceof Blob)) {
            return NextResponse.json({ error: "Missing image file." }, { status: 400 });
        }

        const mime = image.type || "image/png";
        const buffer = Buffer.from(await image.arrayBuffer());
        const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

        const res = await fetch(GROQ_ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${env.groq.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: env.groq.visionModel,
                temperature: 0.7,
                max_tokens: 512,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: buildPrompt(tone) },
                            { type: "image_url", image_url: { url: dataUrl } },
                        ],
                    },
                ],
            }),
        });

        if (!res.ok) {
            const detail = await res.text().catch(() => "");
            console.error("[narrate] Groq error:", res.status, detail);
            let groqMsg = "";
            try { groqMsg = JSON.parse(detail)?.error?.message ?? ""; } catch { /* ignore */ }
            return NextResponse.json(
                { error: `Groq ${res.status}: ${groqMsg || detail || "unknown error"}` },
                { status: 502 }
            );
        }

        const data = await res.json();
        const raw: string = data?.choices?.[0]?.message?.content ?? "";

        // Models may wrap JSON in markdown fences or add prose around it.
        // Extract the first {...} block and parse it; otherwise use the raw text.
        let parsed: NarrateResult = { script: raw.trim(), language: "" };
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                const json = JSON.parse(match[0]);
                if (json.script) {
                    parsed = {
                        script: String(json.script).trim(),
                        language: String(json.language ?? "").trim(),
                    };
                }
            } catch {
                // keep the raw-text fallback
            }
        }

        if (!parsed.script) {
            return NextResponse.json(
                { error: "No narration could be generated for this image." },
                { status: 422 }
            );
        }

        return NextResponse.json(parsed);
    } catch (error) {
        console.error("[narrate] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Narration request failed." },
            { status: 500 }
        );
    }
}
