"use client";

import { useEffect } from "react";
import { Icon } from "@iconify/react";
import { useMotionContext } from "@/app/contexts/MotionContext";
import { MotionTemplate } from "@/types/motion.types";

interface Props {
  template: MotionTemplate;
  onBack: () => void;
}

/**
 * Generic shell: header with back button + accent icon + scrollable body.
 * The template's own EditorPanel is rendered inside the body.
 * This component owns no editor state — it only activates the template
 * in context and delegates all controls to EditorPanel.
 */
export function TemplateEditorShell({ template, onBack }: Props) {
  const { setSelectedTemplateId, setMotionDuration, setMotionImageUrl } = useMotionContext();

  // Activate the template when the shell mounts
  useEffect(() => {
    setSelectedTemplateId(template.id);
    setMotionDuration(template.defaultDuration);
    setMotionImageUrl(null);   // clear any previous image
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  const EditorPanel = template.EditorPanel;

  return (
    <div className="flex flex-col h-full text-white">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06] shrink-0">
        <button
          onClick={onBack}
          className="flex items-center justify-center size-7 rounded-md hover:bg-white/6 text-white/50 hover:text-white/80 transition-colors"
        >
          <Icon icon="ph:arrow-left-bold" width="13" />
        </button>

        <div
          className="size-6 rounded-md flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `${template.accentColor}20`,
            border:          `1px solid ${template.accentColor}30`,
          }}
        >
          <Icon icon={template.icon} width="12" style={{ color: template.accentColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white/90 truncate leading-none">
            {template.title}
          </p>
          <p className="text-[9px] text-white/30 mt-0.5 truncate">
            {template.description}
          </p>
        </div>
      </div>

      {/* ── Body — template injects its own panel here ── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3 custom-scrollbar">
        {EditorPanel ? (
          <EditorPanel template={template} />
        ) : (
          // Fallback for templates that declare showPhone=true but have no EditorPanel yet
          <div className="flex items-center justify-center h-32 text-white/20 text-xs">
            Sin controles adicionales
          </div>
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}