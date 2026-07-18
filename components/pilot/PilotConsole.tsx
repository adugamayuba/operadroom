"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LogoMark } from "@/components/demo/LogoMark";
import { TwinViewer3D } from "@/components/demo/TwinViewer3D";
import { SAP_RELEASED_WO, useLiveSystem } from "@/components/demo/useLiveSystem";
import { useDemoTheme } from "@/components/demo/DemoThemeProvider";
import { trackEvent } from "@/lib/analytics";
import { POC_PROCESS } from "@/lib/demo/essa";
import { exportWorkOrderPdf } from "@/lib/demo/workOrderExport";
import { CDU1_ASSET_IDS, CDU1_ASSET_LIST, CDU1_ASSET_COUNT } from "@/lib/pilot/cdu1";
import {
  loadPhase0State,
  PHASE0_CHECKLIST,
  phase0Progress,
  savePhase0State,
} from "@/lib/pilot/phase0";
import { loadPilotMetrics, pilotKpis, recordRelease, savePilotMetrics } from "@/lib/pilot/metrics";
import type { ReplayScenario } from "@/lib/pilot/replay";
import { REPLAY_SCENARIOS } from "@/lib/pilot/replay";
import { exportSapPmCsv } from "@/lib/pilot/sapExport";
import { PILOT_ROLES, PILOT_TENANT, type PilotRole } from "@/lib/pilot/tenant";

function PilotNav() {
  const { theme, toggle } = useDemoTheme();
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[var(--demo-surface)] border-b border-[var(--demo-border)] pt-[env(safe-area-inset-top)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <LogoMark className="w-4 h-4 opacity-80" />
          <span className="text-[13px] font-semibold tracking-wide uppercase">Operadroom Pilot</span>
          <span className="hidden sm:inline text-[10px] text-[var(--demo-muted)] border-l border-[var(--demo-border)] pl-2 ml-1 uppercase tracking-wider">
            {PILOT_TENANT.id}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <Link href="/demo" className="text-[var(--demo-muted)] hover:text-[var(--demo-text)]">
            Sandbox demo
          </Link>
          <button type="button" onClick={toggle} className="text-[11px] border border-[var(--demo-border)] px-2.5 py-1 text-[var(--demo-muted)] uppercase tracking-wider">
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </div>
    </header>
  );
}

