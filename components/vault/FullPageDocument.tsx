"use client";

import type { AgentStage } from "@/lib/vault/agentFlow";
import type { VaultDocument } from "@/lib/vault/corpus";

const STAGE_ORDER: AgentStage[] = ["receive", "ocr", "classify", "tag", "extract", "graph", "index"];

function stageIndex(s: AgentStage) {
  return STAGE_ORDER.indexOf(s);
}

export function FullPageDocument({
  doc,
  activeStage,
  showOverlays = true,
  className = "",
}: {
  doc: VaultDocument;
  activeStage?: AgentStage;
  showOverlays?: boolean;
  className?: string;
}) {
  const isHandwritten = doc.condition === "handwritten" || doc.condition === "stained";
  const activeIdx = activeStage ? stageIndex(activeStage) : -1;

  const activeRegion = activeStage
    ? doc.regions.find((r) => r.stage === activeStage)
    : undefined;

  const cursorPos = activeRegion
    ? {
        top: activeRegion.top + activeRegion.height / 2,
        left: activeRegion.left + activeRegion.width / 2,
      }
    : null;

  return (
    <div className={`relative mx-auto w-full max-w-[420px] ${className}`}>
      {/* Page shadow on black */}
      <div className="vault-page-in relative aspect-[210/297] w-full shadow-[0_0_80px_rgba(255,255,255,0.06)]">
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            background: isHandwritten
              ? "linear-gradient(165deg, #ebe3d4 0%, #ddd4c2 45%, #d4cbb8 100%)"
              : doc.condition === "faded"
                ? "linear-gradient(180deg, #e4e0d6 0%, #d8d2c6 100%)"
                : "linear-gradient(180deg, #f0eeea 0%, #e8e6e0 100%)",
          }}
        >
          {/* Paper grain */}
          <div
            className="absolute inset-0 opacity-[0.35] pointer-events-none mix-blend-multiply"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Hole punches */}
          <div className="absolute left-[4%] top-[8%] w-2 h-2 rounded-full bg-black/20 border border-black/10" />
          <div className="absolute left-[4%] top-[50%] w-2 h-2 rounded-full bg-black/20 border border-black/10" />
          <div className="absolute left-[4%] top-[92%] w-2 h-2 rounded-full bg-black/20 border border-black/10" />

          {/* Coffee stain */}
          {(doc.condition === "stained" || doc.condition === "handwritten") && (
            <div
              className="absolute top-[12%] right-[8%] w-[22%] aspect-square rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(107,68,35,0.14) 0%, transparent 65%)" }}
            />
          )}

          {/* Fold crease */}
          <div className="absolute top-0 bottom-0 left-[52%] w-px bg-black/[0.06]" />

          {/* Content */}
          <div className="absolute inset-0 px-[10%] py-[8%] text-[#2a2218] overflow-hidden">
            {doc.stamp && (
              <div className="absolute top-[6%] right-[8%] border-2 border-[#8b4513]/50 px-2 py-0.5 rotate-[-8deg]">
                <span className="text-[9px] font-mono tracking-wider text-[#8b4513]/80 uppercase">{doc.stamp}</span>
              </div>
            )}

            <div
              className={`h-full flex flex-col ${isHandwritten ? "font-[family-name:var(--font-hand)]" : "font-mono"}`}
            >
              {doc.blocks.map((block, i) => {
                if (block.spacer) return <div key={i} className="h-3" />;
                const sizeClass =
                  block.size === "lg" ? "text-[15px] sm:text-[16px]" : block.size === "sm" ? "text-[11px]" : "text-[13px]";
                return (
                  <p
                    key={i}
                    className={`leading-[1.55] mb-1 ${sizeClass} ${block.handwritten ? "italic" : ""} ${
                      block.indent ? `pl-${block.indent * 4}` : ""
                    } ${block.highlight ? "bg-[#ffe566]/75 px-1 -mx-1 border-l-2 border-[#b8860b]" : ""}`}
                    style={block.indent ? { paddingLeft: `${block.indent * 12}px` } : undefined}
                  >
                    {block.text}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Footer scan metadata */}
          <div className="absolute bottom-[3%] left-[10%] right-[10%] flex justify-between text-[7px] font-mono uppercase tracking-widest text-black/35">
            <span>{doc.source.slice(0, 28)}</span>
            <span>
              {doc.page}/{doc.totalPages}
            </span>
          </div>
        </div>

        {/* Agent overlays */}
        {showOverlays && activeStage && (
          <div className="absolute inset-0 pointer-events-none">
            {/* OCR scan line */}
            {activeStage === "ocr" && (
              <div className="absolute left-0 right-0 h-[2px] bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.8)] vault-scan-line" />
            )}

            {/* Region boxes */}
            {doc.regions.map((region) => {
              const rIdx = stageIndex(region.stage);
              const isActive = region.stage === activeStage;
              const isPast = rIdx < activeIdx;
              if (rIdx > activeIdx && !isActive) return null;

              return (
                <div
                  key={region.id}
                  className={`absolute border transition-all duration-300 ${
                    isActive
                      ? "border-white bg-white/20 vault-region-pick vault-active-ring"
                      : isPast
                        ? "border-white/30 bg-white/5"
                        : "border-white/20"
                  }`}
                  style={{
                    top: `${region.top}%`,
                    left: `${region.left}%`,
                    width: `${region.width}%`,
                    height: `${region.height}%`,
                  }}
                >
                  {(isActive || isPast) && (
                    <span className="absolute -top-5 left-0 text-[8px] font-mono uppercase tracking-wider text-white bg-black/80 px-1.5 py-0.5 whitespace-nowrap">
                      {region.label}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Agent cursor */}
            {cursorPos && ["ocr", "tag", "extract", "classify"].includes(activeStage) && (
              <div
                className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-white vault-agent-cursor shadow-[0_0_16px_rgba(255,255,255,0.9)]"
                style={{ top: `${cursorPos.top}%`, left: `${cursorPos.left}%` }}
              />
            )}

            {/* Classify badge */}
            {activeStage === "classify" && (
              <div className="absolute top-2 left-2 bg-black/90 border border-white/40 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-white">
                {doc.type.replace("_", " ")}
              </div>
            )}

            {/* Index complete */}
            {activeStage === "index" && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-[11px] uppercase tracking-[0.25em] text-white border border-white px-4 py-2">
                  Indexed ✓
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
