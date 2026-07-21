"use client";

import type { VaultDocument } from "@/lib/vault/corpus";

const CONDITION_STYLE: Record<VaultDocument["condition"], string> = {
  handwritten: "font-[family-name:var(--font-demo)] italic",
  faded: "opacity-80",
  stained: "",
  typed: "font-mono text-[13px]",
};

export function ScannedDocument({
  doc,
  autoScrollHighlight,
}: {
  doc: VaultDocument;
  autoScrollHighlight?: boolean;
}) {
  const paperTone =
    doc.condition === "handwritten" || doc.condition === "stained"
      ? "bg-[#e8e0d0] text-[#2c2416]"
      : doc.condition === "faded"
        ? "bg-[#ddd8cc] text-[#3a3428]"
        : "bg-[#eceae4] text-[#1a1a1a]";

  return (
    <div className={`${paperTone} p-5 shadow-inner border border-[#c4b8a0] min-h-[280px] relative`}>
      {/* Coffee stain decoration */}
      {(doc.condition === "stained" || doc.condition === "handwritten") && (
        <div
          className="absolute top-8 right-6 w-16 h-16 rounded-full opacity-[0.12] pointer-events-none"
          style={{ background: "radial-gradient(circle, #6b4423 0%, transparent 70%)" }}
        />
      )}

      <div className="flex justify-between items-start gap-2 mb-4 pb-2 border-b border-[#c4b8a0]/60">
        <div>
          <p className="text-[10px] uppercase tracking-wider opacity-60">{doc.source}</p>
          <p className="text-[13px] font-semibold mt-0.5">{doc.title}</p>
        </div>
        <span className="text-[10px] opacity-50 shrink-0">{doc.date}</span>
      </div>

      <div className={`space-y-2 text-[14px] leading-relaxed ${CONDITION_STYLE[doc.condition]}`}>
        {doc.lines.map((line, i) => {
          if (!line.text) return <div key={i} className="h-2" />;
          return (
            <p
              key={i}
              id={line.highlight && autoScrollHighlight ? "vault-highlight" : undefined}
              className={
                line.highlight
                  ? "bg-[#ffe566]/90 box-decoration-clone px-1 -mx-1 py-0.5 border-l-2 border-[#c9a000]"
                  : undefined
              }
            >
              {line.text}
            </p>
          );
        })}
      </div>

      <p className="mt-6 text-[9px] opacity-40 uppercase tracking-widest">
        Scanned archive · Page {doc.page} · {doc.assetTags.join(" · ")}
      </p>
    </div>
  );
}
