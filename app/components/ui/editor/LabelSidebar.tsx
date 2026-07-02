import { Icon } from "@iconify/react";
import { TooltipAction } from "@/components/ui/tooltip-action";

interface LabelSidebarProps {
    /** One label per audio lane, top-to-bottom. Empty array => one default lane. */
    audioLaneLabels?: string[];
    /** Whether the loaded video has its own audio stream to mute/unmute. */
    videoHasAudio?: boolean;
    muteOriginalAudio?: boolean;
    onToggleMuteOriginalAudio?: () => void;
    muteToggleLabel?: string;
}

export default function LabelSidebar({
    audioLaneLabels = [],
    videoHasAudio = false,
    muteOriginalAudio = false,
    onToggleMuteOriginalAudio,
    muteToggleLabel,
}: LabelSidebarProps) {
    const lanes = audioLaneLabels.length > 0 ? audioLaneLabels : ["Audio"];
    const hasTracks = audioLaneLabels.length > 0;

    return (
        <div className="absolute left-0 top-0 bottom-0 w-16 shrink-0 border-r border-white/5 flex flex-col bg-[#0D0D11] z-30">
            <div className="h-7 border-b border-white/5" />

            <div className="flex-1 flex items-center justify-between px-3">
                <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-500">Video</span>
                {videoHasAudio && onToggleMuteOriginalAudio && (
                    <TooltipAction label={muteToggleLabel ?? (muteOriginalAudio ? "Unmute" : "Mute")}>
                        <button
                            onClick={onToggleMuteOriginalAudio}
                            className="p-0.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-all"
                            aria-label={muteToggleLabel ?? (muteOriginalAudio ? "Unmute" : "Mute")}
                            aria-pressed={muteOriginalAudio}
                        >
                            <Icon icon={muteOriginalAudio ? "mdi:volume-off" : "mdi:volume-high"} width="12" height="12" />
                        </button>
                    </TooltipAction>
                )}
            </div>

            <div className={`flex items-center px-3 border-t border-white/5 transition-all duration-300 ${hasTracks ? 'h-12' : 'h-15'}`}>
                <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-500">Zoom</span>
            </div>

            {lanes.map((label, i) => (
                <div
                    key={i}
                    className="h-5 flex items-center px-3 border-t border-white/5 bg-white/1"
                >
                    <span className="text-[9px] uppercase font-semibold tracking-wider text-zinc-500 truncate">
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
}
