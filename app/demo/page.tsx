"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/demo/LogoMark";
import { useDemoTheme } from "@/components/demo/DemoThemeProvider";
import { TwinViewer3D } from "@/components/demo/TwinViewer3D";
import { phaseIndex, useLiveSystem } from "@/components/demo/useLiveSystem";
import { trackEvent } from "@/lib/analytics";
import { ASSET_LIST, FACILITY, getSeverityMeta, type Severity, type SimPhase } from "@/lib/demo/scenarios";
import type { AssetHealthSummary, FixCandidate } from "@/lib/demo/liveSystem";
import type { WorkOrderDraft } from "@/lib/demo/scenarios";

function formatUptime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function DemoNav({ uptimeSec, scanCount, normalCount, totalAssets }: { uptimeSec: number; scanCount: number; normalCount: number; totalAssets: number }) {
  const { theme, toggle } = useDemoTheme();
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[var(--demo-surface)] border-b border-[var(--demo-border)] pt-[env(safe-area-inset-top)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <LogoMark className="w-4 h-4 opacity-80" />
          <span className="text-[13px] font-semibold">Operadroom</span>
          <span className="hidden sm:inline text-[10px] text-[var(--demo-muted)] border-l border-[var(--demo-border)] pl-2 ml-1">Live demo</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[11px] font-mono text-[var(--demo-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--demo-ok)] demo-live-pulse" />
            {normalCount}/{totalAssets} assets OK
          </span>
          <span>Scan #{scanCount}</span>
          <span>Uptime {formatUptime(uptimeSec)}</span>
        </div>
        <button type="button" onClick={toggle} className="text-[11px] border border-[var(--demo-border)] px-2.5 py-1 text-[var(--demo-muted)] shrink-0">
          {theme === "light" ? "Dark" : "Light"}
        </button>
      </div>
    </header>
  );
}

