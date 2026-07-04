"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/demo/LogoMark";
import { useDemoTheme } from "@/components/demo/DemoThemeProvider";
import { TwinViewer3D } from "@/components/demo/TwinViewer3D";
import { trackEvent } from "@/lib/analytics";
import {
  ASSETS,
  ASSET_LIST,
  buildAgentLogs,
  buildInventory,
  buildManualMatch,
  buildWorkOrder,
  FACILITY,
  getSeverityMeta,
  SIM_STEPS,
  type AgentLogEntry,
  type AssetId,
  type Severity,
  type SimPhase,
} from "@/lib/demo/scenarios";

const PHASES: SimPhase[] = ["idle", "telemetry", "ingest", "diagnose", "inventory", "draft", "review", "approved"];

function phaseIndex(phase: SimPhase) {
  return PHASES.indexOf(phase);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DemoNav() {
  const { theme, toggle } = useDemoTheme();
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[var(--demo-surface)] border-b border-[var(--demo-border)] pt-[env(safe-area-inset-top)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <LogoMark className="w-4 h-4 text-[var(--demo-text)] opacity-80" />
          <span className="text-[13px] font-semibold text-[var(--demo-text)]">Operadroom</span>
        </Link>
        <span className="hidden sm:block text-[11px] text-[var(--demo-muted)]">Pilot simulator · Sandbox</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            className="text-[11px] font-medium text-[var(--demo-muted)] hover:text-[var(--demo-text)] border border-[var(--demo-border)] px-2.5 py-1"
            aria-label="Toggle theme"
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <Link href="/" className="text-[11px] text-[var(--demo-muted)] hover:text-[var(--demo-text)]">
            Landing
          </Link>
        </div>
      </div>
    </header>
  );
}

function PhaseTimeline({ phase }: { phase: SimPhase }) {
  const current = phaseIndex(phase);
  const steps = [
    { key: "telemetry", label: "Ingest" },
    { key: "ingest", label: "Normalize" },
    { key: "diagnose", label: "Diagnose" },
    { key: "inventory", label: "Inventory" },
    { key: "draft", label: "Draft WO" },
    { key: "review", label: "Review" },
  ];

  return (
    <div className="demo-panel p-4">
      <p className="demo-label mb-3">Execution pipeline</p>
      <div className="flex flex-wrap sm:flex-nowrap gap-1">
        {steps.map((step, i) => {
          const idx = phaseIndex(step.key as SimPhase);
          const done = current > idx || phase === "approved";
          const active = phase === step.key;
          return (
            <div key={step.key} className="flex items-center flex-1 min-w-[72px]">
              <div className="flex flex-col flex-1">
                <div
                  className={`h-1 w-full transition-colors ${done ? "bg-[var(--demo-text)]" : active ? "bg-[var(--demo-muted)]" : "bg-[var(--demo-border-subtle)]"}`}
                />
                <span
                  className={`mt-2 text-[10px] ${active ? "text-[var(--demo-text)] font-medium" : done ? "text-[var(--demo-muted)]" : "text-[var(--demo-faint)]"}`}
                >
                  {String(i + 1).padStart(2, "0")} {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ControlBar({
  assetId,
  severity,
  phase,
  running,
  onAssetChange,
  onSeverityChange,
  onRun,
  onReset,
  onApprove,
}: {
  assetId: AssetId;
  severity: Severity;
  phase: SimPhase;
  running: boolean;
  onAssetChange: (id: AssetId) => void;
  onSeverityChange: (s: Severity) => void;
  onRun: () => void;
  onReset: () => void;
  onApprove: () => void;
}) {
  return (
    <div className="demo-panel p-4 sm:p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="demo-label">Facility</p>
          <h1 className="text-lg font-semibold text-[var(--demo-text)] mt-1">{FACILITY.name}</h1>
          <p className="text-[12px] text-[var(--demo-muted)] mt-1">
            {FACILITY.code} · {FACILITY.region}
          </p>
          <p className="text-[11px] text-[var(--demo-faint)] mt-0.5 hidden sm:block">{FACILITY.integration}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={running} onClick={onRun} className="demo-btn-primary">
            {running ? "Running…" : phase === "idle" ? "Run simulation" : "Re-run"}
          </button>
          <button type="button" disabled={running} onClick={onReset} className="demo-btn-secondary">
            Reset
          </button>
          {phase === "review" && (
            <button type="button" onClick={onApprove} className="demo-btn-secondary font-medium">
              Engineer approval
            </button>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--demo-border-subtle)]">
        <div>
          <label className="demo-label block mb-2">Equipment tag</label>
          <select
            value={assetId}
            disabled={running}
            onChange={(e) => onAssetChange(e.target.value as AssetId)}
            className="w-full bg-[var(--demo-surface-2)] border border-[var(--demo-border)] px-3 py-2 text-[13px] text-[var(--demo-text)] outline-none focus:border-[var(--demo-muted)] disabled:opacity-50"
          >
            {ASSET_LIST.map((a) => (
              <option key={a.id} value={a.id}>
                {a.tag} — {a.name} ({a.unit})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="demo-label block mb-2">Alert severity</label>
          <div className="grid grid-cols-3 gap-2">
            {(["advisory", "warning", "critical"] as Severity[]).map((s) => (
              <button
                key={s}
                type="button"
                disabled={running}
                onClick={() => onSeverityChange(s)}
                className={`py-2 text-[11px] font-medium border transition-colors disabled:opacity-50 ${
                  severity === s
                    ? "border-[var(--demo-text)] bg-[var(--demo-accent-soft)] text-[var(--demo-text)]"
                    : "border-[var(--demo-border)] text-[var(--demo-muted)] hover:border-[var(--demo-muted)]"
                }`}
              >
                {getSeverityMeta(s).label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TelemetryPanel({ assetId, severity, phase }: { assetId: AssetId; severity: Severity; phase: SimPhase }) {
  const asset = ASSETS[assetId];
  const active = phaseIndex(phase) >= phaseIndex("telemetry");
  const meta = getSeverityMeta(severity);

  return (
    <div className="demo-panel flex flex-col min-h-[380px]">
      <div className="px-4 py-3 border-b border-[var(--demo-border-subtle)] flex justify-between gap-3">
        <div>
          <p className="demo-label">01 · Telemetry</p>
          <p className="demo-heading mt-0.5">Digital twin input</p>
        </div>
        <span className="text-[10px] font-mono text-[var(--demo-muted)] self-start pt-1">
          {active ? meta.alertCode : "STBY"}
        </span>
      </div>

      <div className="p-4 flex-1 space-y-2 overflow-y-auto demo-scroll">
        <div className="flex justify-between text-[11px] text-[var(--demo-muted)] mb-1">
          <span>{asset.tag} · {asset.unit}</span>
          <span>{active ? "Streaming" : "Idle"}</span>
        </div>

        {asset.telemetry.map((reading) => {
          const val = active ? reading.values[severity] : reading.baseline;
          const breached =
            active &&
            (reading.direction === "above"
              ? val >= reading.threshold[severity]
              : val <= reading.threshold[severity]);

          return (
            <div
              key={reading.label}
              className={`border px-3 py-2.5 ${breached ? "border-[var(--demo-text)] bg-[var(--demo-surface-2)]" : "border-[var(--demo-border-subtle)]"}`}
            >
              <div className="flex justify-between gap-2">
                <span className="text-[12px] text-[var(--demo-text)]">{reading.label}</span>
                <span className="text-[13px] font-mono tabular-nums text-[var(--demo-text)]">
                  {val < 1 && val > 0 ? val.toFixed(5) : val.toFixed(1)}
                  <span className="text-[10px] text-[var(--demo-muted)] ml-1">{reading.unit}</span>
                </span>
              </div>
              <div className="mt-2 h-1 bg-[var(--demo-border-subtle)]">
                <div
                  className="h-full bg-[var(--demo-muted)] transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (val / (reading.baseline * 2.2)) * 100)}%`,
                  }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-[var(--demo-faint)] font-mono">
                <span>BL {reading.baseline}</span>
                <span>LIM {reading.threshold[severity]}</span>
              </div>
            </div>
          );
        })}

        {active && (
          <div className="border border-dashed border-[var(--demo-border)] p-3 mt-3 demo-fade-in">
            <p className="demo-label">Event payload</p>
            <pre className="mt-2 text-[10px] font-mono text-[var(--demo-muted)] leading-relaxed overflow-x-auto">
{`{"eventId":"evt-${asset.tag}","severity":"${severity.toUpperCase()}","mode":"READ_ONLY"}`}
            </pre>
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-[var(--demo-border-subtle)] text-[10px] text-[var(--demo-faint)]">
        OT gateway · read-only · {asset.twinSource}
      </div>
    </div>
  );
}

function AgentPanel({
  logs,
  visibleCount,
  phase,
  manual,
  reelinId,
}: {
  logs: AgentLogEntry[];
  visibleCount: number;
  phase: SimPhase;
  manual: ReturnType<typeof buildManualMatch> | null;
  reelinId: string | null;
}) {
  const active = phaseIndex(phase) >= phaseIndex("ingest");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [visibleCount]);

  return (
    <div className="demo-panel flex flex-col min-h-[380px]">
      <div className="px-4 py-3 border-b border-[var(--demo-border-subtle)] flex justify-between">
        <div>
          <p className="demo-label">02 · Agent</p>
          <p className="demo-heading mt-0.5">Operadroom execution</p>
        </div>
        <span className="text-[11px] text-[var(--demo-muted)]">{active ? "Active" : "Standby"}</span>
      </div>

      <div ref={logRef} className="flex-1 p-4 space-y-2 overflow-y-auto demo-scroll min-h-[180px]">
        {!active && (
          <p className="text-[12px] text-[var(--demo-muted)] leading-relaxed">
            Run simulation to trace alert normalization, document retrieval, and work order composition.
          </p>
        )}
        {logs.slice(0, visibleCount).map((log) => (
          <div key={log.id} className="border-l-2 border-[var(--demo-border)] pl-3 py-1 demo-fade-in">
            <div className="flex justify-between text-[10px] font-mono text-[var(--demo-faint)]">
              <span>{log.timestamp}</span>
              <span>{log.phase}</span>
            </div>
            <p className="mt-0.5 text-[12px] text-[var(--demo-text)]">{log.message}</p>
            {log.detail && <p className="mt-0.5 text-[11px] text-[var(--demo-muted)]">{log.detail}</p>}
          </div>
        ))}

        {manual && phaseIndex(phase) >= phaseIndex("diagnose") && (
          <div className="border border-[var(--demo-border)] p-3 mt-2 demo-fade-in bg-[var(--demo-surface-2)]">
            <p className="demo-label">Document match</p>
            <p className="text-[12px] text-[var(--demo-text)] mt-1">{manual.source}</p>
            <p className="text-[11px] text-[var(--demo-muted)] mt-0.5">{manual.section}</p>
            <p className="mt-2 text-[11px] text-[var(--demo-muted)] leading-relaxed border-l border-[var(--demo-border)] pl-2">
              {manual.excerpt}
            </p>
            <p className="mt-2 text-[10px] font-mono text-[var(--demo-faint)]">
              Match {(manual.confidence * 100).toFixed(0)}%
            </p>
          </div>
        )}
      </div>

      {reelinId && phaseIndex(phase) >= phaseIndex("review") && (
        <div className="px-4 py-2.5 border-t border-[var(--demo-border-subtle)] bg-[var(--demo-surface-2)]">
          <p className="demo-label">Reelin ID audit</p>
          <p className="mt-1 text-[10px] font-mono text-[var(--demo-muted)] break-all">{reelinId}</p>
        </div>
      )}
    </div>
  );
}

function ErpPanel({
  workOrder,
  phase,
  inventory,
  approved,
}: {
  workOrder: ReturnType<typeof buildWorkOrder> | null;
  phase: SimPhase;
  inventory: ReturnType<typeof buildInventory>;
  approved: boolean;
}) {
  const showInventory = phaseIndex(phase) >= phaseIndex("inventory");
  const showDraft = phaseIndex(phase) >= phaseIndex("draft");
  const showReview = phaseIndex(phase) >= phaseIndex("review");

  const statusLabel = approved ? "Released" : showReview ? "Draft" : "Pending";

  return (
    <div className="demo-panel flex flex-col min-h-[380px]">
      <div className="px-4 py-3 border-b border-[var(--demo-border-subtle)] flex justify-between">
        <div>
          <p className="demo-label">03 · ERP output</p>
          <p className="demo-heading mt-0.5">SAP PM / Maximo</p>
        </div>
        <span className="text-[10px] font-mono text-[var(--demo-muted)]">{statusLabel}</span>
      </div>

      <div className="p-4 flex-1 space-y-3 overflow-y-auto demo-scroll">
        {showInventory && (
          <div className="demo-fade-in">
            <p className="demo-label mb-2">SAP MM stock</p>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-[var(--demo-faint)] border-b border-[var(--demo-border-subtle)]">
                  <th className="pb-1 font-medium">Material</th>
                  <th className="pb-1 font-medium">Description</th>
                  <th className="pb-1 font-medium text-right">Qty</th>
                  <th className="pb-1 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((line) => (
                  <tr key={line.material} className="border-b border-[var(--demo-border-subtle)]">
                    <td className="py-2 font-mono text-[var(--demo-muted)]">{line.material}</td>
                    <td className="py-2 text-[var(--demo-text)] pr-2">{line.description}</td>
                    <td className="py-2 text-right font-mono text-[var(--demo-muted)]">{line.qtyAvailable}</td>
                    <td className="py-2 text-right text-[var(--demo-muted)]">
                      {line.status === "procure" ? "PR draft" : "Reserved"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showDraft && workOrder && (
          <div className="border border-[var(--demo-border)] demo-fade-in">
            <div className="px-3 py-2 border-b border-[var(--demo-border-subtle)] flex justify-between bg-[var(--demo-surface-2)]">
              <span className="text-[11px] font-medium text-[var(--demo-text)]">Work order</span>
              <span className="text-[10px] font-mono text-[var(--demo-muted)]">
                {approved ? "9001847" : "DRAFT-77102"}
              </span>
            </div>
            <div className="p-3 space-y-2 text-[11px]">
              {[
                ["Type", workOrder.orderType],
                ["Priority", workOrder.priority],
                ["Equipment", workOrder.equipment],
                ["Func. location", workOrder.functionalLocation],
                ["Work center", workOrder.workCenter],
                ["Est. hours", String(workOrder.estimatedHours)],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-2 py-1 border-b border-[var(--demo-border-subtle)]">
                  <span className="text-[var(--demo-faint)]">{k}</span>
                  <span className="col-span-2 text-[var(--demo-text)]">{v}</span>
                </div>
              ))}
              <p className="pt-2 text-[var(--demo-muted)]">{workOrder.shortText}</p>
              <div className="pt-2">
                <p className="demo-label mb-1">Operations</p>
                {workOrder.operations.map((op) => (
                  <div key={op.op} className="flex gap-2 py-1 text-[var(--demo-muted)]">
                    <span className="font-mono w-6 text-[var(--demo-faint)]">{op.op}</span>
                    <span>{op.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showReview && !approved && (
          <div className="border border-[var(--demo-border)] p-3 demo-fade-in bg-[var(--demo-surface-2)]">
            <p className="text-[12px] font-medium text-[var(--demo-text)]">Human review required</p>
            <p className="mt-1 text-[11px] text-[var(--demo-muted)] leading-relaxed">
              Work order saved as draft. No RELEASE posted to SAP PM. Authorized engineer must review and release.
            </p>
            <p className="mt-2 text-[10px] font-mono text-[var(--demo-faint)]">Policy HITL-01</p>
          </div>
        )}

        {approved && workOrder && (
          <div className="border border-[var(--demo-border)] p-3 demo-fade-in">
            <p className="text-[12px] font-medium text-[var(--demo-text)]">Released to planning queue</p>
            <p className="mt-1 text-[11px] text-[var(--demo-muted)]">
              Maintenance supervisor authorization recorded. Audit log exported.
            </p>
            <p className="mt-2 text-[10px] font-mono text-[var(--demo-faint)]">{workOrder.reelinId}</p>
          </div>
        )}

        {!showInventory && <p className="text-[12px] text-[var(--demo-muted)]">Awaiting agent output…</p>}
      </div>
    </div>
  );
}

function MetricsBar({ phase, severity, elapsed }: { phase: SimPhase; severity: Severity; elapsed: number }) {
  if (phase === "idle") return null;
  const meta = getSeverityMeta(severity);
  const items = [
    { label: "Alert class", value: meta.alertCode },
    { label: "Priority", value: meta.priority.split(" — ")[0] },
    { label: "Response window", value: meta.responseWindow },
    { label: "Elapsed", value: `${(elapsed / 1000).toFixed(1)} s` },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 border border-[var(--demo-border)]">
      {items.map((m) => (
        <div key={m.label} className="px-4 py-3 border-r border-b sm:border-b-0 border-[var(--demo-border-subtle)] last:border-r-0 bg-[var(--demo-surface)]">
          <p className="demo-label">{m.label}</p>
          <p className="mt-1 text-[12px] font-medium font-mono text-[var(--demo-text)]">{m.value}</p>
        </div>
      ))}
    </div>
  );
}

export default function DemoPage() {
  const [assetId, setAssetId] = useState<AssetId>("p2047");
  const [severity, setSeverity] = useState<Severity>("warning");
  const [phase, setPhase] = useState<SimPhase>("idle");
  const [running, setRunning] = useState(false);
  const [visibleLogs, setVisibleLogs] = useState(0);
  const [approved, setApproved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timersRef = useRef<number[]>([]);
  const startTimeRef = useRef(0);

  const asset = ASSETS[assetId];
  const manual = useMemo(
    () => (phaseIndex(phase) >= phaseIndex("diagnose") ? buildManualMatch(asset, severity) : null),
    [asset, severity, phase]
  );
  const inventory = useMemo(() => buildInventory(asset, severity), [asset, severity]);
  const logs = useMemo(
    () => buildAgentLogs(asset, severity, buildManualMatch(asset, severity), inventory),
    [asset, severity, inventory]
  );
  const workOrder = useMemo(
    () => (phaseIndex(phase) >= phaseIndex("draft") ? buildWorkOrder(asset, severity, inventory) : null),
    [asset, severity, inventory, phase]
  );

  const telemetryActive = phaseIndex(phase) >= phaseIndex("telemetry");

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setPhase("idle");
    setRunning(false);
    setVisibleLogs(0);
    setApproved(false);
    setElapsed(0);
  }, [clearTimers]);

  const runSimulation = useCallback(() => {
    clearTimers();
    setApproved(false);
    setRunning(true);
    setVisibleLogs(0);
    setElapsed(0);
    setPhase("telemetry");
    startTimeRef.current = Date.now();
    trackEvent("demo_run", { asset: assetId, severity });

    let logIndex = 0;
    const logInterval = setInterval(() => {
      logIndex += 1;
      setVisibleLogs((v) => Math.min(logs.length, v + 1));
      if (logIndex >= logs.length) clearInterval(logInterval);
    }, 520);

    let cumulative = 0;
    SIM_STEPS.forEach((step) => {
      cumulative += step.durationMs;
      const t = window.setTimeout(() => {
        setPhase(step.phase);
        setElapsed(Date.now() - startTimeRef.current);
      }, cumulative);
      timersRef.current.push(t);
    });

    const done = window.setTimeout(() => {
      setPhase("review");
      setVisibleLogs(logs.length);
      setElapsed(Date.now() - startTimeRef.current);
      setRunning(false);
    }, cumulative + 400);
    timersRef.current.push(done);
  }, [assetId, severity, clearTimers, logs.length]);

  const handleApprove = () => {
    setApproved(true);
    setPhase("approved");
    trackEvent("demo_approve", { asset: assetId, severity });
  };

  useEffect(() => () => clearTimers(), [clearTimers]);

  return (
    <>
      <DemoNav />
      <main className="pt-14 pb-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 space-y-4">
          <div className="py-6 border-b border-[var(--demo-border-subtle)]">
            <p className="demo-label">90-day pilot · Rheinland POC</p>
            <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-[var(--demo-text)]">
              Closed-loop maintenance execution
            </h1>
            <p className="mt-2 text-[13px] text-[var(--demo-muted)] max-w-2xl leading-relaxed">
              Read-only telemetry ingestion, agent reasoning, SAP inventory lookup, and draft work order output with mandatory engineer release.
            </p>
          </div>

          <TwinViewer3D assetId={assetId} severity={severity} active={telemetryActive || phase !== "idle"} />

          <ControlBar
            assetId={assetId}
            severity={severity}
            phase={phase}
            running={running}
            onAssetChange={(id) => {
              reset();
              setAssetId(id);
            }}
            onSeverityChange={(s) => {
              reset();
              setSeverity(s);
            }}
            onRun={runSimulation}
            onReset={reset}
            onApprove={handleApprove}
          />

          <PhaseTimeline phase={phase} />
          <MetricsBar phase={phase} severity={severity} elapsed={elapsed} />

          <div className="grid lg:grid-cols-3 gap-4">
            <TelemetryPanel assetId={assetId} severity={severity} phase={phase} />
            <AgentPanel logs={logs} visibleCount={visibleLogs} phase={phase} manual={manual} reelinId={workOrder?.reelinId ?? null} />
            <ErpPanel workOrder={workOrder} phase={phase} inventory={inventory} approved={approved} />
          </div>

          <section className="demo-panel p-5 sm:p-6">
            <p className="demo-label">Proposal documentation</p>
            <div className="mt-4 grid sm:grid-cols-3 gap-6">
              {[
                { title: "Technical verification", body: "Read-only OT/IT mapping in isolated sandbox. No live DCS writes." },
                { title: "Safety guarantee", body: "Agent stops at SAP draft. Engineer authorization required for release." },
                { title: "Audit trail", body: "Reelin ID logs every agent action for AAS compliance export." },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="text-[12px] font-semibold text-[var(--demo-text)]">{item.title}</h3>
                  <p className="mt-1.5 text-[12px] text-[var(--demo-muted)] leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-[var(--demo-border)] py-6">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] text-[var(--demo-muted)]">
          <span>Operadroom pilot simulator · Reelin AI Inc.</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-[var(--demo-text)]">Landing</Link>
            <a href="mailto:hi@reelin.ai" className="hover:text-[var(--demo-text)]">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}