export function PilotConsole() {
  const sys = useLiveSystem("p2047");
  const [role, setRole] = useState<PilotRole>("engineer");
  const [phase0, setPhase0] = useState<Record<string, boolean>>({});
  const [metrics, setMetrics] = useState(loadPilotMetrics());
  const [activeReplay, setActiveReplay] = useState<ReplayScenario | null>(null);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState("");

  const canRelease = PILOT_ROLES.find((r) => r.id === role)?.canRelease ?? false;
  const p0 = phase0Progress(phase0);
  const kpis = pilotKpis(metrics);
  const cduSummaries = useMemo(
    () => sys.assetSummaries.filter((s) => CDU1_ASSET_IDS.includes(s.id)),
    [sys.assetSummaries]
  );

  useEffect(() => {
    setPhase0(loadPhase0State());
    setMetrics(loadPilotMetrics());
  }, []);

  const togglePhase0 = (id: string) => {
    const next = { ...phase0, [id]: !phase0[id] };
    setPhase0(next);
    savePhase0State(next);
  };

  const loadReplay = (r: ReplayScenario) => {
    setActiveReplay(r);
    sys.setAssetId(r.assetId);
    sys.setSeverity(r.severity);
    sys.resetMonitoring();
    trackEvent("pilot_select_replay", { id: r.id, asset: r.assetId });
  };

  const runReplay = () => {
    if (!activeReplay) return;
    sys.setAssetId(activeReplay.assetId);
    sys.setSeverity(activeReplay.severity);
    trackEvent("pilot_run_replay", { id: activeReplay.id });
    sys.triggerAnomaly();
  };

  const handleRelease = useCallback(() => {
    if (!sys.workOrder || !canRelease) return;
    sys.approveWorkOrder(releaseNotes);
    const baseline = activeReplay?.baselineHours ?? 5;
    const next = recordRelease(metrics, {
      assetTag: sys.asset.tag,
      replayId: activeReplay?.id,
      elapsedMs: sys.elapsed,
      baselineHours: baseline,
      recordsCited: activeReplay?.recordsExpected ?? 3,
      majorRewrite: false,
      reelinId: sys.workOrder.reelinId,
    });
    setMetrics(next);
    savePilotMetrics(next);
    setReleaseOpen(false);
    setReleaseNotes("");
    trackEvent("pilot_release", { asset: sys.assetId, replay: activeReplay?.id ?? "" });
  }, [sys, canRelease, releaseNotes, metrics, activeReplay]);

  return (
    <>
      <PilotNav />
      <main className="pt-14 pb-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 space-y-4">
          <div className="py-5 border-b border-[var(--demo-border-subtle)]">
            <p className="demo-label">{PILOT_TENANT.facility} · {PILOT_TENANT.facilityCode}</p>
            <h1 className="mt-1 text-xl font-semibold">{PILOT_TENANT.name}</h1>
            <p className="mt-2 text-[13px] text-[var(--demo-muted)] max-w-3xl">
              {PILOT_TENANT.process} · {CDU1_ASSET_COUNT} assets · {PILOT_TENANT.scenario}. Replay historical CDU-1
              incidents, run ESSA execution, engineer HITL release, track OPEX metrics for {PILOT_TENANT.durationDays}-day POC.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="demo-panel p-4">
              <p className="demo-label">Pilot role</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {PILOT_ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`text-[11px] px-3 py-2 border ${role === r.id ? "demo-field-focus" : "border-[var(--demo-border)] text-[var(--demo-muted)]"}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={`demo-panel p-4 ${p0.complete ? "demo-field-ok" : ""}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="demo-label">Phase 0 · data layer</p>
                  <p className="text-[13px] font-medium mt-1">{p0.done}/{p0.total} connected</p>
                </div>
                {p0.complete && <span className="demo-pill demo-field-ok text-[10px]">Agent armed</span>}
              </div>
              <div className="mt-3 space-y-2">
                {PHASE0_CHECKLIST.map((item) => (
                  <label key={item.id} className="flex items-start gap-2 text-[11px] cursor-pointer">
                    <input type="checkbox" checked={!!phase0[item.id]} onChange={() => togglePhase0(item.id)} className="mt-0.5" />
                    <span>
                      <span className="font-medium">{item.layer}</span>
                      <span className="text-[var(--demo-muted)]"> — {item.detail}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: "CDU-1 assets", value: String(CDU1_ASSET_COUNT) },
              { label: "Released", value: String(metrics.releasesApproved) },
              { label: "Hours saved", value: metrics.totalBaselineHoursSaved.toFixed(1) },
              { label: "Avg draft (min)", value: kpis.avgDraftMin.toFixed(1) },
              { label: "Records / event", value: kpis.avgRecords.toFixed(1) },
            ].map((m) => (
              <div key={m.label} className="border border-[var(--demo-border)] px-3 py-2 bg-[var(--demo-surface-2)]">
                <p className="demo-label">{m.label}</p>
                <p className="text-[14px] font-mono font-medium mt-1">{m.value}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="demo-panel p-4 lg:col-span-1">
              <p className="demo-label">Historical replay · CDU-1</p>
              <p className="text-[11px] text-[var(--demo-muted)] mt-1 mb-3">5 incidents from unit data (sandbox)</p>
              <div className="space-y-2 max-h-[280px] overflow-y-auto demo-scroll">
                {REPLAY_SCENARIOS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => loadReplay(r)}
                    className={`w-full text-left border px-3 py-2 text-[11px] ${
                      activeReplay?.id === r.id ? "demo-field-focus" : "border-[var(--demo-border-subtle)] hover:border-[var(--demo-border)]"
                    }`}
                  >
                    <p className="font-medium">{r.title}</p>
                    <p className="text-[var(--demo-muted)] mt-0.5">{r.date} · baseline {r.baselineHours}h</p>
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!activeReplay || sys.mode === "incident" || !p0.complete}
                onClick={runReplay}
                className="demo-btn-primary w-full mt-3 disabled:opacity-40"
              >
                {!p0.complete ? "Complete Phase 0 first" : sys.mode === "incident" ? "Running…" : "Run replay incident"}
              </button>
            </div>

            <div className="demo-panel p-4 lg:col-span-2">
              <p className="demo-label">CDU-1 asset registry · {CDU1_ASSET_COUNT} tags</p>
              <div className="overflow-x-auto mt-2 max-h-[320px] overflow-y-auto demo-scroll">
                <table className="w-full text-[10px] min-w-[520px]">
                  <thead>
                    <tr className="text-[var(--demo-faint)] border-b border-[var(--demo-border-subtle)]">
                      <th className="text-left py-1.5 font-normal">Tag</th>
                      <th className="text-left py-1.5 font-normal">Name</th>
                      <th className="text-left py-1.5 font-normal">SAP FL</th>
                      <th className="text-right py-1.5 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CDU1_ASSET_LIST.map((a) => {
                      const sum = cduSummaries.find((s) => s.id === a.id);
                      return (
                        <tr
                          key={a.id}
                          className={`border-b border-[var(--demo-border-subtle)] cursor-pointer ${sys.assetId === a.id ? "bg-[var(--demo-focus-soft)]" : ""}`}
                          onClick={() => sys.setAssetId(a.id)}
                        >
                          <td className="py-1.5 font-mono font-medium">{a.tag}</td>
                          <td className="py-1.5 text-[var(--demo-muted)]">{a.name}</td>
                          <td className="py-1.5 font-mono text-[var(--demo-faint)]">{a.functionalLocation}</td>
                          <td className="py-1.5 text-right">
                            <span className="demo-pill demo-field-ok text-[9px]">{sum?.status ?? "OK"}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <TwinViewer3D
            assetId={sys.assetId}
            severity={sys.severity}
            mode={sys.mode}
            phase={sys.phase}
            assetSummaries={cduSummaries}
            allReadings={sys.allReadings}
            markerStatuses={sys.markerStatuses}
            onAssetSelect={(id) => {
              if (CDU1_ASSET_IDS.includes(id)) sys.setAssetId(id);
            }}
          />

          <div className="demo-panel p-4">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div>
                <p className="demo-label">Execution control · {POC_PROCESS.code}</p>
                <p className="text-[12px] mt-1">
                  Focus: <span className="font-mono">{sys.asset.tag}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={!sys.canTrigger || !p0.complete} onClick={runReplay} className="demo-btn-primary">
                  {sys.mode === "incident" ? "Running…" : "Inject event"}
                </button>
                <button type="button" onClick={sys.resetMonitoring} className="demo-btn-secondary">
                  Reset
                </button>
                {sys.canApprove && canRelease && !releaseOpen && (
                  <button type="button" onClick={() => setReleaseOpen(true)} className="demo-btn-release">
                    Engineer release
                  </button>
                )}
              </div>
            </div>
            {releaseOpen && sys.canApprove && (
              <div className="mt-4 pt-4 border-t border-[var(--demo-border-subtle)]">
                <textarea
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  rows={3}
                  placeholder="Field notes for HITL release…"
                  className="w-full border border-[var(--demo-border)] bg-[var(--demo-surface)] px-3 py-2 text-[12px]"
                />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={handleRelease} className="demo-btn-release">
                    Release to SAP PM
                  </button>
                  <button type="button" onClick={() => setReleaseOpen(false)} className="demo-btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {sys.approved && sys.workOrder && (
              <div className="mt-4 demo-field-ok p-3 flex flex-wrap gap-2 items-center justify-between">
                <p className="text-[12px] font-medium">Released · WO {SAP_RELEASED_WO}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="demo-btn-secondary text-[10px] py-1.5 px-2"
                    onClick={() =>
                      exportWorkOrderPdf(sys.workOrder!, {
                        sapNumber: SAP_RELEASED_WO,
                        engineerNotes: releaseNotes,
                        reelinId: sys.workOrder!.reelinId,
                        elapsedMs: sys.elapsed,
                      })
                    }
                  >
                    Export PDF
                  </button>
                  <button
                    type="button"
                    className="demo-btn-secondary text-[10px] py-1.5 px-2"
                    onClick={() =>
                      exportSapPmCsv(sys.workOrder!, { sapNumber: SAP_RELEASED_WO, engineerNotes: releaseNotes })
                    }
                  >
                    Export SAP CSV
                  </button>
                </div>
              </div>
            )}
          </div>

          {sys.mode !== "monitoring" && (
            <div className="demo-panel p-4 max-h-[240px] overflow-y-auto demo-scroll">
              <p className="demo-label mb-2">Agent log · ESSA pipeline</p>
              {sys.logs.slice(0, sys.visibleLogs).map((log) => (
                <div key={log.id} className="text-[11px] border-l-2 border-[var(--demo-border)] pl-2 py-1 mb-1">
                  <span className="text-[var(--demo-faint)] font-mono">{log.timestamp}</span> {log.message}
                </div>
              ))}
            </div>
          )}

          {metrics.events.length > 0 && (
            <div className="demo-panel p-4">
              <p className="demo-label">Pilot event log</p>
              <table className="w-full text-[10px] mt-2">
                <thead>
                  <tr className="text-[var(--demo-faint)]">
                    <th className="text-left py-1">Asset</th>
                    <th className="text-left py-1">Draft min</th>
                    <th className="text-left py-1">Baseline h</th>
                    <th className="text-left py-1">Records</th>
                    <th className="text-left py-1">Reelin ID</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.events.slice(0, 10).map((e) => (
                    <tr key={e.id} className="border-t border-[var(--demo-border-subtle)]">
                      <td className="py-1.5">{e.assetTag}</td>
                      <td className="py-1.5 font-mono">{e.draftMinutes}</td>
                      <td className="py-1.5 font-mono">{e.baselineHours}</td>
                      <td className="py-1.5">{e.recordsCited}</td>
                      <td className="py-1.5 font-mono text-[var(--demo-faint)] truncate max-w-[140px]">{e.reelinId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
