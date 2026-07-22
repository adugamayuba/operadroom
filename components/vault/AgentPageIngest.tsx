"use client";

import { FullPageDocument } from "@/components/vault/FullPageDocument";
import { AGENT_STAGES, type AgentDocJob, type AgentStage } from "@/lib/vault/agentFlow";
import { getDocument } from "@/lib/vault/corpus";

export function AgentPageIngest({
  job,
  stageIndex,
  extractedLabels,
}: {
  job: AgentDocJob;
  stageIndex: number;
  extractedLabels: string[];
}) {
  const doc = getDocument(job.docId);
  const currentStage = AGENT_STAGES[stageIndex]?.id as AgentStage | undefined;

  if (!doc) {
    return <p className="text-[11px] text-white/40">Document not found</p>;
  }

  return (
    <div className="grid lg:grid-cols-[1fr_200px] gap-6 items-start">
      <div className="relative">
        <div className="vault-label mb-3 flex items-center justify-between">
          <span>Agent processing · {job.name}</span>
          <span className="font-mono text-white/30 normal-case tracking-normal">
            {stageIndex + 1}/{AGENT_STAGES.length}
          </span>
        </div>
        <FullPageDocument doc={doc} activeStage={currentStage} showOverlays />
        <p className="mt-3 text-[10px] text-center text-white/35 uppercase tracking-[0.15em]">
          {currentStage ? AGENT_STAGES[stageIndex].label : "…"} — {AGENT_STAGES[stageIndex]?.detail}
        </p>
      </div>

      <div className="space-y-3">
        <div className="vault-panel p-3">
          <p className="vault-label mb-2">Pipeline</p>
          <div className="space-y-1">
            {AGENT_STAGES.map((s, i) => (
              <div
                key={s.id}
                className={`text-[10px] px-2 py-1 border ${
                  i === stageIndex
                    ? "border-white text-white bg-white/10"
                    : i < stageIndex
                      ? "border-white/25 text-white/50"
                      : "border-white/10 text-white/25"
                }`}
              >
                {i < stageIndex ? "✓ " : i === stageIndex ? "▸ " : "  "}
                {s.label}
              </div>
            ))}
          </div>
        </div>

        <div className="vault-panel p-3 min-h-[120px]">
          <p className="vault-label mb-2">Extracted</p>
          <div className="flex flex-wrap gap-1.5">
            {extractedLabels.length === 0 && (
              <span className="text-[10px] text-white/30">Agent picking…</span>
            )}
            {extractedLabels.map((label, i) => (
              <span
                key={label}
                className="vault-chip-in text-[9px] font-mono uppercase tracking-wider border border-white/30 px-2 py-1 text-white/80"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
