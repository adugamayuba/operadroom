"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ASSET_LIST,
  ASSETS,
  buildInventory,
  buildManualMatch,
  buildWorkOrder,
  type AgentLogEntry,
  type AssetId,
  type Severity,
  type SimPhase,
  type WorkOrderDraft,
} from "@/lib/demo/scenarios";
import { playAlertChime, unlockAlertAudio } from "@/lib/demo/alertSound";
import {
  appendAuditPhase,
  attachWorkOrderToAudit,
  createAuditRecord,
  sealAuditRecord,
  type AuditRecord,
} from "@/lib/demo/auditTrail";
import {
  buildFacilitySnapshot,
  buildFixCandidates,
  buildLiveAgentLogs,
  MONITORING_LOG,
  RESPONSE_STEPS,
  summarizeAsset,
  type AssetHealthSummary,
  type FixCandidate,
  type LiveReadingState,
  type MarkerStatus,
  type SystemMode,
} from "@/lib/demo/liveSystem";

const TICK_MS = 1200;
const RAMP_TICKS = 4;
export const SAP_RELEASED_WO = "9001847";

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

function historyKey(assetId: AssetId, label: string) {
  return `${assetId}::${label}`;
}

export function useLiveSystem(initialAsset: AssetId = "p2047") {
  const [selectedAssetId, setSelectedAssetId] = useState<AssetId>(initialAsset);
  const [incidentAssetId, setIncidentAssetId] = useState<AssetId>(initialAsset);
  const [severity, setSeverity] = useState<Severity>("warning");
  const [mode, setMode] = useState<SystemMode>("monitoring");
  const [phase, setPhase] = useState<SimPhase>("monitoring");
  const [ramp, setRamp] = useState(0);
  const [visibleLogs, setVisibleLogs] = useState(1);
  const [approved, setApproved] = useState(false);
  const [engineerNotes, setEngineerNotes] = useState("");
  const [lockedWorkOrder, setLockedWorkOrder] = useState<WorkOrderDraft | null>(null);
  const [auditRecord, setAuditRecord] = useState<AuditRecord | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [lastScan, setLastScan] = useState(new Date());
  const [uptimeSec, setUptimeSec] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [facilityReadings, setFacilityReadings] = useState<Record<AssetId, LiveReadingState[]>>(() => {
    const snap = buildFacilitySnapshot(initialAsset, initialAsset, "warning", "monitoring", 0);
    return snap;
  });
  const [historyMap, setHistoryMap] = useState<Record<string, number[]>>({});

  const timersRef = useRef<number[]>([]);
  const logIntervalRef = useRef<number | null>(null);
  const incidentStartRef = useRef(0);
  const rampRef = useRef(0);
  const modeRef = useRef<SystemMode>("monitoring");
  const incidentAssetRef = useRef<AssetId>(initialAsset);
  const selectedAssetRef = useRef<AssetId>(initialAsset);
  const severityRef = useRef<Severity>("warning");
  const breachAlertRef = useRef(false);
  const alertPlayedRef = useRef(false);
  const auditPhaseRef = useRef<Set<SimPhase>>(new Set());
  const reelinIdRef = useRef<string | null>(null);

  const fireAlertSound = useCallback(() => {
    if (alertPlayedRef.current) return;
    alertPlayedRef.current = true;
    playAlertChime();
  }, []);

  const asset = ASSETS[selectedAssetId];
  const incidentAsset = ASSETS[incidentAssetId];
  const selectedReadings = facilityReadings[selectedAssetId] ?? [];
  const incidentReadings = facilityReadings[incidentAssetId] ?? [];

  const assetSummaries: AssetHealthSummary[] = useMemo(
    () =>
      ASSET_LIST.map((a) =>
        summarizeAsset(a, facilityReadings[a.id] ?? [], selectedAssetId, incidentAssetId, mode)
      ),
    [facilityReadings, selectedAssetId, incidentAssetId, mode]
  );

  const markerStatuses: Record<AssetId, MarkerStatus> = useMemo(() => {
    const out = {} as Record<AssetId, MarkerStatus>;
    assetSummaries.forEach((s) => {
      out[s.id] = s.status === "selected" ? "selected" : s.status;
    });
    return out;
  }, [assetSummaries]);

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
  const workOrder = lockedWorkOrder;

  const readingsWithHistory = useMemo(
    () =>
      selectedReadings.map((r) => ({
        ...r,
        history: historyMap[historyKey(selectedAssetId, r.label)] ?? [],
      })),
    [selectedReadings, historyMap, selectedAssetId]
  );

  const allReadingsWithHistory = useMemo(() => {
    const out = {} as Record<AssetId, LiveReadingState[]>;
    ASSET_LIST.forEach((a) => {
      out[a.id] = (facilityReadings[a.id] ?? []).map((r) => ({
        ...r,
        history: historyMap[historyKey(a.id, r.label)] ?? [],
      }));
    });
    return out;
  }, [facilityReadings, historyMap]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (logIntervalRef.current) {
      clearInterval(logIntervalRef.current);
      logIntervalRef.current = null;
    }
  }, []);

  const syncAuditPhase = useCallback((nextPhase: SimPhase, record: AuditRecord | null) => {
    if (!record || auditPhaseRef.current.has(nextPhase)) return record;
    if (phaseIndex(nextPhase) < phaseIndex("detecting")) return record;
    auditPhaseRef.current.add(nextPhase);
    const updated = appendAuditPhase(record, nextPhase);
    setAuditRecord(updated);
    return updated;
  }, []);

  const runResponsePipeline = useCallback(() => {
    clearTimers();
    setVisibleLogs(0);
    incidentStartRef.current = Date.now();
    setPhase("detecting");

    const target = ASSETS[incidentAssetRef.current];
    const inv = buildInventory(target, severityRef.current);
    const fixList = buildFixCandidates(target, severityRef.current);
    reelinIdRef.current = `rid:agent:operadroom:rhn-${Date.now().toString(36)}`;
    const record = createAuditRecord({
      reelinId: reelinIdRef.current,
      assetTag: target.tag,
      assetName: target.name,
      severity: severityRef.current,
      selectedFix: fixList.find((f) => f.selected)?.title,
    });
    auditPhaseRef.current.add("detecting");
    setAuditRecord(record);

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
    setEngineerNotes("");
    setLockedWorkOrder(null);
    setAuditRecord(null);
    auditPhaseRef.current = new Set();
    breachAlertRef.current = false;
    alertPlayedRef.current = false;
    reelinIdRef.current = null;
    unlockAlertAudio();
    const alertTimer = window.setTimeout(() => fireAlertSound(), RAMP_TICKS * TICK_MS);
    timersRef.current.push(alertTimer);

    const targetId = selectedAssetRef.current;
    setIncidentAssetId(targetId);
    incidentAssetRef.current = targetId;

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
  }, [clearTimers, runResponsePipeline, fireAlertSound]);

  const resetMonitoring = useCallback(() => {
    clearTimers();
    setMode("monitoring");
    modeRef.current = "monitoring";
    setPhase("monitoring");
    setRamp(0);
    rampRef.current = 0;
    setApproved(false);
    setEngineerNotes("");
    setLockedWorkOrder(null);
    setAuditRecord(null);
    auditPhaseRef.current = new Set();
    breachAlertRef.current = false;
    alertPlayedRef.current = false;
    reelinIdRef.current = null;
    setVisibleLogs(1);
    setElapsed(0);
  }, [clearTimers]);

  const selectAsset = useCallback((id: AssetId) => {
    setSelectedAssetId(id);
    selectedAssetRef.current = id;
  }, []);

  const approveWorkOrder = useCallback(
    (notes: string) => {
      const trimmed = notes.trim();
      setEngineerNotes(trimmed);
      setApproved(true);
      setPhase("approved");
      setMode("resolved");
      modeRef.current = "resolved";

      if (auditRecord) {
        const sealed = sealAuditRecord(auditRecord, {
          engineerNotes: trimmed,
          sapWorkOrder: SAP_RELEASED_WO,
        });
        setAuditRecord(sealed);
      }
    },
    [auditRecord]
  );

  useEffect(() => {
    selectedAssetRef.current = selectedAssetId;
  }, [selectedAssetId]);

  useEffect(() => {
    severityRef.current = severity;
  }, [severity]);

  useEffect(() => {
    if (phaseIndex(phase) >= phaseIndex("draft") && !lockedWorkOrder && reelinIdRef.current) {
      const wo = {
        ...buildWorkOrder(incidentAsset, severity, inventory),
        reelinId: reelinIdRef.current,
      };
      setLockedWorkOrder(wo);

      setAuditRecord((prev) => {
        if (!prev) return prev;
        const withWo = attachWorkOrderToAudit(prev, wo);
        auditPhaseRef.current.add("draft");
        return appendAuditPhase(withWo, "draft");
      });
    }
  }, [phase, incidentAsset, severity, inventory, lockedWorkOrder]);

  useEffect(() => {
    if (!auditRecord || phase === "monitoring" || phase === "telemetry") return;
    syncAuditPhase(phase, auditRecord);
  }, [phase, auditRecord, syncAuditPhase]);

  useEffect(() => {
    if (mode !== "incident") return;
    const breached = incidentReadings.some((r) => r.breached);
    if (breached && !breachAlertRef.current) {
      breachAlertRef.current = true;
      fireAlertSound();
    }
  }, [incidentReadings, mode, fireAlertSound]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setUptimeSec((u) => u + 1);
      setScanCount((c) => c + 1);
      setLastScan(new Date());

      const snap = buildFacilitySnapshot(
        incidentAssetRef.current,
        selectedAssetRef.current,
        severityRef.current,
        modeRef.current,
        rampRef.current
      );

      setHistoryMap((prev) => {
        const updated = { ...prev };
        ASSET_LIST.forEach((a) => {
          (snap[a.id] ?? []).forEach((reading) => {
            const key = historyKey(a.id, reading.label);
            updated[key] = [...(updated[key] ?? []), reading.value].slice(-20);
          });
        });
        return updated;
      });
      setFacilityReadings(snap);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const normalCount = assetSummaries.filter((s) => s.status === "normal" || s.status === "selected").length;

  const releaseLog: AgentLogEntry | null =
    approved && workOrder
      ? {
          id: "release",
          phase: "approved",
          timestamp: "Live",
          level: "success",
          message: "SAP RELEASE authorized · engineer agent memory updated",
          detail: engineerNotes
            ? `Notes indexed to engineer Reelin ID · WO ${SAP_RELEASED_WO} · ${workOrder.reelinId}`
            : `WO ${SAP_RELEASED_WO} released · session stored for future retrieval · ${workOrder.reelinId}`,
        }
      : null;

  const displayLogs: AgentLogEntry[] =
    mode === "monitoring"
      ? [MONITORING_LOG(scanCount, ASSET_LIST.length)]
      : releaseLog
        ? [...logs, releaseLog]
        : logs;

  return {
    assetId: selectedAssetId,
    incidentAssetId,
    asset,
    severity,
    setSeverity,
    mode,
    phase,
    ramp,
    readings: readingsWithHistory,
    allReadings: allReadingsWithHistory,
    assetSummaries,
    markerStatuses,
    normalCount,
    totalAssets: ASSET_LIST.length,
    scanCount,
    logs: displayLogs,
    visibleLogs: mode === "monitoring" ? 1 : approved ? displayLogs.length : visibleLogs,
    manual,
    fixes,
    inventory,
    workOrder,
    auditRecord,
    approved,
    engineerNotes,
    sapWorkOrder: approved ? SAP_RELEASED_WO : null,
    elapsed,
    lastScan,
    uptimeSec,
    canTrigger: mode === "monitoring" || mode === "resolved",
    canApprove: phase === "review" && !approved,
    triggerAnomaly,
    resetMonitoring,
    selectAsset,
    approveWorkOrder,
    setAssetId: selectAsset,
  };
}
