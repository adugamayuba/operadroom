"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ASSETS } from "@/lib/demo/scenarios";
import type { AssetId, Severity } from "@/lib/demo/scenarios";
import type { LiveReadingState, SystemMode } from "@/lib/demo/liveSystem";

const Canvas3D = dynamic(() => import("./TwinCanvas").then((m) => m.TwinCanvas), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[320px] flex items-center justify-center bg-[var(--demo-surface-2)]">
      <p className="text-[12px] text-[var(--demo-muted)]">Loading 3D twin…</p>
    </div>
  ),
});

type ViewMode = "facility" | "asset";

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return <div className="h-8 bg-[var(--demo-surface-2)]" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 32;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline fill="none" stroke="var(--demo-muted)" strokeWidth="1.2" points={pts} />
    </svg>
  );
}

export function TwinViewer3D({
  assetId,
  severity,
  mode,
  phase,
  readings,
  onAssetSelect,
  onViewAsset,
}: {
  assetId: AssetId;
  severity: Severity;
  mode: SystemMode;
  phase: string;
  readings: LiveReadingState[];
  onAssetSelect: (id: AssetId) => void;
  onViewAsset?: (id: AssetId) => void;
}) {
  const [view, setView] = useState<ViewMode>("facility");
  const asset = ASSETS[assetId];
  const incident = mode === "incident";

  useEffect(() => {
    if (view === "asset") return;
  }, [assetId, view]);

  const handleSelect = (id: AssetId) => {
    onAssetSelect(id);
    onViewAsset?.(id);
  };

  return (
    <section className="border border-[var(--demo-border)] bg-[var(--demo-surface)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--demo-border)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`shrink-0 w-2 h-2 rounded-full ${
              incident ? "bg-[var(--demo-text)] demo-live-pulse" : "bg-[var(--demo-muted)]"
            }`}
          />
          <div className="min-w-0">
            <p className="text-[11px] text-[var(--demo-muted)]">
              Digital twin · {incident ? "Incident response" : "Live monitoring"}
            </p>
            <p className="text-[13px] font-medium text-[var(--demo-text)] truncate">
              {view === "facility" ? FACILITY_LABEL : `${asset.tag} · ${asset.name}`}
            </p>
          </div>
        </div>
        <div className="flex border border-[var(--demo-border)] text-[11px] shrink-0">
          <button
            type="button"
            onClick={() => setView("facility")}
            className={`px-3 py-1.5 ${view === "facility" ? "bg-[var(--demo-text)] text-[var(--demo-bg)]" : "text-[var(--demo-muted)]"}`}
          >
            Plant
          </button>
          <button
            type="button"
            onClick={() => setView("asset")}
            className={`px-3 py-1.5 border-l border-[var(--demo-border)] ${view === "asset" ? "bg-[var(--demo-text)] text-[var(--demo-bg)]" : "text-[var(--demo-muted)]"}`}
          >
            Asset
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px]">
        <div className="h-[300px] sm:h-[380px] lg:h-[440px] border-b lg:border-b-0 lg:border-r border-[var(--demo-border)]">
          <Canvas3D
            view={view}
            assetId={assetId}
            assetKind={asset.kind}
            severity={severity}
            active={incident || phase !== "monitoring"}
            facilityPosition={asset.facilityPosition}
            onAssetSelect={handleSelect}
            mode={mode}
          />
        </div>

        <aside className="p-4 bg-[var(--demo-surface-2)] max-h-[280px] lg:max-h-none overflow-y-auto demo-scroll">
          <p className="demo-label">{asset.tag} · live tags</p>
          <p className="text-[11px] text-[var(--demo-muted)] mt-1 mb-3">{asset.unit}</p>
          <div className="space-y-3">
            {readings.map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[var(--demo-text)] truncate pr-2">{r.label}</span>
                  <span className={`font-mono tabular-nums shrink-0 ${r.breached ? "font-semibold" : ""}`}>
                    {r.value < 1 && r.value > 0 ? r.value.toFixed(4) : r.value.toFixed(1)}
                  </span>
                </div>
                <Sparkline data={r.history.length > 1 ? r.history : [r.baseline, r.value]} />
                {r.breached && (
                  <p className="text-[10px] text-[var(--demo-text)] mt-1 font-medium">Limit exceeded</p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-[var(--demo-faint)]">
            Click a tag in plant view to inspect equipment
          </p>
        </aside>
      </div>

      <div className="px-4 py-2 border-t border-[var(--demo-border)] flex flex-wrap gap-x-4 text-[10px] text-[var(--demo-muted)]">
        <span>Drag to orbit</span>
        <span>Click tag to select</span>
        <span>{asset.twinSource}</span>
      </div>
    </section>
  );
}

const FACILITY_LABEL = "Rheinland · CDU / FCC / Tank farm";
