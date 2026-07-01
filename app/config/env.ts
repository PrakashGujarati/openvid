export const env = {
    unsplash: {
        accessKey: process.env.UNSPLASH_ACCESS_KEY ?? "",
    },
    pexels: {
        apiKey: process.env.PEXELS_API_KEY ?? "",
    },
    pixabay: {
        apiKey: process.env.PIXABAY_API_KEY ?? "",
    },
    groq: {
        apiKey: process.env.GROQ_API_KEY ?? "",
        visionModel: process.env.GROQ_VISION_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct",
    },
    elevenLabs: {
        apiKey: process.env.ELEVENLABS_API_KEY ?? "",
        model: process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2",
    },
} as const;
