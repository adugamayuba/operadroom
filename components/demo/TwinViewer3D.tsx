"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { AssetId, AssetKind, Severity } from "@/lib/demo/scenarios";
import { ASSETS } from "@/lib/demo/scenarios";

const Canvas3D = dynamic(() => import("./TwinCanvas").then((m) => m.TwinCanvas), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[320px] flex items-center justify-center bg-[var(--demo-surface-2)] border border-[var(--demo-border)]">
      <p className="text-[12px] text-[var(--demo-muted)]">Loading 3D twin…</p>
    </div>
  ),
});

type ViewMode = "facility" | "asset";

export function TwinViewer3D({
  assetId,
  severity,
  active,
}: {
  assetId: AssetId;
  severity: Severity;
  active: boolean;
}) {
  const [view, setView] = useState<ViewMode>("facility");
  const asset = ASSETS[assetId];

  const subtitle = useMemo(() => {
    if (view === "facility") return "Plant overview · Rheinland CDU / FCC / Storage";
    return `${asset.tag} · ${asset.name}`;
  }, [view, asset]);

  return (
    <section className="border border-[var(--demo-border)] bg-[var(--demo-surface)]">
      <div className="px-4 sm:px-5 py-3 border-b border-[var(--demo-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium text-[var(--demo-muted)]">Digital twin · 3D</p>
          <p className="text-[13px] text-[var(--demo-text)] mt-0.5">{subtitle}</p>
        </div>
        <div className="flex border border-[var(--demo-border)] text-[11px]">
          <button
            type="button"
            onClick={() => setView("facility")}
            className={`px-3 py-1.5 transition-colors ${
              view === "facility"
                ? "bg-[var(--demo-text)] text-[var(--demo-bg)]"
                : "text-[var(--demo-muted)] hover:text-[var(--demo-text)]"
            }`}
          >
            Facility
          </button>
          <button
            type="button"
            onClick={() => setView("asset")}
            className={`px-3 py-1.5 border-l border-[var(--demo-border)] transition-colors ${
              view === "asset"
                ? "bg-[var(--demo-text)] text-[var(--demo-bg)]"
                : "text-[var(--demo-muted)] hover:text-[var(--demo-text)]"
            }`}
          >
            Asset
          </button>
        </div>
      </div>
      <div className="h-[340px] sm:h-[420px] lg:h-[480px]">
        <Canvas3D
          view={view}
          assetId={assetId}
          assetKind={asset.kind}
          severity={severity}
          active={active}
          facilityPosition={asset.facilityPosition}
        />
      </div>
      <div className="px-4 py-2.5 border-t border-[var(--demo-border)] flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[var(--demo-muted)]">
        <span>Orbit: drag</span>
        <span>Pan: right-click</span>
        <span>Zoom: scroll</span>
        {view === "facility" && <span>Highlighted tag: {asset.tag}</span>}
      </div>
    </section>
  );
}

export type { AssetKind };
