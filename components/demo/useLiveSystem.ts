"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ASSETS,
  buildInventory,
  buildManualMatch,
  buildWorkOrder,
  type AgentLogEntry,
  type AssetId,
  type Severity,
  type SimPhase,
} from "@/lib/demo/scenarios";
import {
  buildFixCandidates,
  buildLiveAgentLogs,
  buildLiveReadings,
  MONITORING_LOG,
  RESPONSE_STEPS,
  type FixCandidate,
  type LiveReadingState,
  type SystemMode,
} from "@/lib/demo/liveSystem";

const TICK_MS = 1200;
const RAMP_TICKS = 4;

export function phaseIndex(phase: SimPhase): number {
  const order: SimPhase[] = [
    "monitoring",
    "detecting",
    "telemetry",
    "ingest",
    "records",
    "diagnose",
    "analyze",
    "select",
    "inventory",
    "draft",
    "review",
    "approved",
  ];
  return order.indexOf(phase);
}

export function useLiveSystem(initialAsset: AssetId = "p2047") {
  const [assetId, setAssetId] = useState<AssetId>(initialAsset);
  const [severity, setSeverity] = useState<Severity>("warning");
  const [mode, setMode] = useState<SystemMode>("monitoring");
  const [phase, setPhase] = useState<SimPhase>("monitoring");
  const [ramp, setRamp] = useState(0);
  const [visibleLogs, setVisibleLogs] = useState(1);
  const [approved, setApproved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lastScan, setLastScan] = useState(new Date());
  const [uptimeSec, setUptimeSec] = useState(0);
  const [readings, setReadings] = useState<LiveReadingState[]>([]);
  const [historyMap, setHistoryMap] = useState<Record<string, number[]>>({});

  const timersRef = useRef<number[]>([]);
  const logIntervalRef = useRef<number | null>(null);
  const incidentStartRef = useRef(0);
  const rampRef = useRef(0);
  const modeRef = useRef<SystemMode>("monitoring");

  const asset = ASSETS[assetId];
  const manual = useMemo(
    () => (phaseIndex(phase) >= phaseIndex("diagnose") ? buildManualMatch(asset, severity) : null),
    [asset, severity, phase]
  );
  const inventory = useMemo(() => buildInventory(asset, severity), [asset, severity]);
  const fixes = useMemo(() => buildFixCandidates(asset, severity), [asset, severity]);
  const logs = useMemo(
    () => buildLiveAgentLogs(asset, severity, buildManualMatch(asset, severity), inventory, fixes),
    [asset, severity, inventory, fixes]
  );
  const workOrder = useMemo(
    () => (phaseIndex(phase) >= phaseIndex("draft") ? buildWorkOrder(asset, severity, inventory) : null),
    [asset, severity, inventory, phase]
  );

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (logIntervalRef.current) {
      clearInterval(logIntervalRef.current);
      logIntervalRef.current = null;
    }
  }, []);

  const runResponsePipeline = useCallback(() => {
    clearTimers();
    setVisibleLogs(0);
    incidentStartRef.current = Date.now();
    setPhase("detecting");
    setMode("incident");

    logIntervalRef.current = window.setInterval(() => {
      setVisibleLogs((v) => Math.min(logs.length, v + 1));
      setElapsed(Date.now() - incidentStartRef.current);
    }, 580);

    let cumulative = 800;
    RESPONSE_STEPS.forEach((step) => {
      cumulative += step.durationMs;
      const t = window.setTimeout(() => {
        setPhase(step.phase);
        setElapsed(Date.now() - incidentStartRef.current);
      }, cumulative);
      timersRef.current.push(t);
    });

    const done = window.setTimeout(() => {
      setPhase("review");
      setVisibleLogs(logs.length);
      setElapsed(Date.now() - incidentStartRef.current);
      if (logIntervalRef.current) clearInterval(logIntervalRef.current);
    }, cumulative + 500);
    timersRef.current.push(done);
  }, [clearTimers, logs.length]);

  const triggerAnomaly = useCallback(() => {
    if (modeRef.current !== "monitoring") return;
    clearTimers();
    setApproved(false);
    setRamp(0);
    rampRef.current = 0;
    setMode("incident");
    modeRef.current = "incident";
    setPhase("telemetry");
    setVisibleLogs(0);
    setElapsed(0);

    let tick = 0;
    const rampTimer = window.setInterval(() => {
      tick += 1;
      const r = tick / RAMP_TICKS;
      rampRef.current = r;
      setRamp(r);
      if (tick >= RAMP_TICKS) {
        clearInterval(rampTimer);
        runResponsePipeline();
      }
    }, TICK_MS);
    timersRef.current.push(rampTimer as unknown as number);
  }, [clearTimers, runResponsePipeline]);

  const resetMonitoring = useCallback(() => {
    clearTimers();
    setMode("monitoring");
    modeRef.current = "monitoring";
    setPhase("monitoring");
    setRamp(0);
    rampRef.current = 0;
    setApproved(false);
    setVisibleLogs(1);
    setElapsed(0);
  }, [clearTimers]);

  const selectAsset = useCallback((id: AssetId) => {
    setAssetId(id);
  }, []);

  const approveWorkOrder = useCallback(() => {
    setApproved(true);
    setPhase("approved");
    setMode("resolved");
    modeRef.current = "resolved";
  }, []);

  // Live telemetry tick
  useEffect(() => {
    const id = window.setInterval(() => {
      setUptimeSec((u) => u + 1);
      setLastScan(new Date());
      const currentMode = modeRef.current;
      const r = rampRef.current;
      const next = buildLiveReadings(asset, severity, currentMode === "monitoring" ? "monitoring" : "incident", r);
      setHistoryMap((prev) => {
        const updated = { ...prev };
        next.forEach((reading) => {
          updated[reading.label] = [...(updated[reading.label] ?? []), reading.value].slice(-24);
        });
        return updated;
      });
      setReadings(next);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [asset, severity]);

  useEffect(() => {
    setReadings(
      buildLiveReadings(asset, severity, "monitoring", 0).map((r) => ({
        ...r,
        history: historyMap[r.label] ?? [],
      }))
    );
  }, [assetId]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const displayLogs: AgentLogEntry[] =
    mode === "monitoring" ? [MONITORING_LOG] : logs;

  const isResponding = mode === "incident" && phaseIndex(phase) >= phaseIndex("detecting") && phase !== "review" && phase !== "approved";

  return {
    assetId,
    asset,
    severity,
    setSeverity,
    mode,
    phase,
    ramp,
    readings: readings.map((r) => ({ ...r, history: historyMap[r.label] ?? r.history })),
    logs: displayLogs,
    visibleLogs: mode === "monitoring" ? 1 : visibleLogs,
    manual,
    fixes,
    inventory,
    workOrder,
    approved,
    elapsed,
    lastScan,
    uptimeSec,
    isResponding,
    canTrigger: mode === "monitoring" || mode === "resolved",
    canApprove: phase === "review" && !approved,
    triggerAnomaly,
    resetMonitoring,
    selectAsset,
    approveWorkOrder,
    setAssetId: selectAsset,
  };
}
