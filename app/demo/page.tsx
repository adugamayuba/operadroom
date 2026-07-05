"use client";

import Link from "next/link";
import { LogoMark } from "@/components/demo/LogoMark";
import { useDemoTheme } from "@/components/demo/DemoThemeProvider";
import { TwinViewer3D } from "@/components/demo/TwinViewer3D";
import { phaseIndex, useLiveSystem } from "@/components/demo/useLiveSystem";
import { trackEvent } from "@/lib/analytics";
import { ASSET_LIST, FACILITY, getSeverityMeta, type Severity, type SimPhase } from "@/lib/demo/scenarios";
import type { FixCandidate } from "@/lib/demo/liveSystem";

function formatUptime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function DemoNav({ uptimeSec }: { uptimeSec: number }) {
  const { theme, toggle } = useDemoTheme();
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[var(--demo-surface)] border-b border-[var(--demo-border)] pt-[env(safe-area-inset-top)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <LogoMark className="w-4 h-4 opacity-80" />
          <span className="text-[13px] font-semibold">Operadroom</span>
        </Link>
        <span className="hidden md:block text-[11px] font-mono text-[var(--demo-muted)]">
          Uptime {formatUptime(uptimeSec)}
        </span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggle} className="text-[11px] border border-[var(--demo-border)] px-2.5 py-1 text-[var(--demo-muted)]">
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <Link href="/" className="text-[11px] text-[var(--demo-muted)]">Landing</Link>
        </div>
      </div>
    </header>
  );
}

