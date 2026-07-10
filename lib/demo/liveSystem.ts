import type { AssetId, AssetKind, AssetScenario, InventoryLine, ManualMatch, Severity, SimPhase } from "./scenarios";
import { ASSET_LIST, ASSETS, getSeverityMeta } from "./scenarios";

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

export interface AssetHealthSummary {
  id: AssetId;
  tag: string;
  name: string;
  unit: string;
  kind: AssetKind;
  status: "normal" | "selected" | "incident" | "breached";
  primaryLabel: string;
  primaryValue: number;
  primaryUnit: string;
  breachedCount: number;
}

export type MarkerStatus = "normal" | "selected" | "incident" | "breached";

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
  ramp: number,
  asIncident = mode === "incident"
): LiveReadingState[] {
  return asset.telemetry.map((reading) => {
    const target = asIncident ? reading.values[severity] : reading.baseline;
    const value = asIncident ? lerp(reading.baseline, target, ramp) : jitter(reading.baseline);
    const threshold = reading.threshold[severity];
    const breached =
      asIncident &&
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

export function buildFacilitySnapshot(
  incidentAssetId: AssetId,
  selectedAssetId: AssetId,
  severity: Severity,
  mode: SystemMode,
  ramp: number
): Record<AssetId, LiveReadingState[]> {
  const out = {} as Record<AssetId, LiveReadingState[]>;
  for (const asset of ASSET_LIST) {
    const isIncident = mode === "incident" && asset.id === incidentAssetId;
    out[asset.id] = buildLiveReadings(asset, severity, mode, isIncident ? ramp : 0, isIncident);
  }
  return out;
}

export function summarizeAsset(
  asset: AssetScenario,
  readings: LiveReadingState[],
  selectedAssetId: AssetId,
  incidentAssetId: AssetId,
  mode: SystemMode
): AssetHealthSummary {
  const primary = readings[0];
  const breachedCount = readings.filter((r) => r.breached).length;
  let status: AssetHealthSummary["status"] = "normal";
  if (mode === "incident" && asset.id === incidentAssetId) {
    status = breachedCount > 0 ? "breached" : "incident";
  } else if (asset.id === selectedAssetId) {
    status = "selected";
  }
  return {
    id: asset.id,
    tag: asset.tag,
    name: asset.name,
    unit: asset.unit,
    kind: asset.kind,
    status,
    primaryLabel: primary?.label ?? "—",
    primaryValue: primary?.value ?? 0,
    primaryUnit: primary?.unit ?? "",
    breachedCount,
  };
}

export function markerStatusFor(summary: AssetHealthSummary): MarkerStatus {
  return summary.status;
}

export interface FixCandidate {
  id: string;
  title: string;
  source: string;
  score: number;
  downtimeHours: number;
  selected?: boolean;
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
  { phase: "detecting", label: "Trigger event", durationMs: 1400 },
  { phase: "ingest", label: "Tag + P&ID link", durationMs: 1600 },
  { phase: "records", label: "Aggregate records", durationMs: 2200 },
  { phase: "diagnose", label: "Root cause", durationMs: 2000 },
  { phase: "analyze", label: "ESSA analyze", durationMs: 2800 },
  { phase: "select", label: "Standardize fix", durationMs: 1600 },
  { phase: "inventory", label: "SAP MM", durationMs: 2000 },
  { phase: "draft", label: "Draft work order", durationMs: 2200 },
  { phase: "review", label: "Engineer release", durationMs: 1400 },
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
    { id: "1", phase: "detecting", timestamp: "Live", level: "warn", message: `Maintenance event on ${asset.tag}`, detail: `${meta.alertCode} · PI threshold · POC process AM-05 armed` },
    { id: "2", phase: "ingest", timestamp: "T+0.6s", level: "info", message: "Tag master + P&ID node resolved", detail: `${asset.tag} ↔ Sheet 2047-A · FL ${asset.functionalLocation}` },
    { id: "3", phase: "ingest", timestamp: "T+1.1s", level: "info", message: "Alert normalized to SAP equipment master", detail: "Duplicate WO check passed · Cognite twin in sync" },
    { id: "4", phase: "records", timestamp: "T+1.8s", level: "action", message: "ESSA Aggregate — records fused", detail: `847 docs · 12 prior WOs · 3 OEM manuals · field notes indexed` },
    { id: "5", phase: "records", timestamp: "T+2.4s", level: "success", message: "Standard procedure corpus retrieved", detail: `${manual.source} · ${manual.section}` },
    { id: "6", phase: "diagnose", timestamp: "T+3.0s", level: "action", message: "Root cause ranked for execution", detail: `${asset.kind} degradation · Confidence ${(manual.confidence * 100).toFixed(0)}%` },
    { id: "7", phase: "analyze", timestamp: "T+3.8s", level: "action", message: `Safe Isolation paths scored · ${fixes.length} procedures`, detail: rejected.map((f) => `${f.title} (${(f.score * 100).toFixed(0)}%)`).join(" · ") },
    { id: "8", phase: "analyze", timestamp: "T+4.6s", level: "info", message: "ESSA Simplify — single ranked execution path", detail: `Downtime · spares · ISSoW · window ${meta.responseWindow}` },
    { id: "9", phase: "select", timestamp: "T+5.2s", level: "success", message: `Standardized fix: ${selected.title}`, detail: `${selected.source} · ${(selected.score * 100).toFixed(0)}% · Est. ${selected.downtimeHours}h` },
    { id: "10", phase: "inventory", timestamp: "T+5.9s", level: "action", message: "SAP MM spares check", detail: `${inventory.length} BOM lines · ${inventory.filter((i) => i.status === "procure").length} PR draft(s)` },
    { id: "11", phase: "inventory", timestamp: "T+6.4s", level: inventory.some((i) => i.status === "procure") ? "warn" : "success", message: inventory.some((i) => i.status === "procure") ? "Partial stock — PR draft created" : "Spares reserved for Safe Isolation kit" },
    { id: "12", phase: "draft", timestamp: "T+7.1s", level: "action", message: "SAP PM work order composed", detail: `${meta.orderType} · LOTO op linked · ${meta.priority}` },
    { id: "13", phase: "draft", timestamp: "T+7.8s", level: "success", message: "Maintenance execution package attached", detail: `${selected.title} · ISSoW flags propagated` },
    { id: "14", phase: "review", timestamp: "T+8.4s", level: "info", message: "Draft saved — RELEASE blocked", detail: "HITL-01 · Awaiting maintenance engineer authorization" },
    { id: "15", phase: "review", timestamp: "T+8.6s", level: "success", message: "Reelin ID audit trail sealed", detail: "SEAM-compliant export ready" },
  ];
}

export const MONITORING_LOG = (scanCount: number, assetCount: number): import("./scenarios").AgentLogEntry => ({
  id: "mon",
  phase: "monitoring",
  timestamp: "Live",
  level: "info",
  message: `POC armed — Safe Isolation & maintenance execution`,
  detail: `Tags · P&IDs · PI · SAP linked · ${assetCount} assets · scan ${scanCount}`,
});
