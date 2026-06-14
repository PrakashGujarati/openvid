import { IMAGE_DEVICE_TEMPLATES } from "@/types";
import { Icon } from "@iconify/react";

export function DeviceCard({
  tpl,
  isActive,
  onClick,
}: {
  tpl: (typeof IMAGE_DEVICE_TEMPLATES)[number];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative w-40 shrink-0 snap-start mt-0.5">
      <button
        type="button"
        onClick={onClick}
        className={`group flex h-full w-full flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300 active:scale-[0.98] ${isActive
          ? "border-white/20 bg-[#1a1a1e]"
          : "border-white/6 bg-[#17171a] hover:border-white/20"
          }`}
      >
        <div className="relative aspect-3/4 w-full shrink-0 bg-[#0d0d10]">
          <div
            className="absolute inset-0"
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${tpl.accentColor}22 0%, transparent 70%)`
                : `linear-gradient(135deg, ${tpl.accentColor}10 0%, transparent 70%)`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon
              icon={tpl.icon}
              width="22"
              style={{
                color: isActive ? `${tpl.accentColor}cc` : `${tpl.accentColor}55`,
              }}
            />
          </div>

          {isActive && (
            <div
              className="absolute top-1.5 right-1.5 size-4 rounded-full flex items-center justify-center"
              style={{ background: tpl.accentColor }}
            >
              <Icon icon="mdi:check-bold" width={9} className="text-white" />
            </div>
          )}
        </div>

        <div className="border-t border-white/5 bg-[#111113] px-3 py-2.5">
          <h3
            className={`truncate text-xs font-semibold ${isActive ? "text-white" : "text-white/60"
              }`}
          >
            {tpl.title}
          </h3>
        </div>
      </button>

      {isActive && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: `inset 0 0 0 1.5px ${tpl.accentColor}88` }}
        />
      )}
    </div>
  );
}