function SystemStatusBar({
  mode,
  phase,
  lastScan,
  assetTag,
}: {
  mode: string;
  phase: SimPhase;
  lastScan: Date;
  assetTag: string;
}) {
  const labels: Record<string, string> = {
    monitoring: "Monitoring",
    incident: "Incident response",
    resolved: "Resolved",
  };
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 border border-[var(--demo-border)] bg-[var(--demo-surface)]">
      {[
        { label: "System state", value: labels[mode] ?? mode },
        { label: "Selected asset", value: assetTag },
        { label: "Pipeline", value: phase === "monitoring" ? "Idle" : phase.replace("_", " ") },
        { label: "Last scan", value: lastScan.toLocaleTimeString("en-GB") },
      ].map((item) => (
        <div key={item.label} className="px-4 py-3 border-r border-[var(--demo-border-subtle)] last:border-r-0">
          <p className="demo-label">{item.label}</p>
          <p className="mt-1 text-[12px] font-medium font-mono capitalize">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function PhaseTimeline({ phase }: { phase: SimPhase }) {
  const steps = [
    { key: "detecting", label: "Detect" },
    { key: "records", label: "Records" },
    { key: "analyze", label: "Analyze" },
    { key: "select", label: "Select fix" },
    { key: "inventory", label: "Inventory" },
    { key: "review", label: "Review" },
  ];
  const current = phaseIndex(phase);

  return (
    <div className="demo-panel p-4">
      <p className="demo-label mb-3">Autonomous response pipeline</p>
      <div className="flex gap-1">
        {steps.map((step, i) => {
          const idx = phaseIndex(step.key as SimPhase);
          const done = current > idx || phase === "approved";
          const active = phase === step.key;
          return (
            <div key={step.key} className="flex-1 min-w-0">
              <div className={`h-1 ${done ? "bg-[var(--demo-text)]" : active ? "bg-[var(--demo-muted)]" : "bg-[var(--demo-border-subtle)]"}`} />
              <p className={`mt-2 text-[10px] truncate ${active ? "font-medium" : "text-[var(--demo-muted)]"}`}>{step.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FixAnalysisPanel({ fixes, visible, phase }: { fixes: FixCandidate[]; visible: boolean; phase: SimPhase }) {
  if (!visible || phaseIndex(phase) < phaseIndex("analyze")) return null;
  return (
    <div className="demo-panel p-4 demo-fade-in">
      <p className="demo-label mb-3">Corrective procedure analysis</p>
      <div className="space-y-2">
        {fixes.map((f) => (
          <div
            key={f.id}
            className={`flex items-start justify-between gap-3 px-3 py-2 border ${
              f.selected ? "border-[var(--demo-text)] bg-[var(--demo-accent-soft)]" : "border-[var(--demo-border-subtle)]"
            }`}
          >
            <div className="min-w-0">
              <p className="text-[12px] font-medium">{f.title}</p>
              <p className="text-[10px] text-[var(--demo-muted)] mt-0.5">{f.source} · {f.downtimeHours}h downtime</p>
            </div>
            <span className="text-[11px] font-mono shrink-0">{(f.score * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${32 - ((v - min) / range) * 28}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" className="w-full h-6 mt-1" preserveAspectRatio="none">
      <polyline fill="none" stroke="var(--demo-muted)" strokeWidth="1" points={pts} />
    </svg>
  );
}

export default function DemoPage() {
  const sys = useLiveSystem("p2047");
  const meta = getSeverityMeta(sys.severity);

  const handleTrigger = () => {
    trackEvent("demo_trigger_anomaly", { asset: sys.assetId, severity: sys.severity });
    sys.triggerAnomaly();
  };

  const handleApprove = () => {
    trackEvent("demo_approve", { asset: sys.assetId, severity: sys.severity });
    sys.approveWorkOrder();
  };

  return (
    <>
      <DemoNav uptimeSec={sys.uptimeSec} />
      <main className="pt-14 pb-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 space-y-4">
          <div className="py-5 border-b border-[var(--demo-border-subtle)]">
            <p className="demo-label">Rheinland POC · live operations sandbox</p>
            <h1 className="mt-1 text-xl font-semibold">Continuous monitoring · on-demand incident injection</h1>
            <p className="mt-2 text-[13px] text-[var(--demo-muted)] max-w-2xl">
              System runs continuously. Select equipment, inject an anomaly, and watch autonomous detection, record retrieval, fix analysis, and work order drafting.
            </p>
          </div>

          <SystemStatusBar mode={sys.mode} phase={sys.phase} lastScan={sys.lastScan} assetTag={sys.asset.tag} />

          <TwinViewer3D
            assetId={sys.assetId}
            severity={sys.severity}
            mode={sys.mode}
            phase={sys.phase}
            readings={sys.readings}
            onAssetSelect={sys.selectAsset}
          />

          <div className="demo-panel p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="demo-label">Control</p>
                <h2 className="text-base font-semibold mt-1">{FACILITY.name}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!sys.canTrigger}
                  onClick={handleTrigger}
                  className="demo-btn-primary"
                >
                  {sys.mode === "incident" ? "Response in progress…" : "Inject anomaly"}
                </button>
                <button type="button" onClick={sys.resetMonitoring} className="demo-btn-secondary">
                  Return to monitoring
                </button>
                {sys.canApprove && (
                  <button type="button" onClick={handleApprove} className="demo-btn-secondary font-medium">
                    Engineer approval
                  </button>
                )}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--demo-border-subtle)]">
              <div>
                <label className="demo-label block mb-2">Equipment</label>
                <select
                  value={sys.assetId}
                  disabled={sys.mode === "incident"}
                  onChange={(e) => sys.setAssetId(e.target.value as typeof sys.assetId)}
                  className="w-full border border-[var(--demo-border)] bg-[var(--demo-surface-2)] px-3 py-2 text-[13px] disabled:opacity-50"
                >
                  {ASSET_LIST.map((a) => (
                    <option key={a.id} value={a.id}>{a.tag} — {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="demo-label block mb-2">Inject severity</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["advisory", "warning", "critical"] as Severity[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={sys.mode === "incident"}
                      onClick={() => sys.setSeverity(s)}
                      className={`py-2 text-[11px] font-medium border ${
                        sys.severity === s
                          ? "border-[var(--demo-text)] bg-[var(--demo-accent-soft)]"
                          : "border-[var(--demo-border)] text-[var(--demo-muted)]"
                      }`}
                    >
                      {getSeverityMeta(s).label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {sys.mode !== "monitoring" && <PhaseTimeline phase={sys.phase} />}

          {sys.mode === "incident" && sys.elapsed > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-[var(--demo-border)]">
              {[
                { label: "Alert", value: meta.alertCode },
                { label: "Priority", value: meta.priority.split(" — ")[0] },
                { label: "Window", value: meta.responseWindow },
                { label: "Elapsed", value: `${(sys.elapsed / 1000).toFixed(1)} s` },
              ].map((m) => (
                <div key={m.label} className="px-4 py-3 border-r border-[var(--demo-border-subtle)] last:border-r-0">
                  <p className="demo-label">{m.label}</p>
                  <p className="mt-1 text-[12px] font-mono">{m.value}</p>
                </div>
              ))}
            </div>
          )}

          <FixAnalysisPanel fixes={sys.fixes} visible={sys.mode === "incident"} phase={sys.phase} />

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Telemetry */}
            <div className="demo-panel flex flex-col min-h-[360px]">
              <div className="px-4 py-3 border-b border-[var(--demo-border-subtle)] flex justify-between">
                <div>
                  <p className="demo-label">01 · Telemetry</p>
                  <p className="demo-heading mt-0.5">Live PI stream</p>
                </div>
                <span className="text-[10px] font-mono text-[var(--demo-muted)]">
                  {sys.mode === "monitoring" ? "NORM" : meta.alertCode}
                </span>
              </div>
              <div className="p-4 flex-1 space-y-2 overflow-y-auto demo-scroll">
                {sys.readings.map((r) => (
                  <div key={r.label} className={`border px-3 py-2 ${r.breached ? "border-[var(--demo-text)]" : "border-[var(--demo-border-subtle)]"}`}>
                    <div className="flex justify-between text-[12px]">
                      <span>{r.label}</span>
                      <span className="font-mono tabular-nums">
                        {r.value < 1 && r.value > 0 ? r.value.toFixed(4) : r.value.toFixed(1)}
                        <span className="text-[10px] text-[var(--demo-muted)] ml-1">{r.unit}</span>
                      </span>
                    </div>
                    <Sparkline data={r.history.length > 1 ? r.history : [r.baseline, r.value]} />
                  </div>
                ))}
              </div>
            </div>

            {/* Agent */}
            <div className="demo-panel flex flex-col min-h-[360px]">
              <div className="px-4 py-3 border-b border-[var(--demo-border-subtle)] flex justify-between">
                <div>
                  <p className="demo-label">02 · Agent</p>
                  <p className="demo-heading mt-0.5">Operadroom</p>
                </div>
                <span className="text-[11px] text-[var(--demo-muted)]">
                  {sys.mode === "monitoring" ? "Watching" : "Executing"}
                </span>
              </div>
              <div className="flex-1 p-4 space-y-2 overflow-y-auto demo-scroll">
                {sys.logs.slice(0, sys.visibleLogs).map((log) => (
                  <div key={log.id} className="border-l-2 border-[var(--demo-border)] pl-3 py-1 demo-fade-in">
                    <div className="flex justify-between text-[10px] font-mono text-[var(--demo-faint)]">
                      <span>{log.timestamp}</span>
                      <span>{log.phase}</span>
                    </div>
                    <p className="text-[12px] mt-0.5">{log.message}</p>
                    {log.detail && <p className="text-[11px] text-[var(--demo-muted)]">{log.detail}</p>}
                  </div>
                ))}
                {sys.manual && phaseIndex(sys.phase) >= phaseIndex("diagnose") && (
                  <div className="border border-[var(--demo-border)] p-3 mt-2 bg-[var(--demo-surface-2)] demo-fade-in">
                    <p className="demo-label">Retrieved record</p>
                    <p className="text-[12px] mt-1">{sys.manual.source}</p>
                    <p className="text-[11px] text-[var(--demo-muted)] mt-2 border-l border-[var(--demo-border)] pl-2">{sys.manual.excerpt}</p>
                  </div>
                )}
              </div>
              {sys.workOrder?.reelinId && phaseIndex(sys.phase) >= phaseIndex("review") && (
                <div className="px-4 py-2 border-t border-[var(--demo-border-subtle)] text-[10px] font-mono text-[var(--demo-muted)] break-all">
                  {sys.workOrder.reelinId}
                </div>
              )}
            </div>

            {/* ERP */}
            <div className="demo-panel flex flex-col min-h-[360px]">
              <div className="px-4 py-3 border-b border-[var(--demo-border-subtle)] flex justify-between">
                <div>
                  <p className="demo-label">03 · ERP</p>
                  <p className="demo-heading mt-0.5">SAP PM</p>
                </div>
                <span className="text-[10px] font-mono text-[var(--demo-muted)]">
                  {sys.approved ? "REL" : phaseIndex(sys.phase) >= phaseIndex("review") ? "DRF" : "—"}
                </span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto demo-scroll space-y-3">
                {phaseIndex(sys.phase) >= phaseIndex("inventory") && (
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-[var(--demo-faint)] border-b border-[var(--demo-border-subtle)]">
                        <th className="text-left pb-1">Mat.</th>
                        <th className="text-left pb-1">Description</th>
                        <th className="text-right pb-1">St.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sys.inventory.map((l) => (
                        <tr key={l.material} className="border-b border-[var(--demo-border-subtle)]">
                          <td className="py-1.5 font-mono text-[var(--demo-muted)]">{l.material}</td>
                          <td className="py-1.5 pr-2">{l.description}</td>
                          <td className="py-1.5 text-right text-[var(--demo-muted)]">{l.status === "procure" ? "PR" : "OK"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {sys.workOrder && phaseIndex(sys.phase) >= phaseIndex("draft") && (
                  <div className="border border-[var(--demo-border)] demo-fade-in">
                    <div className="px-3 py-2 border-b border-[var(--demo-border-subtle)] bg-[var(--demo-surface-2)] flex justify-between">
                      <span className="text-[11px] font-medium">Work order</span>
                      <span className="font-mono text-[10px] text-[var(--demo-muted)]">{sys.approved ? "9001847" : "DRAFT"}</span>
                    </div>
                    <div className="p-3 text-[11px] space-y-1">
                      <p><span className="text-[var(--demo-faint)]">Type</span> · {sys.workOrder.orderType}</p>
                      <p><span className="text-[var(--demo-faint)]">Priority</span> · {sys.workOrder.priority}</p>
                      <p className="pt-1 text-[var(--demo-muted)]">{sys.workOrder.shortText}</p>
                      <p className="text-[10px] text-[var(--demo-faint)] pt-1">Start {formatDate(sys.workOrder.requiredStart)}</p>
                    </div>
                  </div>
                )}
                {phaseIndex(sys.phase) >= phaseIndex("review") && !sys.approved && (
                  <div className="border border-[var(--demo-border)] p-3 bg-[var(--demo-surface-2)]">
                    <p className="text-[12px] font-medium">Awaiting engineer release</p>
                    <p className="text-[11px] text-[var(--demo-muted)] mt-1">No SAP RELEASE executed. HITL-01 enforced.</p>
                  </div>
                )}
                {sys.approved && (
                  <div className="border border-[var(--demo-border)] p-3">
                    <p className="text-[12px] font-medium">Released to planning</p>
                  </div>
                )}
                {phaseIndex(sys.phase) < phaseIndex("inventory") && sys.mode === "monitoring" && (
                  <p className="text-[12px] text-[var(--demo-muted)]">Standing by for incident…</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
