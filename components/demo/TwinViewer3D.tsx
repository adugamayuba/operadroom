"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ASSETS } from "@/lib/demo/scenarios";
import type { AssetId, Severity } from "@/lib/demo/scenarios";
import type { AssetHealthSummary, LiveReadingState, MarkerStatus, SystemMode } from "@/lib/demo/liveSystem";

const Canvas3D = dynamic(() => import("./TwinCanvas").then((m) => m.TwinCanvas), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[320px] flex items-center justify-center bg-[var(--demo-surface-2)]">
      <p className="text-[12px] text-[var(--demo-muted)]">Loading 3D twin…</p>
    </div>
  ),
});

type ViewMode = "facility" | "asset";

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <div className="h-4 bg-[var(--demo-border-subtle)]/50" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 48},${16 - ((v - min) / range) * 14}`).join(" ");
  return (
    <svg viewBox="0 0 48 16" className="w-12 h-4 shrink-0" preserveAspectRatio="none">
      <polyline fill="none" stroke="var(--demo-muted)" strokeWidth="1" points={pts} />
    </svg>
  );
}

function statusLabel(s: AssetHealthSummary["status"]) {
  if (s === "breached") return "Alert";
  if (s === "incident") return "Event";
  if (s === "selected") return "Focus";
  return "OK";
}

export function TwinViewer3D({
  assetId,
  severity,
  mode,
  phase,
  assetSummaries,
  allReadings,
  markerStatuses,
  onAssetSelect,
}: {
  assetId: AssetId;
  severity: Severity;
  mode: SystemMode;
  phase: string;
  assetSummaries: AssetHealthSummary[];
  allReadings: Record<AssetId, LiveReadingState[]>;
  markerStatuses: Record<AssetId, MarkerStatus>;
  onAssetSelect: (id: AssetId) => void;
}) {
  const [view, setView] = useState<ViewMode>("facility");
  const asset = ASSETS[assetId];
  const incident = mode === "incident";
  const selectedSummary = assetSummaries.find((s) => s.id === assetId);
  const selectedReadings = allReadings[assetId] ?? [];

  const handleSelect = (id: AssetId) => {
    onAssetSelect(id);
    setView("asset");
  };

  return (
    <section className="border border-[var(--demo-border)] bg-[var(--demo-surface)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--demo-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 w-2 h-2 rounded-full ${incident ? "bg-[var(--demo-text)] demo-live-pulse" : "bg-[var(--demo-muted)] demo-live-pulse"}`} />
          <div>
            <p className="text-[11px] text-[var(--demo-muted)]">
              Digital twin · {incident ? "Incident on " + ASSETS[assetId].tag : `Monitoring ${assetSummaries.length} assets`}
            </p>
            <p className="text-[13px] font-medium text-[var(--demo-text)]">
              {view === "facility" ? "Rheinland facility overview" : `${asset.tag} · ${asset.name}`}
            </p>
          </div>
        </div>
        <div className="flex border border-[var(--demo-border)] text-[11px] shrink-0">
          <button type="button" onClick={() => setView("facility")} className={`px-3 py-1.5 ${view === "facility" ? "bg-[var(--demo-text)] text-[var(--demo-bg)]" : "text-[var(--demo-muted)]"}`}>
            Plant
          </button>
          <button type="button" onClick={() => setView("asset")} className={`px-3 py-1.5 border-l border-[var(--demo-border)] ${view === "asset" ? "bg-[var(--demo-text)] text-[var(--demo-bg)]" : "text-[var(--demo-muted)]"}`}>
            Asset detail
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px]">
        <div className="h-[320px] sm:h-[400px] lg:h-[460px] border-b lg:border-b-0 lg:border-r border-[var(--demo-border)]">
          <Canvas3D
            view={view}
            assetId={assetId}
            assetKind={asset.kind}
            severity={severity}
            active={incident || phase !== "monitoring"}
            facilityPosition={asset.facilityPosition}
            onAssetSelect={handleSelect}
            mode={mode}
            markerStatuses={markerStatuses}
          />
        </div>

        <aside className="bg-[var(--demo-surface-2)] flex flex-col max-h-[320px] lg:max-h-[460px]">
          <div className="px-3 py-2 border-b border-[var(--demo-border-subtle)] flex justify-between items-center shrink-0">
            <p className="demo-label">Live facility scan</p>
            <span className="text-[10px] font-mono text-[var(--demo-muted)]">
              {assetSummaries.filter((s) => s.status === "normal" || s.status === "selected").length}/{assetSummaries.length} OK
            </span>
          </div>
          <div className="flex-1 overflow-y-auto demo-scroll">
            {assetSummaries.map((summary) => {
              const readings = allReadings[summary.id] ?? [];
              const primary = readings[0];
              const isSelected = summary.id === assetId;
              return (
                <button
                  key={summary.id}
                  type="button"
                  onClick={() => handleSelect(summary.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-[var(--demo-border-subtle)] hover:bg-[var(--demo-surface)] transition-colors ${
                    isSelected ? "bg-[var(--demo-surface)] border-l-2 border-l-[var(--demo-text)]" : "border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[12px] font-medium">{summary.tag}</span>
                      <span className="text-[10px] text-[var(--demo-muted)] ml-2">{statusLabel(summary.status)}</span>
                    </div>
                    {primary && (
                      <MiniSparkline data={primary.history.length > 1 ? primary.history : [primary.baseline, primary.value]} />
                    )}
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-[var(--demo-muted)]">
                    <span className="truncate pr-2">{summary.primaryLabel}</span>
                    {primary && (
                      <span className="font-mono tabular-nums shrink-0">
                        {primary.value < 1 ? primary.value.toFixed(3) : primary.value.toFixed(1)} {primary.unit}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {selectedSummary && (
            <div className="px-3 py-2 border-t border-[var(--demo-border)] bg-[var(--demo-surface)] shrink-0">
              <p className="text-[10px] text-[var(--demo-muted)]">Focused · {selectedSummary.tag}</p>
              <p className="text-[11px] mt-0.5">{selectedSummary.name}</p>
            </div>
          )}
        </aside>
      </div>

      <div className="px-4 py-2 border-t border-[var(--demo-border)] flex flex-wrap gap-x-4 text-[10px] text-[var(--demo-muted)]">
        <span>Click tag in 3D or list to inspect</span>
        <span>All assets streaming</span>
        <span>{selectedReadings.length} tags on focus asset</span>
      </div>
    </section>
  );
}
