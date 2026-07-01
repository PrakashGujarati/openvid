/**
 * Extract a video/audio file's audio stream into a standalone WAV object URL.
 *
 * Uses Web Audio API `decodeAudioData` to decode the full file, then encodes
 * the resulting AudioBuffer to 16-bit PCM WAV. Returns null when the file has
 * no decodable audio (e.g. a silent screen recording).
 *
 * Note: WAV is uncompressed (~10 MB per stereo minute). Intended for the single
 * primary uploaded video, not arbitrarily long media.
 */
export async function extractAudioFromVideo(
    file: Blob,
): Promise<{ url: string; duration: number } | null> {
    const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
    if (!AudioCtx) return null;

    const ctx = new AudioCtx();
    try {
        const arrayBuffer = await file.arrayBuffer();
        let audioBuffer: AudioBuffer;
        try {
            audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        } catch {
            return null; // no decodable audio stream
        }
        if (!audioBuffer || audioBuffer.length === 0) return null;

        const wavBlob = encodeWav(audioBuffer);
        return { url: URL.createObjectURL(wavBlob), duration: audioBuffer.duration };
    } finally {
        // Release the decoding context; the WAV blob URL is independent of it.
        void ctx.close();
    }
}

/** Encode an AudioBuffer to a 16-bit PCM WAV Blob. */
function encodeWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const numFrames = buffer.length;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = numFrames * blockAlign;

    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);          // PCM chunk size
    view.setUint16(20, 1, true);           // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 8 * bytesPerSample, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    // Interleave channels and clamp to 16-bit signed range.
    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

    let offset = 44;
    for (let i = 0; i < numFrames; i++) {
        for (let c = 0; c < numChannels; c++) {
            let sample = channels[c][i];
            sample = Math.max(-1, Math.min(1, sample));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            offset += 2;
        }
    }

    return new Blob([view], { type: "audio/wav" });
}
