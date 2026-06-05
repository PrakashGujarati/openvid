"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useMotionContext } from "@/app/contexts/MotionContext";
import { MotionTemplate } from "@/types/motion.types";
import { TemplateEditorShell } from "../TemplateEditorShell";
import { TEMPLATES } from "@/lib/template-registry";

// ─── Template card (thumbnail + title) ───────────────────────────────────────
function TemplateCard({
  template,
  isActive,
  onClick,
}: {
  template: MotionTemplate;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#17171a] text-left transition-all duration-300 hover:border-white/20 active:scale-[0.98]"
      >
        {/* Thumbnail placeholder */}
        <div className="relative aspect-video w-full shrink-0 bg-[#0d0d10]">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${template.accentColor}18 0%, transparent 70%)`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon icon={template.icon} width="20" style={{ color: `${template.accentColor}60` }} />
          </div>
        </div>

        <div className="border-t border-white/[0.05] bg-[#111113] px-4 py-3">
          <h3 className="truncate text-sm font-medium text-white">{template.title}</h3>
        </div>
      </button>

      {/* Active ring */}
      {isActive && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            boxShadow: `0 0 0 2px ${template.accentColor}`,
            border:    `1px solid ${template.accentColor}55`,
          }}
        />
      )}
    </div>
  );
}

// ─── MotionMenu ───────────────────────────────────────────────────────────────
export function MotionMenu() {
  const { selectedTemplateId, setSelectedTemplateId, setMotionDuration } = useMotionContext();
  const [openTemplate, setOpenTemplate] = useState<MotionTemplate | null>(null);

  // If a template with an editor is open, render the editor shell
  if (openTemplate) {
    return (
      <TemplateEditorShell
        template={openTemplate}
        onBack={() => setOpenTemplate(null)}
      />
    );
  }

  const handleClick = (template: MotionTemplate) => {
    if (!template.showPhone) {
      // "Solo video" — deactivate immediately, no editor
      setSelectedTemplateId("none");
      setMotionDuration(0);
      return;
    }
    // Templates with phone open their own editor
    setOpenTemplate(template);
  };

  return (
    <div className="p-4 flex flex-col gap-5 w-full bg-[#111113] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/90 font-semibold text-sm tracking-wide">
          <Icon icon="ph:film-strip-bold" width="16" className="text-blue-400" />
          <span>Motion</span>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-white/25 font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/[0.06]">
          Templates
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 items-start">
        {TEMPLATES.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            isActive={selectedTemplateId === t.id}
            onClick={() => handleClick(t)}
          />
        ))}
      </div>
    </div>
  );
}