function IntegrationsBar() {
  const systems = [
    { name: "Cognite CDF", status: "Connected", detail: "Asset twin sync" },
    { name: "PI Historian", status: "Streaming", detail: "1.2s cycle" },
    { name: "SAP PM / MM", status: "Ready", detail: "HITL enforced" },
    { name: "Reelin ID", status: "Active", detail: "Audit trail" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 border border-[var(--demo-border)] bg-[var(--demo-surface)]">
      {systems.map((s) => (
        <div key={s.name} className="px-4 py-2.5 border-r border-[var(--demo-border-subtle)] last:border-r-0 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium truncate">{s.name}</p>
            <p className="text-[10px] text-[var(--demo-muted)] truncate">{s.detail}</p>
          </div>
          <span className="text-[10px] font-mono demo-status-ok shrink-0 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--demo-ok)] demo-live-pulse" />
            {s.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function SystemStatusBar({
  mode,
  phase,
  lastScan,
  normalCount,
  totalAssets,
  incidentTag,
}: {
  mode: string;
  phase: SimPhase;
  lastScan: Date;
  normalCount: number;
  totalAssets: number;
  incidentTag: string | null;
}) {
  const labels: Record<string, string> = {
    monitoring: "Monitoring",
    incident: "Incident response",
    resolved: "Resolved",
  };
  const modeColor =
    mode === "incident" ? "demo-status-warn" : mode === "resolved" ? "demo-status-ok" : "demo-status-focus";
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 border border-[var(--demo-border)] bg-[var(--demo-surface)]">
      {[
        { label: "System state", value: labels[mode] ?? mode, color: modeColor },
        { label: "Facility health", value: `${normalCount}/${totalAssets} nominal`, color: normalCount === totalAssets ? "demo-status-ok" : "demo-status-warn" },
        { label: "Pipeline", value: phase === "monitoring" ? "Idle · watching all assets" : phase.replace("_", " "), color: phase === "monitoring" ? "" : "demo-status-focus" },
        { label: "Last scan", value: incidentTag ? `${lastScan.toLocaleTimeString("en-GB")} · ${incidentTag}` : lastScan.toLocaleTimeString("en-GB"), color: incidentTag ? "demo-status-warn" : "" },
      ].map((item) => (
        <div key={item.label} className="px-4 py-3 border-r border-[var(--demo-border-subtle)] last:border-r-0">
          <p className="demo-label">{item.label}</p>
          <p className={`mt-1 text-[12px] font-medium font-mono capitalize ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function FacilityMonitorGrid({ summaries }: { summaries: AssetHealthSummary[] }) {
  const statusDot = (s: AssetHealthSummary["status"]) => {
    if (s === "breached") return "bg-[var(--demo-alert)]";
    if (s === "incident") return "bg-[var(--demo-warn)] demo-live-pulse";
    if (s === "selected") return "bg-[var(--demo-focus)]";
    return "bg-[var(--demo-ok)]";
  };

  const statusText = (s: AssetHealthSummary["status"]) => {
    if (s === "breached") return "demo-status-alert";
    if (s === "incident") return "demo-status-warn";
    if (s === "selected") return "demo-status-focus";
    return "demo-status-ok";
  };

  return (
    <div className="demo-panel overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--demo-border-subtle)] flex justify-between items-center">
        <div>
          <p className="demo-label">Facility telemetry matrix</p>
          <p className="demo-heading mt-0.5">All assets · simultaneous scan</p>
        </div>
        <span className="text-[10px] font-mono text-[var(--demo-muted)]">{summaries.length} streams</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] min-w-[640px]">
          <thead>
            <tr className="text-[var(--demo-faint)] border-b border-[var(--demo-border-subtle)] bg-[var(--demo-surface-2)]">
              <th className="text-left px-4 py-2 font-normal">Tag</th>
              <th className="text-left px-2 py-2 font-normal">Unit</th>
              <th className="text-left px-2 py-2 font-normal">Primary tag</th>
              <th className="text-right px-2 py-2 font-normal">Value</th>
              <th className="text-right px-4 py-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.id} className={`border-b border-[var(--demo-border-subtle)] ${s.status === "selected" ? "bg-[var(--demo-focus-soft)]" : ""}`}>
                <td className="px-4 py-2 font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot(s.status)}`} />
                    {s.tag}
                  </span>
                </td>
                <td className="px-2 py-2 text-[var(--demo-muted)]">{s.unit}</td>
                <td className="px-2 py-2 text-[var(--demo-muted)]">{s.primaryLabel}</td>
                <td className="px-2 py-2 text-right font-mono tabular-nums">
                  {s.primaryValue < 1 ? s.primaryValue.toFixed(3) : s.primaryValue.toFixed(1)} {s.primaryUnit}
                </td>
                <td className={`px-4 py-2 text-right capitalize ${statusText(s.status)}`}>
                  {s.status === "breached" ? "Alert" : s.status === "incident" ? "Event" : s.status === "selected" ? "Focus" : "OK"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        {steps.map((step) => {
          const idx = phaseIndex(step.key as SimPhase);
          const done = current > idx || phase === "approved";
          const active = phase === step.key;
          return (
            <div key={step.key} className="flex-1 min-w-0">
              <div className={`h-1 ${done ? "bg-[var(--demo-ok)]" : active ? "bg-[var(--demo-focus)]" : "bg-[var(--demo-border-subtle)]"}`} />
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
              f.selected ? "border-[var(--demo-focus)] bg-[var(--demo-focus-soft)]" : "border-[var(--demo-border-subtle)]"
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

function Sparkline({ data, alert }: { data: number[]; alert?: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${32 - ((v - min) / range) * 28}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" className="w-full h-6 mt-1" preserveAspectRatio="none">
      <polyline fill="none" stroke={alert ? "var(--demo-alert)" : "var(--demo-focus)"} strokeWidth="1" points={pts} />
    </svg>
  );
}

const SEVERITY_STYLE: Record<Severity, { active: string; idle: string }> = {
  advisory: {
    active: "border-[var(--demo-severity-advisory)] bg-[var(--demo-accent-soft)] text-[var(--demo-text)]",
    idle: "border-[var(--demo-border)] text-[var(--demo-muted)]",
  },
  warning: {
    active: "border-[var(--demo-warn)] bg-[var(--demo-warn-soft)] demo-status-warn",
    idle: "border-[var(--demo-border)] text-[var(--demo-muted)]",
  },
  critical: {
    active: "border-[var(--demo-alert)] bg-[var(--demo-alert-soft)] demo-status-alert",
    idle: "border-[var(--demo-border)] text-[var(--demo-muted)]",
  },
};

function EngineerReleasePanel({
  open,
  assetTag,
  workOrder,
  notes,
  onNotesChange,
  onCancel,
  onRelease,
}: {
  open: boolean;
  assetTag: string;
  workOrder: WorkOrderDraft | null;
  notes: string;
  onNotesChange: (value: string) => void;
  onCancel: () => void;
  onRelease: () => void;
}) {
  if (!open || !workOrder) return null;

  return (
    <div className="mt-4 pt-4 border-t border-[var(--demo-border-subtle)] demo-fade-in">
      <div className="border border-[var(--demo-warn)] bg-[var(--demo-warn-soft)] px-4 py-3 mb-4">
        <p className="text-[12px] font-medium">Engineer release · HITL-01</p>
        <p className="text-[11px] text-[var(--demo-muted)] mt-1">
          Review draft work order for <span className="font-mono">{assetTag}</span> before SAP RELEASE. Add any field observations or constraints below.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="border border-[var(--demo-border)] p-3 bg-[var(--demo-surface-2)] text-[11px] space-y-1">
          <p className="demo-label mb-2">Draft summary</p>
          <p><span className="text-[var(--demo-faint)]">Type</span> · {workOrder.orderType}</p>
          <p><span className="text-[var(--demo-faint)]">Priority</span> · {workOrder.priority}</p>
          <p className="text-[var(--demo-muted)] pt-1">{workOrder.shortText}</p>
        </div>

        <div>
          <label htmlFor="engineer-notes" className="demo-label block mb-2">
            Engineer notes <span className="text-[var(--demo-faint)]">(optional)</span>
          </label>
          <textarea
            id="engineer-notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={4}
            placeholder="e.g. Confirm LOTO with shift supervisor before start. Crew B available after 06:00. Vibration trending noted on adjacent train."
            className="w-full border border-[var(--demo-border)] bg-[var(--demo-surface)] px-3 py-2 text-[12px] resize-y min-h-[96px] focus:outline-none focus:border-[var(--demo-focus)]"
          />
          <p className="text-[10px] text-[var(--demo-faint)] mt-1.5">Notes are appended to the work order long text and sealed in Reelin ID audit trail.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button type="button" onClick={onRelease} className="demo-btn-release">
          Release to SAP PM
        </button>
        <button type="button" onClick={onCancel} className="demo-btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const sys = useLiveSystem("p2047");
  const meta = getSeverityMeta(sys.severity);
  const incidentTag = sys.mode === "incident" ? sys.asset.tag : null;
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState("");

  useEffect(() => {
    if (!sys.canApprove) setReleaseOpen(false);
  }, [sys.canApprove]);

  useEffect(() => {
    if (sys.approved) {
      setReleaseOpen(false);
      setReleaseNotes("");
    }
  }, [sys.approved]);

  const handleTrigger = () => {
    trackEvent("demo_trigger_anomaly", { asset: sys.assetId, severity: sys.severity });
    sys.triggerAnomaly();
  };

  const handleOpenRelease = () => setReleaseOpen(true);

  const handleCancelRelease = () => {
    setReleaseOpen(false);
    setReleaseNotes("");
  };

  const handleRelease = () => {
    trackEvent("demo_approve", {
      asset: sys.assetId,
      severity: sys.severity,
      hasNotes: releaseNotes.trim().length > 0,
    });
    sys.approveWorkOrder(releaseNotes);
  };

  return (
    <>
      <DemoNav uptimeSec={sys.uptimeSec} scanCount={sys.scanCount} normalCount={sys.normalCount} totalAssets={sys.totalAssets} />
      <main className="pt-14 pb-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 space-y-4">
          <div className="py-5 border-b border-[var(--demo-border-subtle)]">
            <p className="demo-label">Rheinland POC · live operations sandbox</p>
            <h1 className="mt-1 text-xl font-semibold">Facility-wide monitoring · on-demand incident injection</h1>
            <p className="mt-2 text-[13px] text-[var(--demo-muted)] max-w-2xl">
              All {sys.totalAssets} assets stream continuously. Click any equipment in the 3D twin or sidebar, inject an anomaly on the focused asset, and watch autonomous detection through work order drafting.
            </p>
          </div>

          <IntegrationsBar />
          <SystemStatusBar
            mode={sys.mode}
            phase={sys.phase}
            lastScan={sys.lastScan}
            normalCount={sys.normalCount}
            totalAssets={sys.totalAssets}
            incidentTag={incidentTag}
          />

          <TwinViewer3D
            assetId={sys.assetId}
            severity={sys.severity}
            mode={sys.mode}
            phase={sys.phase}
            assetSummaries={sys.assetSummaries}
            allReadings={sys.allReadings}
            markerStatuses={sys.markerStatuses}
            onAssetSelect={sys.selectAsset}
          />

          <FacilityMonitorGrid summaries={sys.assetSummaries} />

          <div className="demo-panel p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="demo-label">Control</p>
                <h2 className="text-base font-semibold mt-1">{FACILITY.name}</h2>
                <p className="text-[11px] text-[var(--demo-muted)] mt-1">
                  Focus asset: <span className="font-mono">{sys.asset.tag}</span> · inject applies to selection only
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={!sys.canTrigger} onClick={handleTrigger} className="demo-btn-primary">
                  {sys.mode === "incident" ? "Response in progress…" : "Inject anomaly"}
                </button>
                <button type="button" onClick={sys.resetMonitoring} className="demo-btn-secondary">
                  Return to monitoring
                </button>
                {sys.canApprove && !releaseOpen && (
                  <button type="button" onClick={handleOpenRelease} className="demo-btn-release">
                    Engineer approval
                  </button>
                )}
              </div>
            </div>

            <EngineerReleasePanel
              open={releaseOpen && sys.canApprove}
              assetTag={sys.asset.tag}
              workOrder={sys.workOrder}
              notes={releaseNotes}
              onNotesChange={setReleaseNotes}
              onCancel={handleCancelRelease}
              onRelease={handleRelease}
            />
            <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--demo-border-subtle)]">
              <div>
                <label className="demo-label block mb-2">Focus equipment</label>
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
                        sys.severity === s ? SEVERITY_STYLE[s].active : SEVERITY_STYLE[s].idle
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
            <div className="demo-panel flex flex-col min-h-[360px]">
              <div className="px-4 py-3 border-b border-[var(--demo-border-subtle)] flex justify-between">
                <div>
                  <p className="demo-label">01 · Telemetry</p>
                  <p className="demo-heading mt-0.5">Focused asset · PI stream</p>
                </div>
                <span className={`text-[10px] font-mono ${sys.mode === "monitoring" ? "demo-status-ok" : "demo-status-warn"}`}>
                  {sys.mode === "monitoring" ? "NORM" : meta.alertCode}
                </span>
              </div>
              <div className="p-4 flex-1 space-y-2 overflow-y-auto demo-scroll">
                {sys.readings.map((r) => (
                  <div key={r.label} className={`border px-3 py-2 ${r.breached ? "border-[var(--demo-alert)] bg-[var(--demo-alert-soft)]" : "border-[var(--demo-border-subtle)]"}`}>
                    <div className="flex justify-between text-[12px]">
                      <span>{r.label}</span>
                      <span className="font-mono tabular-nums">
                        {r.value < 1 && r.value > 0 ? r.value.toFixed(4) : r.value.toFixed(1)}
                        <span className="text-[10px] text-[var(--demo-muted)] ml-1">{r.unit}</span>
                      </span>
                    </div>
                    <Sparkline data={r.history.length > 1 ? r.history : [r.baseline, r.value]} alert={r.breached} />
                  </div>
                ))}
              </div>
            </div>

            <div className="demo-panel flex flex-col min-h-[360px]">
              <div className="px-4 py-3 border-b border-[var(--demo-border-subtle)] flex justify-between">
                <div>
                  <p className="demo-label">02 · Agent</p>
                  <p className="demo-heading mt-0.5">Operadroom</p>
                </div>
                <span className="text-[11px] text-[var(--demo-muted)]">
                  {sys.mode === "monitoring" ? "Watching all assets" : "Executing"}
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

            <div className="demo-panel flex flex-col min-h-[360px]">
              <div className="px-4 py-3 border-b border-[var(--demo-border-subtle)] flex justify-between">
                <div>
                  <p className="demo-label">03 · ERP</p>
                  <p className="demo-heading mt-0.5">SAP PM</p>
                </div>
                <span className={`text-[10px] font-mono ${sys.approved ? "demo-status-ok" : phaseIndex(sys.phase) >= phaseIndex("review") ? "demo-status-warn" : ""}`}>
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
                          <td className={`py-1.5 text-right ${l.status === "procure" ? "demo-status-warn" : "demo-status-ok"}`}>
                            {l.status === "procure" ? "PR" : "OK"}
                          </td>
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
                      {sys.engineerNotes && (
                        <div className="mt-3 pt-3 border-t border-[var(--demo-border-subtle)]">
                          <p className="text-[var(--demo-faint)]">Engineer notes</p>
                          <p className="text-[var(--demo-muted)] mt-1 whitespace-pre-wrap">{sys.engineerNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {phaseIndex(sys.phase) >= phaseIndex("review") && !sys.approved && !releaseOpen && (
                  <div className="border border-[var(--demo-warn)] p-3 bg-[var(--demo-warn-soft)]">
                    <p className="text-[12px] font-medium demo-status-warn">Awaiting engineer release</p>
                    <p className="text-[11px] text-[var(--demo-muted)] mt-1">No SAP RELEASE executed. HITL-01 enforced — use Engineer approval to add notes and release.</p>
                  </div>
                )}
                {sys.approved && (
                  <div className="border border-[var(--demo-ok)] p-3 bg-[var(--demo-ok-soft)]">
                    <p className="text-[12px] font-medium demo-status-ok">Released to planning · WO 9001847</p>
                    {sys.engineerNotes && (
                      <p className="text-[11px] text-[var(--demo-muted)] mt-2 whitespace-pre-wrap">{sys.engineerNotes}</p>
                    )}
                  </div>
                )}
                {phaseIndex(sys.phase) < phaseIndex("inventory") && sys.mode === "monitoring" && (
                  <p className="text-[12px] text-[var(--demo-muted)]">Standing by — all assets within baseline…</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
