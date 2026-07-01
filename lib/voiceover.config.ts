/**
 * Voice personas for the image -> AI voiceover flow.
 *
 * Each persona maps to an ElevenLabs premade voice id. The ids below are the
 * public default voices; swap `elevenVoiceId` here to point at your own
 * ElevenLabs voices. `tone` is the hint passed to /api/narrate so the generated
 * script matches the chosen voice's character.
 */
export interface VoicePersona {
    id: string;
    /** i18n key (relative to the `voiceoverModal` namespace) for the display name */
    labelKey: string;
    /** i18n key (relative to the `voiceoverModal` namespace) for the description */
    descKey: string;
    /** ElevenLabs premade voice id */
    elevenVoiceId: string;
    /** Tone hint sent to the narration model */
    tone: string;
}

export const VOICE_PERSONAS: VoicePersona[] = [
    {
        id: "narrator",
        labelKey: "personas.narrator.label",
        descKey: "personas.narrator.desc",
        elevenVoiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel
        tone: "calm and smooth narration",
    },
    {
        id: "educator",
        labelKey: "personas.educator.label",
        descKey: "personas.educator.desc",
        elevenVoiceId: "MF3mGyEYCl7XYWbV9V6O", // Elli
        tone: "friendly and approachable",
    },
    {
        id: "teacher",
        labelKey: "personas.teacher.label",
        descKey: "personas.teacher.desc",
        elevenVoiceId: "pNInz6obpgDQGcFmaJgB", // Adam
        tone: "clear and instructional",
    },
    {
        id: "persuader",
        labelKey: "personas.persuader.label",
        descKey: "personas.persuader.desc",
        elevenVoiceId: "ErXwobaYiN019PkySvjV", // Antoni
        tone: "persuasive and confident",
    },
    {
        id: "explainer",
        labelKey: "personas.explainer.label",
        descKey: "personas.explainer.desc",
        elevenVoiceId: "TxGEqnHWrfWFTfGW9XjX", // Josh
        tone: "lively and explanatory",
    },
    {
        id: "coach",
        labelKey: "personas.coach.label",
        descKey: "personas.coach.desc",
        elevenVoiceId: "AZnzlk1XvdvUeBnXmlld", // Domi
        tone: "energetic and encouraging",
    },
    {
        id: "motivator",
        labelKey: "personas.motivator.label",
        descKey: "personas.motivator.desc",
        elevenVoiceId: "VR6AewLTigWG4xSOukaG", // Arnold
        tone: "high-energy and motivational",
    },
];
