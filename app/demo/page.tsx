"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/demo/LogoMark";
import { trackEvent } from "@/lib/analytics";
import {
  ASSETS,
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
  type TelemetryReading,
  type WorkOrderDraft,
} from "@/lib/demo/scenarios";

const PHASES: SimPhase[] = [
  "idle",
  "telemetry",
  "ingest",
  "diagnose",
  "inventory",
  "draft",
  "review",
  "approved",
];

function severityColor(severity: Severity, reading?: TelemetryReading) {
  if (!reading) {
    return severity === "critical"
      ? "text-red-400 border-red-400/40 bg-red-400/10"
      : severity === "warning"
        ? "text-amber-400 border-amber-400/40 bg-amber-400/10"
        : "text-sky-400 border-sky-400/40 bg-sky-400/10";
  }
  const val = reading.values[severity];
  const breached =
    reading.direction === "above"
      ? val >= reading.threshold[severity]
      : val <= reading.threshold[severity];
  if (breached && severity === "critical") return "text-red-400 border-red-400/50 bg-red-500/10";
  if (breached && severity === "warning") return "text-amber-400 border-amber-400/50 bg-amber-500/10";
  if (breached) return "text-sky-400 border-sky-400/50 bg-sky-500/10";
  return "text-white/70 border-white/10 bg-white/[0.03]";
}

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
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5 pt-[env(safe-area-inset-top)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <LogoMark className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 group-hover:text-white transition-colors" />
          <span className="text-[11px] sm:text-[13px] font-semibold tracking-[0.22em] sm:tracking-[0.35em] uppercase">
            Operadroom
          </span>
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-white/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
          Sandbox Environment
        </div>
        <Link
          href="/"
          className="text-[10px] sm:text-[11px] tracking-[0.16em] uppercase text-white/60 hover:text-white transition-colors"
        >
          ← Landing
        </Link>
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
    <div className="border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-4">Execution Pipeline</p>
      <div className="flex flex-wrap gap-2 sm:gap-0 sm:flex-nowrap sm:items-center">
        {steps.map((step, i) => {
          const idx = phaseIndex(step.key as SimPhase);
          const done = current > idx;
          const active = phase === step.key || (phase === "approved" && step.key === "review");
          return (
            <div key={step.key} className="flex items-center flex-1 min-w-[80px]">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center text-[10px] font-semibold transition-all duration-500 ${
                    done || phase === "approved"
                      ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-300"
                      : active
                        ? "border-white bg-white text-black demo-glow"
                        : "border-white/20 text-white/30"
                  }`}
                >
                  {done || (phase === "approved" && step.key !== "review") ? "✓" : i + 1}
                </div>
                <span
                  className={`mt-2 text-[9px] sm:text-[10px] tracking-wider uppercase text-center ${
                    active ? "text-white" : done ? "text-emerald-400/80" : "text-white/35"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`hidden sm:block h-px flex-1 mx-1 transition-colors duration-500 ${
                    current > idx ? "bg-emerald-400/50" : "bg-white/10"
                  }`}
                />
              )}
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
    <div className="border border-white/10 bg-black/80 p-4 sm:p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-1">Facility</p>
          <h1 className="text-lg sm:text-xl font-bold uppercase tracking-tight">{FACILITY.name}</h1>
          <p className="text-[12px] text-white/45 mt-1">
            {FACILITY.code} · {FACILITY.region}
          </p>
          <p className="text-[11px] text-white/35 mt-1 hidden sm:block">{FACILITY.integration}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            type="button"
            disabled={running}
            onClick={onRun}
            className="px-5 py-3 text-[11px] font-medium tracking-[0.18em] uppercase border border-white bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {running ? "Running…" : phase === "idle" ? "Run Simulation" : "Re-run"}
          </button>
          <button
            type="button"
            disabled={running}
            onClick={onReset}
            className="px-5 py-3 text-[11px] font-medium tracking-[0.18em] uppercase border border-white/30 text-white/70 hover:border-white/60 hover:text-white disabled:opacity-40 transition-all"
          >
            Reset
          </button>
          {phase === "review" && (
            <button
              type="button"
              onClick={onApprove}
              className="px-5 py-3 text-[11px] font-medium tracking-[0.18em] uppercase border border-emerald-400/60 text-emerald-300 hover:bg-emerald-400/10 transition-all demo-glow-green"
            >
              Simulate Engineer Approval
            </button>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
        <div>
          <label className="text-[10px] tracking-[0.18em] uppercase text-white/40">Asset</label>
          <select
            value={assetId}
            disabled={running}
            onChange={(e) => onAssetChange(e.target.value as AssetId)}
            className="mt-2 w-full bg-black border border-white/15 px-3 py-2.5 text-[13px] text-white focus:border-white/40 outline-none disabled:opacity-50"
          >
            {(Object.keys(ASSETS) as AssetId[]).map((id) => (
              <option key={id} value={id}>
                {ASSETS[id].tag} — {ASSETS[id].name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] tracking-[0.18em] uppercase text-white/40">Anomaly Severity</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["advisory", "warning", "critical"] as Severity[]).map((s) => (
              <button
                key={s}
                type="button"
                disabled={running}
                onClick={() => onSeverityChange(s)}
                className={`py-2.5 text-[10px] sm:text-[11px] tracking-[0.12em] uppercase border transition-all disabled:opacity-50 ${
                  severity === s
                    ? s === "critical"
                      ? "border-red-400/70 bg-red-500/15 text-red-300"
                      : s === "warning"
                        ? "border-amber-400/70 bg-amber-500/15 text-amber-300"
                        : "border-sky-400/70 bg-sky-500/15 text-sky-300"
                    : "border-white/10 text-white/45 hover:border-white/25"
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

function TelemetryPanel({
  assetId,
  severity,
  phase,
}: {
  assetId: AssetId;
  severity: Severity;
  phase: SimPhase;
}) {
  const asset = ASSETS[assetId];
  const active = phaseIndex(phase) >= phaseIndex("telemetry");
  const meta = getSeverityMeta(severity);

  return (
    <div className="border border-white/10 bg-white/[0.02] flex flex-col h-full min-h-[420px]">
      <div className="px-4 sm:px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">Layer 01</p>
          <h2 className="text-[13px] sm:text-[14px] font-semibold tracking-wide uppercase mt-1">
            Digital Twin · Telemetry
          </h2>
          <p className="text-[11px] text-white/40 mt-1">{asset.twinSource}</p>
        </div>
        <div
          className={`shrink-0 px-2.5 py-1 text-[9px] tracking-wider uppercase border ${
            active ? severityColor(severity) : "border-white/10 text-white/30"
          }`}
        >
          {active ? meta.alertCode : "Standby"}
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 space-y-3 overflow-y-auto demo-scroll">
        <div className="flex items-center justify-between text-[10px] tracking-wider uppercase text-white/35">
          <span>{asset.tag} · {asset.unit}</span>
          <span className={active ? "text-emerald-400" : ""}>
            {active ? "Live stream" : "Idle"}
            {active && <span className="inline-block w-1.5 h-1.5 ml-2 rounded-full bg-emerald-400 animate-pulse-soft" />}
          </span>
        </div>

        {asset.telemetry.map((reading, i) => {
          const val = active ? reading.values[severity] : reading.baseline;
          const pct = Math.min(100, (val / (reading.baseline * 2.2)) * 100);
          const breached =
            active &&
            (reading.direction === "above"
              ? val >= reading.threshold[severity]
              : val <= reading.threshold[severity]);

          return (
            <div
              key={reading.label}
              className={`border p-3 sm:p-4 transition-all duration-700 ${breached ? severityColor(severity, reading) : "border-white/10 bg-black/40"}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[11px] sm:text-[12px] text-white/80">{reading.label}</span>
                <span className="text-[13px] sm:text-[15px] font-mono tabular-nums">
                  {typeof val === "number" && val < 1 ? val.toFixed(5) : val.toFixed(1)}
                  <span className="text-[10px] text-white/40 ml-1">{reading.unit}</span>
                </span>
              </div>
              <div className="mt-3 h-1.5 bg-white/10 overflow-hidden rounded-full">
                <div
                  className={`h-full transition-all duration-1000 rounded-full ${
                    breached
                      ? severity === "critical"
                        ? "bg-red-400"
                        : severity === "warning"
                          ? "bg-amber-400"
                          : "bg-sky-400"
                      : "bg-white/30"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[9px] text-white/30 uppercase tracking-wider">
                <span>Baseline {reading.baseline}</span>
                <span>Threshold {reading.threshold[severity]}</span>
              </div>
            </div>
          );
        })}

        {active && (
          <div className="border border-dashed border-white/15 p-3 mt-4 demo-fade-in">
            <p className="text-[10px] tracking-wider uppercase text-white/40">Twin Event Payload</p>
            <pre className="mt-2 text-[10px] sm:text-[11px] text-white/55 font-mono leading-relaxed overflow-x-auto">
{`{
  "eventId": "evt-${asset.tag}-${severity.slice(0, 3)}",
  "assetTag": "${asset.tag}",
  "severity": "${severity.toUpperCase()}",
  "source": "Cognite/CDF",
  "mode": "READ_ONLY",
  "ts": "${new Date().toISOString()}"
}`}
            </pre>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-white/10 text-[10px] text-white/30 tracking-wider uppercase">
        OT Gateway · No write access to DCS
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
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [visibleCount]);

  const levelStyle = {
    info: "border-white/10 text-white/60",
    action: "border-sky-400/30 text-sky-200/90 bg-sky-500/5",
    success: "border-emerald-400/30 text-emerald-200/90 bg-emerald-500/5",
    warn: "border-amber-400/30 text-amber-200/90 bg-amber-500/5",
  };

  return (
    <div className="border border-white/15 bg-white/[0.04] flex flex-col h-full min-h-[420px] relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50" />
      <div className="relative px-4 sm:px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">Layer 02</p>
          <h2 className="text-[13px] sm:text-[14px] font-semibold tracking-wide uppercase mt-1">
            Operadroom Agent
          </h2>
          <p className="text-[11px] text-white/40 mt-1">Reelin agent architecture · Cognitive execution</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`w-2 h-2 rounded-full ${active ? "bg-sky-400 animate-pulse-soft" : "bg-white/20"}`} />
          <span className="text-[9px] tracking-wider uppercase text-white/40">
            {active ? "Processing" : "Idle"}
          </span>
        </div>
      </div>

      <div ref={logRef} className="relative flex-1 p-4 sm:p-5 space-y-2 overflow-y-auto demo-scroll min-h-[200px]">
        {!active && (
          <p className="text-[12px] text-white/35 leading-relaxed">
            Agent standing by. Run simulation to watch read → reason → act across OT and IT systems.
          </p>
        )}
        {logs.slice(0, visibleCount).map((log) => (
          <div
            key={log.id}
            className={`border px-3 py-2.5 demo-fade-in ${levelStyle[log.level]}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] tracking-wider uppercase opacity-60">{log.timestamp}</span>
              <span className="text-[9px] tracking-wider uppercase opacity-60">{log.phase}</span>
            </div>
            <p className="mt-1 text-[11px] sm:text-[12px] leading-snug">{log.message}</p>
            {log.detail && <p className="mt-1 text-[10px] opacity-60 leading-relaxed">{log.detail}</p>}
          </div>
        ))}

        {manual && phaseIndex(phase) >= phaseIndex("diagnose") && (
          <div className="border border-white/15 bg-black/50 p-4 mt-3 demo-fade-in">
            <p className="text-[10px] tracking-wider uppercase text-white/40">Manual Corpus Match</p>
            <p className="mt-2 text-[11px] text-white/70">{manual.source}</p>
            <p className="text-[10px] text-sky-300/80 mt-1">{manual.section}</p>
            <p className="mt-3 text-[11px] text-white/55 leading-relaxed border-l-2 border-white/20 pl-3">
              {manual.excerpt}
            </p>
            <p className="mt-2 text-[10px] text-white/35">
              Confidence {(manual.confidence * 100).toFixed(0)}% · Vector retrieval · Customer corpus only
            </p>
          </div>
        )}
      </div>

      {reelinId && phaseIndex(phase) >= phaseIndex("review") && (
        <div className="relative px-4 py-3 border-t border-white/10 bg-black/60">
          <p className="text-[9px] tracking-wider uppercase text-white/40">Reelin ID Audit Seal</p>
          <p className="mt-1 text-[10px] font-mono text-emerald-400/90 break-all">{reelinId}</p>
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
  workOrder: WorkOrderDraft | null;
  phase: SimPhase;
  inventory: ReturnType<typeof buildInventory>;
  approved: boolean;
}) {
  const showInventory = phaseIndex(phase) >= phaseIndex("inventory");
  const showDraft = phaseIndex(phase) >= phaseIndex("draft");
  const showReview = phaseIndex(phase) >= phaseIndex("review");

  return (
    <div className="border border-white/10 bg-white/[0.02] flex flex-col h-full min-h-[420px]">
      <div className="px-4 sm:px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">Layer 03</p>
          <h2 className="text-[13px] sm:text-[14px] font-semibold tracking-wide uppercase mt-1">
            SAP PM · CMMS Output
          </h2>
          <p className="text-[11px] text-white/40 mt-1">IBM Maximo compatible export</p>
        </div>
        <div
          className={`shrink-0 px-2.5 py-1 text-[9px] tracking-wider uppercase border ${
            approved
              ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
              : showReview
                ? "border-amber-400/60 bg-amber-400/10 text-amber-300"
                : "border-white/10 text-white/30"
          }`}
        >
          {approved ? "Released" : showReview ? "Draft" : "Pending"}
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 space-y-4 overflow-y-auto demo-scroll">
        {showInventory && (
          <div className="demo-fade-in">
            <p className="text-[10px] tracking-wider uppercase text-white/40 mb-3">SAP MM · Stock Check</p>
            <div className="space-y-2">
              {inventory.map((line) => (
                <div key={line.material} className="border border-white/10 p-3 grid grid-cols-12 gap-2 text-[10px] sm:text-[11px]">
                  <div className="col-span-3 font-mono text-white/50">{line.material}</div>
                  <div className="col-span-5 text-white/70">{line.description}</div>
                  <div className="col-span-2 text-white/40">{line.qtyAvailable} avail</div>
                  <div className="col-span-2 text-right">
                    <span
                      className={
                        line.status === "procure"
                          ? "text-amber-400"
                          : line.status === "partial"
                            ? "text-sky-400"
                            : "text-emerald-400"
                      }
                    >
                      {line.status === "procure" ? "PR Draft" : "OK"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showDraft && workOrder && (
          <div className="border border-white/15 bg-black/40 demo-fade-in">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider uppercase">Work Order Preview</span>
              <span className="text-[10px] font-mono text-white/40">
                {approved ? "WO-9001847" : "WO-DRAFT-77102"}
              </span>
            </div>
            <div className="p-4 space-y-3 text-[11px] sm:text-[12px]">
              {[
                ["Order Type", workOrder.orderType],
                ["Priority", workOrder.priority],
                ["Equipment", workOrder.equipment],
                ["Functional Loc.", workOrder.functionalLocation],
                ["Planner Group", workOrder.plannerGroup],
                ["Work Center", workOrder.workCenter],
                ["Est. Hours", String(workOrder.estimatedHours)],
                ["Required Start", formatDate(workOrder.requiredStart)],
                ["Required End", formatDate(workOrder.requiredEnd)],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-2 border-b border-white/5 pb-2">
                  <span className="text-white/40 uppercase text-[10px] tracking-wider">{k}</span>
                  <span className="col-span-2 text-white/75">{v}</span>
                </div>
              ))}
              <div className="pt-2">
                <p className="text-[10px] tracking-wider uppercase text-white/40">Short Text</p>
                <p className="mt-1 text-white/80">{workOrder.shortText}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-wider uppercase text-white/40">Operations</p>
                <div className="mt-2 space-y-2">
                  {workOrder.operations.map((op) => (
                    <div key={op.op} className="flex gap-3 border-l border-white/20 pl-3">
                      <span className="font-mono text-white/35">{op.op}</span>
                      <div>
                        <p className="text-white/70">{op.description}</p>
                        <p className="text-[10px] text-white/35">{op.duration}h est.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] tracking-wider uppercase text-white/40">Safety / ISSoW</p>
                <ul className="mt-2 space-y-1">
                  {workOrder.safetyNotes.map((note) => (
                    <li key={note} className="text-[10px] text-amber-200/70 flex gap-2">
                      <span>⚠</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {showReview && !approved && (
          <div className="border border-dashed border-amber-400/40 bg-amber-500/5 p-4 demo-fade-in">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-amber-200">
              Human-in-the-Loop Required
            </p>
            <p className="mt-2 text-[11px] text-white/55 leading-relaxed">
              Agent has composed the work order and stopped. No RELEASE transaction was sent to SAP PM.
              An authorized maintenance engineer must review, edit if needed, and release manually.
            </p>
            <p className="mt-3 text-[10px] text-white/35 uppercase tracking-wider">
              Policy: HITL-01 · Autonomous writes disabled
            </p>
          </div>
        )}

        {approved && workOrder && (
          <div className="border border-emerald-400/40 bg-emerald-500/5 p-4 demo-fade-in">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-emerald-300">
              Engineer Authorized · WO Released
            </p>
            <p className="mt-2 text-[11px] text-white/55 leading-relaxed">
              Simulated approval by Maintenance Supervisor. Work order WO-9001847 released to planning queue.
              Reelin ID audit exported to compliance log.
            </p>
            <p className="mt-2 text-[10px] font-mono text-emerald-400/80">{workOrder.reelinId}</p>
          </div>
        )}

        {!showInventory && (
          <p className="text-[12px] text-white/35">Awaiting agent inventory and work order composition…</p>
        )}
      </div>
    </div>
  );
}

function MetricsBar({ phase, severity, elapsed }: { phase: SimPhase; severity: Severity; elapsed: number }) {
  if (phase === "idle") return null;
  const meta = getSeverityMeta(severity);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 border border-white/10">
      {[
        { label: "Alert Class", value: meta.alertCode },
        { label: "Priority", value: meta.priority.split(" — ")[0] },
        { label: "Response Window", value: meta.responseWindow },
        { label: "Pipeline Time", value: `${(elapsed / 1000).toFixed(1)}s` },
      ].map((m) => (
        <div key={m.label} className="bg-black p-4">
          <p className="text-[9px] tracking-wider uppercase text-white/35">{m.label}</p>
          <p className="mt-1 text-[12px] sm:text-[13px] font-medium text-white/80">{m.value}</p>
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
  const logs = useMemo(() => buildAgentLogs(asset, severity, buildManualMatch(asset, severity), inventory), [asset, severity, inventory]);
  const workOrder = useMemo(
    () => (phaseIndex(phase) >= phaseIndex("draft") ? buildWorkOrder(asset, severity, inventory) : null),
    [asset, severity, inventory, phase]
  );

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
      <main className="min-h-screen pt-[calc(3.5rem+env(safe-area-inset-top))] sm:pt-[calc(4rem+env(safe-area-inset-top))] pb-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
          <div className="py-6 sm:py-8 border-b border-white/5">
            <p className="text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-white/45">Pilot Simulator</p>
            <h1 className="mt-2 text-[clamp(1.5rem,4vw,2.75rem)] font-bold uppercase tracking-tight max-w-3xl">
              Closed-Loop Maintenance Execution
            </h1>
            <p className="mt-3 text-[13px] sm:text-[15px] text-white/55 max-w-2xl leading-relaxed">
              Interactive sandbox for the 90-day Rheinland proof of concept. Demonstrates read-only telemetry
              ingestion, agent reasoning, SAP inventory lookup, and draft work order composition with mandatory
              human sign-off.
            </p>
          </div>

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

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
            <TelemetryPanel assetId={assetId} severity={severity} phase={phase} />
            <AgentPanel
              logs={logs}
              visibleCount={visibleLogs}
              phase={phase}
              manual={manual}
              reelinId={workOrder?.reelinId ?? null}
            />
            <ErpPanel workOrder={workOrder} phase={phase} inventory={inventory} approved={approved} />
          </div>

          <section className="border border-white/10 p-5 sm:p-8 mt-4">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">Proposal Anchors</p>
            <div className="mt-4 grid sm:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  title: "Technical Verification",
                  body: "Proves read-only OT/IT mapping in sandbox. No live plant controls touched.",
                },
                {
                  title: "Safety Guarantee",
                  body: "Agent never releases SAP PM orders. Draft only — engineer authorization required.",
                },
                {
                  title: "Audit Compliance",
                  body: "Every action sealed with Reelin ID for Asset Administration Shell traceability.",
                },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="text-[12px] font-semibold tracking-wide uppercase">{item.title}</h3>
                  <p className="mt-2 text-[13px] text-white/50 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 mt-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <LogoMark className="w-4 h-4 text-white/70" />
            <p className="text-[11px] tracking-[0.25em] uppercase text-white/45">Operadroom · Sandbox Demo</p>
          </div>
          <div className="flex gap-6 text-[11px] tracking-[0.14em] uppercase text-white/45">
            <Link href="/" className="hover:text-white transition-colors">
              Landing
            </Link>
            <a href="mailto:hi@reelin.ai" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
