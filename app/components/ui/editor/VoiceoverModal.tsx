"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { VOICE_PERSONAS, type VoicePersona } from "@/lib/voiceover.config";

interface VoiceoverModalProps {
    open: boolean;
    imageName: string;
    isGenerating: boolean;
    onSkip: () => void;
    onConfirm: (persona: VoicePersona) => void;
}

export function VoiceoverModal({
    open,
    imageName,
    isGenerating,
    onSkip,
    onConfirm,
}: VoiceoverModalProps) {
    const t = useTranslations("voiceoverModal");

    const [selectedId, setSelectedId] = useState<string>(VOICE_PERSONAS[0]?.id ?? "");
    const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    // personaId -> object URL of the cached preview clip
    const previewCacheRef = useRef<Map<string, string>>(new Map());

    // Reset selection each time the modal opens for a new image.
    useEffect(() => {
        if (open) setSelectedId(VOICE_PERSONAS[0]?.id ?? "");
    }, [open]);

    const stopPlayback = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setPlayingId(null);
    }, []);

    // Cleanup cached preview URLs and audio on unmount.
    useEffect(() => {
        const cache = previewCacheRef.current;
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            for (const url of cache.values()) URL.revokeObjectURL(url);
            cache.clear();
        };
    }, []);

    const handlePreview = useCallback(
        async (persona: VoicePersona, e: React.MouseEvent) => {
            e.stopPropagation();
            if (previewLoadingId) return;

            // Toggle off if this persona is already playing.
            if (playingId === persona.id) {
                stopPlayback();
                return;
            }
            stopPlayback();

            try {
                let url = previewCacheRef.current.get(persona.id);
                if (!url) {
                    setPreviewLoadingId(persona.id);
                    const res = await fetch("/api/tts", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            text: t("previewSample"),
                            voiceId: persona.elevenVoiceId,
                        }),
                    });
                    if (!res.ok) throw new Error("preview failed");
                    const blob = await res.blob();
                    url = URL.createObjectURL(blob);
                    previewCacheRef.current.set(persona.id, url);
                }

                if (!audioRef.current) audioRef.current = new Audio();
                const audio = audioRef.current;
                audio.src = url;
                audio.onended = () => setPlayingId(null);
                await audio.play();
                setPlayingId(persona.id);
            } catch {
                setPlayingId(null);
            } finally {
                setPreviewLoadingId(null);
            }
        },
        [playingId, previewLoadingId, stopPlayback, t]
    );

    const handleSkip = useCallback(() => {
        if (isGenerating) return;
        stopPlayback();
        onSkip();
    }, [isGenerating, stopPlayback, onSkip]);

    const handleConfirm = useCallback(() => {
        const persona = VOICE_PERSONAS.find((p) => p.id === selectedId);
        if (!persona) return;
        stopPlayback();
        onConfirm(persona);
    }, [selectedId, stopPlayback, onConfirm]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="voiceover-modal-title"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-[#09090B] border border-white/20 rounded-2xl shadow-[0_0_80px_-15px_rgba(0,0,0,1)] w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
                    <button
                        onClick={handleSkip}
                        disabled={isGenerating}
                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
                        aria-label={t("back")}
                    >
                        <Icon icon="lucide:arrow-left" width="20" aria-hidden="true" />
                    </button>
                    <div className="flex-1 text-center">
                        <h2 id="voiceover-modal-title" className="text-lg font-bold text-white">
                            {t("title")}
                        </h2>
                        <p className="text-xs text-white/40 mt-0.5 truncate" title={imageName}>
                            {imageName}
                        </p>
                    </div>
                    <button
                        onClick={handleSkip}
                        disabled={isGenerating}
                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
                        aria-label={t("skip")}
                    >
                        <Icon icon="lucide:x" width="20" aria-hidden="true" />
                    </button>
                </div>

                {/* Persona grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {VOICE_PERSONAS.map((persona) => {
                            const isSelected = selectedId === persona.id;
                            const isLoading = previewLoadingId === persona.id;
                            const isPlaying = playingId === persona.id;
                            return (
                                <div
                                    key={persona.id}
                                    role="button"
                                    tabIndex={isGenerating ? -1 : 0}
                                    aria-pressed={isSelected}
                                    aria-disabled={isGenerating}
                                    onClick={() => {
                                        if (!isGenerating) setSelectedId(persona.id);
                                    }}
                                    onKeyDown={(e) => {
                                        if (isGenerating) return;
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setSelectedId(persona.id);
                                        }
                                    }}
                                    className={`flex items-center gap-3 p-4 rounded-xl border text-left cursor-pointer transition-colors ${
                                        isGenerating ? "opacity-60 pointer-events-none" : ""
                                    } ${
                                        isSelected
                                            ? "border-blue-500 bg-blue-500/10"
                                            : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5"
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={(e) => handlePreview(persona, e)}
                                        disabled={isGenerating}
                                        aria-label={`${t("preview")} ${t(persona.labelKey)}`}
                                        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                            isSelected
                                                ? "bg-blue-500/20 text-blue-300"
                                                : "bg-white/10 text-white/70 hover:bg-white/15"
                                        }`}
                                    >
                                        {isLoading ? (
                                            <Icon icon="svg-spinners:ring-resize" width="16" />
                                        ) : isPlaying ? (
                                            <Icon icon="lucide:pause" width="16" />
                                        ) : (
                                            <Icon icon="lucide:play" width="16" />
                                        )}
                                    </button>
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-sm font-medium text-white truncate">
                                            {t(persona.labelKey)}
                                        </span>
                                        <span className="block text-xs text-white/40 truncate">
                                            {t(persona.descKey)}
                                        </span>
                                    </span>
                                    {isSelected && (
                                        <Icon
                                            icon="lucide:check-circle-2"
                                            width="18"
                                            className="shrink-0 text-blue-400"
                                            aria-hidden="true"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
                    <Button
                        variant="outline"
                        onClick={handleSkip}
                        disabled={isGenerating}
                        className="h-11 bg-transparent border-white/10 hover:bg-white/5 text-white/60 hover:text-white"
                    >
                        {t("skip")}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant="primary"
                        disabled={isGenerating || !selectedId}
                        className="h-11 text-white font-medium min-w-44"
                    >
                        {isGenerating ? (
                            <>
                                <Icon icon="svg-spinners:ring-resize" width="18" className="mr-1.5" />
                                {t("generating")}
                            </>
                        ) : (
                            <>
                                <Icon icon="lucide:sparkles" width="18" className="mr-1.5" aria-hidden="true" />
                                {t("useThisVoiceover")}
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
