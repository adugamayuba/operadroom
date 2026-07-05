import type { AssetKind, AssetScenario, InventoryLine, ManualMatch, Severity, SimPhase } from "./scenarios";
import { getSeverityMeta } from "./scenarios";

export type SystemMode = "monitoring" | "incident" | "resolved";

export interface LiveReadingState {
  label: string;
  unit: string;
  value: number;
  baseline: number;
  threshold: number;
  direction: "above" | "below";
  breached: boolean;
  history: number[];
}

export interface FixCandidate {
  id: string;
  title: string;
  source: string;
  score: number;
  downtimeHours: number;
  selected?: boolean;
}

export function jitter(value: number, pct = 0.018): number {
  const delta = value * pct * (Math.random() * 2 - 1);
  return value + delta;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

export function buildLiveReadings(
  asset: AssetScenario,
  severity: Severity,
  mode: SystemMode,
  ramp: number
): LiveReadingState[] {
  return asset.telemetry.map((reading) => {
    const target =
      mode === "incident" ? reading.values[severity] : reading.baseline;
    const value =
      mode === "incident"
        ? lerp(reading.baseline, target, ramp)
        : jitter(reading.baseline);
    const threshold = reading.threshold[severity];
    const breached =
      mode === "incident" &&
      ramp > 0.85 &&
      (reading.direction === "above" ? value >= threshold : value <= threshold);

    return {
      label: reading.label,
      unit: reading.unit,
      value,
      baseline: reading.baseline,
      threshold,
      direction: reading.direction,
      breached,
      history: [],
    };
  });
}

export function buildFixCandidates(asset: AssetScenario, severity: Severity): FixCandidate[] {
  const kindFixes: Record<AssetKind, FixCandidate[]> = {
    pump: [
      { id: "a", title: "Increase monitoring frequency only", source: "SOP-RHN-PM-014", score: 0.34, downtimeHours: 0 },
      { id: "b", title: "Schedule alignment inspection within 48h", source: "OEM §7.2", score: 0.71, downtimeHours: 4 },
      { id: "c", title: "Replace bearing assembly + mechanical seal", source: "OEM §7.4", score: 0.94, downtimeHours: 12 },
    ],
    compressor: [
      { id: "a", title: "Reduce load to 70% and monitor", source: "SES-T-6971", score: 0.41, downtimeHours: 0 },
      { id: "b", title: "Inspect valve plates and lube system", source: "OEM manual", score: 0.78, downtimeHours: 8 },
      { id: "c", title: "Emergency valve plate replacement", source: "TA checklist", score: 0.91, downtimeHours: 16 },
    ],
    exchanger: [
      { id: "a", title: "Adjust crude blend slate", source: "Process bulletin", score: 0.38, downtimeHours: 0 },
      { id: "b", title: "Schedule chemical cleaning at next window", source: "API 660", score: 0.69, downtimeHours: 24 },
      { id: "c", title: "Pull bundle for inspection / cleaning", source: "TEMA §5.1", score: 0.92, downtimeHours: 48 },
    ],
    valve: [
      { id: "a", title: "Recalibrate positioner", source: "Vendor bulletin", score: 0.55, downtimeHours: 2 },
      { id: "b", title: "Replace actuator diaphragm", source: "SAP BOM", score: 0.82, downtimeHours: 6 },
      { id: "c", title: "Full valve overhaul with stroke test", source: "SIS procedure", score: 0.93, downtimeHours: 10 },
    ],
    tank: [
      { id: "a", title: "Increase level monitoring cadence", source: "API 653", score: 0.42, downtimeHours: 0 },
      { id: "b", title: "Roof seal inspection", source: "Tank integrity plan", score: 0.74, downtimeHours: 8 },
      { id: "c", title: "Foundation survey + CP anode replacement", source: "Structural report", score: 0.88, downtimeHours: 16 },
    ],
    pipe: [
      { id: "a", title: "Increase CUI inspection frequency", source: "Corrosion program", score: 0.45, downtimeHours: 0 },
      { id: "b", title: "Install temporary insulation cladding", source: "Integrity SOP", score: 0.7, downtimeHours: 4 },
      { id: "c", title: "Hot tap + wall thickness verification", source: "API 570", score: 0.9, downtimeHours: 12 },
    ],
    column: [
      { id: "a", title: "Adjust reflux ratio", source: "Process control", score: 0.4, downtimeHours: 0 },
      { id: "b", title: "Tray inspection at next outage", source: "Column TA plan", score: 0.73, downtimeHours: 32 },
      { id: "c", title: "Replace Section 3 tray valve set", source: "SAP BOM 8810044", score: 0.91, downtimeHours: 20 },
    ],
    furnace: [
      { id: "a", title: "Burner tuning and O₂ trim", source: "API 556", score: 0.52, downtimeHours: 2 },
      { id: "b", title: "Replace burner tips", source: "Fired heater SOP", score: 0.79, downtimeHours: 8 },
      { id: "c", title: "Refractory patch + coil outlet survey", source: "TA scope", score: 0.92, downtimeHours: 24 },
    ],
  };

  const fixes = kindFixes[asset.kind].map((f) => ({ ...f }));
  if (severity === "critical") {
    fixes.sort((a, b) => b.score - a.score);
  } else {
    fixes.sort((a, b) => b.score - a.score);
  }
  fixes[0].selected = true;
  if (severity === "advisory") fixes[0].score = 0.68;
  return fixes;
}

export const RESPONSE_STEPS: { phase: SimPhase; label: string; durationMs: number }[] = [
  { phase: "detecting", label: "Anomaly detection", durationMs: 1400 },
  { phase: "ingest", label: "Alert normalization", durationMs: 1600 },
  { phase: "records", label: "Internal records", durationMs: 2200 },
  { phase: "diagnose", label: "Root cause", durationMs: 2000 },
  { phase: "analyze", label: "Fix analysis", durationMs: 2800 },
  { phase: "select", label: "Procedure selection", durationMs: 1600 },
  { phase: "inventory", label: "SAP MM", durationMs: 2000 },
  { phase: "draft", label: "Work order", durationMs: 2200 },
  { phase: "review", label: "Human review", durationMs: 1400 },
];

export function buildLiveAgentLogs(
  asset: AssetScenario,
  severity: Severity,
  manual: ManualMatch,
  inventory: InventoryLine[],
  fixes: FixCandidate[]
): import("./scenarios").AgentLogEntry[] {
  const meta = getSeverityMeta(severity);
  const selected = fixes.find((f) => f.selected) ?? fixes[0];
  const rejected = fixes.filter((f) => !f.selected);

  return [
    { id: "1", phase: "detecting", timestamp: "Live", level: "warn", message: `Threshold breach on ${asset.tag}`, detail: `${meta.alertCode} · Cognite stream · Auto-escalation enabled` },
    { id: "2", phase: "ingest", timestamp: "T+0.6s", level: "info", message: "Alert normalized to SAP equipment master", detail: `${asset.functionalLocation} · Duplicate check passed` },
    { id: "3", phase: "ingest", timestamp: "T+1.1s", level: "info", message: "PI Historian trend correlated", detail: "14-day slope confirms degradation · Not transient spike" },
    { id: "4", phase: "records", timestamp: "T+1.8s", level: "action", message: "Internal maintenance records queried", detail: `847 documents · 12 prior WOs for ${asset.tag} · 3 OEM manuals` },
    { id: "5", phase: "records", timestamp: "T+2.4s", level: "success", message: "Relevant corpus retrieved", detail: `${manual.source} · ${manual.section}` },
    { id: "6", phase: "diagnose", timestamp: "T+3.0s", level: "action", message: "Root cause model executed", detail: `Primary: ${asset.kind} degradation · Confidence ${(manual.confidence * 100).toFixed(0)}%` },
    { id: "7", phase: "analyze", timestamp: "T+3.8s", level: "action", message: `Evaluating ${fixes.length} corrective procedures`, detail: rejected.map((f) => `${f.title} (${(f.score * 100).toFixed(0)}%)`).join(" · ") },
    { id: "8", phase: "analyze", timestamp: "T+4.6s", level: "info", message: "Multi-criteria analysis: downtime, spares, safety, SLA", detail: `Response window ${meta.responseWindow} · Plant load 94%` },
    { id: "9", phase: "select", timestamp: "T+5.2s", level: "success", message: `Selected: ${selected.title}`, detail: `${selected.source} · Score ${(selected.score * 100).toFixed(0)}% · Est. ${selected.downtimeHours}h downtime` },
    { id: "10", phase: "inventory", timestamp: "T+5.9s", level: "action", message: "SAP MM availability check", detail: `${inventory.length} BOM lines · ${inventory.filter((i) => i.status === "procure").length} PR draft(s)` },
    { id: "11", phase: "inventory", timestamp: "T+6.4s", level: inventory.some((i) => i.status === "procure") ? "warn" : "success", message: inventory.some((i) => i.status === "procure") ? "Partial stock — procurement draft created" : "All spares reserved" },
    { id: "12", phase: "draft", timestamp: "T+7.1s", level: "action", message: "SAP PM work order composed", detail: `${meta.orderType} · ${meta.priority}` },
    { id: "13", phase: "draft", timestamp: "T+7.8s", level: "success", message: "Operations linked to selected procedure", detail: selected.title },
    { id: "14", phase: "review", timestamp: "T+8.4s", level: "info", message: "Draft saved — RELEASE blocked", detail: "HITL-01 · Awaiting maintenance engineer authorization" },
    { id: "15", phase: "review", timestamp: "T+8.6s", level: "success", message: "Reelin ID audit trail sealed", detail: "Export ready for compliance" },
  ];
}

export const MONITORING_LOG: import("./scenarios").AgentLogEntry = {
  id: "mon",
  phase: "monitoring",
  timestamp: "Live",
  level: "info",
  message: "Continuous plant monitoring active",
  detail: "Scanning telemetry across 10 instrumented assets · Read-only OT gateway",
};
