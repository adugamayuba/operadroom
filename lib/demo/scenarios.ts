export type Severity = "advisory" | "warning" | "critical";

export type SimPhase =
  | "monitoring"
  | "detecting"
  | "telemetry"
  | "ingest"
  | "records"
  | "diagnose"
  | "analyze"
  | "select"
  | "inventory"
  | "draft"
  | "review"
  | "approved";

export type AssetKind =
  | "pump"
  | "compressor"
  | "exchanger"
  | "valve"
  | "tank"
  | "pipe"
  | "column"
  | "furnace";

export type AssetId =
  | "p2047"
  | "p1012"
  | "c3011"
  | "e1156"
  | "v4820"
  | "t1105"
  | "pl302"
  | "col801"
  | "f2201"
  | "xv3044";

export interface TelemetryReading {
  label: string;
  unit: string;
  baseline: number;
  values: Record<Severity, number>;
  threshold: { advisory: number; warning: number; critical: number };
  direction: "above" | "below";
}

export interface AgentLogEntry {
  id: string;
  phase: SimPhase;
  timestamp: string;
  level: "info" | "action" | "success" | "warn";
  message: string;
  detail?: string;
}

export interface ManualMatch {
  source: string;
  section: string;
  excerpt: string;
  confidence: number;
}

export interface InventoryLine {
  material: string;
  description: string;
  plant: string;
  sloc: string;
  qtyAvailable: number;
  qtyRequired: number;
  status: "available" | "partial" | "procure";
}

export interface WorkOrderDraft {
  orderType: string;
  priority: string;
  equipment: string;
  functionalLocation: string;
  shortText: string;
  longText: string;
  plannerGroup: string;
  workCenter: string;
  estimatedHours: number;
  requiredStart: string;
  requiredEnd: string;
  operations: { op: number; description: string; duration: number }[];
  spareParts: { material: string; qty: number; status: string }[];
  safetyNotes: string[];
  reelinId: string;
}

export interface AssetScenario {
  id: AssetId;
  tag: string;
  name: string;
  kind: AssetKind;
  unit: string;
  functionalLocation: string;
  twinSource: string;
  facilityPosition: { x: number; z: number };
  telemetry: TelemetryReading[];
}

export const FACILITY = {
  name: "Energy and Chemicals Park Rheinland",
  code: "SH-RHN-01",
  region: "North Rhine-Westphalia, Germany",
  integration: "C3 AI Reliability · PI Historian · Cognite CDF · SAP S/4HANA PM · Reelin ID",
};

const t = (
  label: string,
  unit: string,
  baseline: number,
  direction: "above" | "below",
  thresholds: { advisory: number; warning: number; critical: number },
  values: Record<Severity, number>
): TelemetryReading => ({
  label,
  unit,
  baseline,
  direction,
  threshold: thresholds,
  values,
});

export const ASSETS: Record<AssetId, AssetScenario> = {
  p2047: {
    id: "p2047",
    tag: "P-2047",
    name: "Crude Charge Pump",
    kind: "pump",
    unit: "CDU-1 · Crude Distillation",
    functionalLocation: "RHN-CDU1-P2047",
    twinSource: "Cognite · PI Historian · Aveva Predictive",
    facilityPosition: { x: -5, z: 0 },
    telemetry: [
      t("Vibration (DE)", "mm/s RMS", 2.1, "above", { advisory: 4.0, warning: 6.5, critical: 9.0 }, { advisory: 4.2, warning: 6.8, critical: 9.4 }),
      t("Bearing Temp (NDE)", "°C", 68, "above", { advisory: 75, warning: 90, critical: 105 }, { advisory: 78, warning: 92, critical: 108 }),
      t("Discharge Pressure", "bar", 18.4, "below", { advisory: 17.5, warning: 16.0, critical: 14.5 }, { advisory: 17.1, warning: 15.8, critical: 14.2 }),
      t("Flow Rate", "m³/h", 842, "below", { advisory: 810, warning: 780, critical: 740 }, { advisory: 798, warning: 761, critical: 712 }),
    ],
  },
  p1012: {
    id: "p1012",
    tag: "P-1012",
    name: "Vacuum Residue Pump",
    kind: "pump",
    unit: "VDU · Vacuum Distillation",
    functionalLocation: "RHN-VDU-P1012",
    twinSource: "Honeywell Forge · OSIsoft PI",
    facilityPosition: { x: -2, z: -1 },
    telemetry: [
      t("Vibration (DE)", "mm/s RMS", 1.8, "above", { advisory: 3.5, warning: 5.8, critical: 8.2 }, { advisory: 3.8, warning: 6.1, critical: 8.6 }),
      t("Seal Chamber Pressure", "bar", 2.4, "below", { advisory: 2.1, warning: 1.8, critical: 1.4 }, { advisory: 2.0, warning: 1.7, critical: 1.3 }),
      t("Motor Current", "A", 124, "above", { advisory: 138, warning: 152, critical: 168 }, { advisory: 141, warning: 155, critical: 172 }),
    ],
  },
  c3011: {
    id: "c3011",
    tag: "C-3011",
    name: "Recycle Gas Compressor",
    kind: "compressor",
    unit: "FCC · Fluid Catalytic Cracking",
    functionalLocation: "RHN-FCC-C3011",
    twinSource: "Siemens MindSphere · OSIsoft PI",
    facilityPosition: { x: 5, z: 1 },
    telemetry: [
      t("Vibration (Axial)", "mm/s RMS", 3.4, "above", { advisory: 5.5, warning: 8.0, critical: 10.5 }, { advisory: 5.9, warning: 8.2, critical: 11.1 }),
      t("Discharge Temp", "°C", 142, "above", { advisory: 155, warning: 168, critical: 185 }, { advisory: 158, warning: 171, critical: 189 }),
      t("Lube Oil Pressure", "bar", 4.2, "below", { advisory: 3.8, warning: 3.2, critical: 2.6 }, { advisory: 3.6, warning: 3.1, critical: 2.4 }),
    ],
  },
  e1156: {
    id: "e1156",
    tag: "E-1156",
    name: "Crude Preheat Exchanger",
    kind: "exchanger",
    unit: "CDU-1 · Heat Recovery",
    functionalLocation: "RHN-CDU1-E1156",
    twinSource: "Aspen Mtell · Honeywell Forge",
    facilityPosition: { x: -3.5, z: 1.5 },
    telemetry: [
      t("Tube Side ΔT", "°C", 42, "below", { advisory: 36, warning: 30, critical: 24 }, { advisory: 34, warning: 28, critical: 21 }),
      t("Fouling Factor", "m²·K/W", 0.00042, "above", { advisory: 0.00065, warning: 0.00088, critical: 0.0012 }, { advisory: 0.00068, warning: 0.00091, critical: 0.00124 }),
      t("Shell Pressure Drop", "bar", 0.31, "above", { advisory: 0.45, warning: 0.6, critical: 0.75 }, { advisory: 0.48, warning: 0.62, critical: 0.79 }),
    ],
  },
  v4820: {
    id: "v4820",
    tag: "V-4820",
    name: "Fractionator Feed Control Valve",
    kind: "valve",
    unit: "CDU-1 · Distillation Control",
    functionalLocation: "RHN-CDU1-V4820",
    twinSource: "Cognite · SAP PdM",
    facilityPosition: { x: -4.5, z: 2.5 },
    telemetry: [
      t("Valve Position", "%", 62, "above", { advisory: 78, warning: 88, critical: 95 }, { advisory: 80, warning: 90, critical: 97 }),
      t("Actuator Pressure", "bar", 5.8, "below", { advisory: 5.2, warning: 4.6, critical: 3.8 }, { advisory: 5.0, warning: 4.4, critical: 3.6 }),
      t("Process Flow Deviation", "%", 0, "above", { advisory: 8, warning: 15, critical: 22 }, { advisory: 9, warning: 16, critical: 24 }),
    ],
  },
  t1105: {
    id: "t1105",
    tag: "T-1105",
    name: "Crude Storage Tank",
    kind: "tank",
    unit: "Tank Farm · Receipt",
    functionalLocation: "RHN-TF-T1105",
    twinSource: "Cognite · Radar Level · API 653",
    facilityPosition: { x: 2, z: 5 },
    telemetry: [
      t("Shell Temperature", "°C", 38, "above", { advisory: 48, warning: 58, critical: 68 }, { advisory: 50, warning: 60, critical: 70 }),
      t("Level Deviation", "mm", 0, "above", { advisory: 120, warning: 240, critical: 380 }, { advisory: 135, warning: 255, critical: 400 }),
      t("Foundation Settlement", "mm", 2.1, "above", { advisory: 4.5, warning: 6.0, critical: 8.5 }, { advisory: 4.8, warning: 6.4, critical: 9.0 }),
    ],
  },
  pl302: {
    id: "pl302",
    tag: "PL-302",
    name: "Hot Oil Transfer Line",
    kind: "pipe",
    unit: "CDU-1 · Interconnect",
    functionalLocation: "RHN-CDU1-PL302",
    twinSource: "PI Historian · Corrosion Monitoring",
    facilityPosition: { x: 0, z: 0.5 },
    telemetry: [
      t("Wall Thickness", "mm", 12.4, "below", { advisory: 11.2, warning: 10.0, critical: 8.8 }, { advisory: 11.0, warning: 9.8, critical: 8.5 }),
      t("Surface Temp", "°C", 285, "above", { advisory: 310, warning: 335, critical: 360 }, { advisory: 312, warning: 338, critical: 365 }),
      t("CUI Risk Index", "score", 0.22, "above", { advisory: 0.45, warning: 0.62, critical: 0.78 }, { advisory: 0.48, warning: 0.65, critical: 0.82 }),
    ],
  },
  col801: {
    id: "col801",
    tag: "C-801",
    name: "Atmospheric Distillation Column",
    kind: "column",
    unit: "CDU-1 · Primary Fractionation",
    functionalLocation: "RHN-CDU1-C801",
    twinSource: "Aveva · Aspen HYSYS · PI",
    facilityPosition: { x: -4, z: -2 },
    telemetry: [
      t("Top Pressure", "bar", 1.42, "above", { advisory: 1.55, warning: 1.68, critical: 1.82 }, { advisory: 1.57, warning: 1.71, critical: 1.85 }),
      t("Tray ΔP (Section 3)", "mbar", 42, "above", { advisory: 52, warning: 62, critical: 75 }, { advisory: 54, warning: 64, critical: 78 }),
      t("Reflux Flow", "m³/h", 218, "below", { advisory: 200, warning: 185, critical: 168 }, { advisory: 198, warning: 182, critical: 165 }),
    ],
  },
  f2201: {
    id: "f2201",
    tag: "F-2201",
    name: "Crude Furnace",
    kind: "furnace",
    unit: "CDU-1 · Fired Equipment",
    functionalLocation: "RHN-CDU1-F2201",
    twinSource: "Honeywell Forge · Flue Gas Analytics",
    facilityPosition: { x: -8, z: -4 },
    telemetry: [
      t("Bridgewall Temp", "°C", 412, "above", { advisory: 435, warning: 455, critical: 480 }, { advisory: 438, warning: 458, critical: 485 }),
      t("Excess O₂", "%", 2.8, "above", { advisory: 3.5, warning: 4.2, critical: 5.0 }, { advisory: 3.6, warning: 4.4, critical: 5.2 }),
      t("Coil Outlet Temp Dev.", "°C", 0, "above", { advisory: 8, warning: 14, critical: 22 }, { advisory: 9, warning: 15, critical: 24 }),
    ],
  },
  xv3044: {
    id: "xv3044",
    tag: "XV-3044",
    name: "Emergency Shutdown Valve",
    kind: "valve",
    unit: "FCC · Safety Instrumented",
    functionalLocation: "RHN-FCC-XV3044",
    twinSource: "SIS · SAP PM · Cognite",
    facilityPosition: { x: 6.5, z: -1 },
    telemetry: [
      t("Stroke Time", "s", 2.8, "above", { advisory: 3.5, warning: 4.5, critical: 6.0 }, { advisory: 3.7, warning: 4.8, critical: 6.2 }),
      t("Solenoid Health", "score", 0.95, "below", { advisory: 0.88, warning: 0.82, critical: 0.75 }, { advisory: 0.86, warning: 0.80, critical: 0.72 }),
      t("Partial Stroke Test", "status", 1, "below", { advisory: 0.9, warning: 0.8, critical: 0.7 }, { advisory: 0.88, warning: 0.78, critical: 0.68 }),
    ],
  },
};

export const ASSET_LIST = Object.values(ASSETS);

const SEVERITY_META: Record<
  Severity,
  { label: string; alertCode: string; priority: string; orderType: string; responseWindow: string }
> = {
  advisory: { label: "Advisory", alertCode: "ALM-PRED-02", priority: "P3 — Scheduled", orderType: "PM01 — Preventive", responseWindow: "72 hours" },
  warning: { label: "Warning", alertCode: "ALM-PRED-01", priority: "P2 — Corrective", orderType: "PM02 — Corrective", responseWindow: "48 hours" },
  critical: { label: "Critical", alertCode: "ALM-PRED-00", priority: "P1 — Emergency", orderType: "PM03 — Breakdown", responseWindow: "4 hours" },
};

export function getSeverityMeta(severity: Severity) {
  return SEVERITY_META[severity];
}

const MANUAL_BY_ASSET: Partial<Record<AssetId, ManualMatch>> = {
  p2047: {
    source: "OEM Manual · Flowserve DVSP · Rev 4.2",
    section: "§7.4 Bearing Diagnostics & Run-Down Criteria",
    excerpt: "Inspect thrust bearing clearance, verify lube oil supply pressure ≥3.5 bar, perform borescope before restart when vibration limits exceeded.",
    confidence: 0.94,
  },
  c3011: {
    source: "Shell Engineering Standard · SES-T-6971",
    section: "§3.2 Reciprocating Compressor Vibration Limits",
    excerpt: "Cross-reference discharge temperature with anti-surge map. Inspect suction scrubber differential and valve plate wear per turnaround checklist.",
    confidence: 0.96,
  },
  e1156: {
    source: "TEMA Standards · API 660",
    section: "§5.1 Fouling & Thermal Performance Degradation",
    excerpt: "ΔT degradation indicates fouling or tube blockage. Recommend chemical cleaning or bundle pull at earliest shutdown slot.",
    confidence: 0.92,
  },
  xv3044: {
    source: "IEC 61511 · SIS Maintenance Procedure SH-SIS-112",
    section: "§4.3 Partial Stroke Testing Requirements",
    excerpt: "SIS valve stroke time deviation requires functional test within 24h. Do not bypass SIF without MOC approval.",
    confidence: 0.98,
  },
  f2201: {
    source: "API 556 · Fired Heater Inspection",
    section: "§6.2 Bridgewall Temperature Limits",
    excerpt: "Bridgewall excursion requires burner tuning and flue gas analysis. Verify coil outlet TMT integrity before rate increase.",
    confidence: 0.93,
  },
};

export function buildManualMatch(asset: AssetScenario, severity: Severity): ManualMatch {
  const base = MANUAL_BY_ASSET[asset.id] ?? {
    source: `OEM / Shell Standard · ${asset.kind.toUpperCase()} maintenance corpus`,
    section: "§Auto-retrieved from customer document store",
    excerpt: `Maintenance procedure retrieved for ${asset.tag}. Follow LOTO SH-LOTO-4412 before physical intervention.`,
    confidence: 0.9,
  };
  return { ...base, confidence: severity === "critical" ? Math.min(0.99, base.confidence + 0.03) : base.confidence };
}

const INVENTORY_BY_KIND: Record<AssetKind, InventoryLine[]> = {
  pump: [
    { material: "1047821", description: "Radial Ball Bearing 6316-C3", plant: "RHN1", sloc: "0001", qtyAvailable: 4, qtyRequired: 2, status: "available" },
    { material: "1047829", description: "Mechanical Seal Kit", plant: "RHN1", sloc: "0001", qtyAvailable: 1, qtyRequired: 1, status: "available" },
  ],
  compressor: [
    { material: "3319022", description: "Suction Valve Plate Set", plant: "RHN1", sloc: "0002", qtyAvailable: 1, qtyRequired: 1, status: "available" },
    { material: "3319044", description: "Lube Oil Cooler Gasket Kit", plant: "RHN1", sloc: "0002", qtyAvailable: 0, qtyRequired: 1, status: "procure" },
  ],
  exchanger: [
    { material: "5510233", description: "Chemical Cleaning Agent Bundle", plant: "RHN1", sloc: "0004", qtyAvailable: 3, qtyRequired: 1, status: "available" },
    { material: "5510299", description: "Gasket Set Tube Sheet", plant: "RHN1", sloc: "0004", qtyAvailable: 2, qtyRequired: 1, status: "available" },
  ],
  valve: [
    { material: "7721033", description: "Actuator Diaphragm Kit", plant: "RHN1", sloc: "0005", qtyAvailable: 2, qtyRequired: 1, status: "available" },
    { material: "7721041", description: "Positioner Calibration Module", plant: "RHN1", sloc: "0005", qtyAvailable: 1, qtyRequired: 1, status: "available" },
  ],
  tank: [
    { material: "6610022", description: "Roof Seal Repair Kit", plant: "RHN1", sloc: "0006", qtyAvailable: 1, qtyRequired: 1, status: "available" },
    { material: "6610038", description: "CP Anode Assembly", plant: "RHN1", sloc: "0006", qtyAvailable: 0, qtyRequired: 2, status: "procure" },
  ],
  pipe: [
    { material: "4410099", description: "Hot Tap Fitting 6in", plant: "RHN1", sloc: "0007", qtyAvailable: 0, qtyRequired: 1, status: "procure" },
    { material: "4410112", description: "Insulation Cladding Sheet", plant: "RHN1", sloc: "0007", qtyAvailable: 8, qtyRequired: 4, status: "available" },
  ],
  column: [
    { material: "8810044", description: "Tray Valve Set (Section 3)", plant: "RHN1", sloc: "0008", qtyAvailable: 1, qtyRequired: 1, status: "available" },
    { material: "8810052", description: "Manway Gasket Kit", plant: "RHN1", sloc: "0008", qtyAvailable: 2, qtyRequired: 1, status: "available" },
  ],
  furnace: [
    { material: "9910021", description: "Burner Tip Assembly", plant: "RHN1", sloc: "0009", qtyAvailable: 2, qtyRequired: 2, status: "available" },
    { material: "9910033", description: "Refractory Patch Kit", plant: "RHN1", sloc: "0009", qtyAvailable: 1, qtyRequired: 1, status: "available" },
  ],
};

export function buildInventory(asset: AssetScenario, severity: Severity): InventoryLine[] {
  const lines = INVENTORY_BY_KIND[asset.kind].map((l) => ({ ...l }));
  if (severity === "critical" && lines[0]) {
    lines[0] = { ...lines[0], qtyAvailable: Math.max(0, lines[0].qtyAvailable - 2), status: lines[0].qtyAvailable < lines[0].qtyRequired ? "procure" : lines[0].status };
  }
  return lines;
}

export function buildWorkOrder(asset: AssetScenario, severity: Severity, inventory: InventoryLine[]): WorkOrderDraft {
  const meta = getSeverityMeta(severity);
  const now = new Date();
  const startOffset = severity === "critical" ? 1 : severity === "warning" ? 8 : 24;
  const endOffset = severity === "critical" ? 6 : severity === "warning" ? 32 : 96;
  const start = new Date(now.getTime() + startOffset * 3600000);
  const end = new Date(now.getTime() + endOffset * 3600000);

  return {
    orderType: meta.orderType,
    priority: meta.priority,
    equipment: `${asset.tag} · ${asset.name}`,
    functionalLocation: asset.functionalLocation,
    shortText: `${asset.tag} — ${severity === "critical" ? "Emergency" : severity === "warning" ? "Corrective" : "Preventive"} intervention per twin alert`,
    longText: `Auto-generated by Operadroom from ${meta.alertCode}. Twin: ${asset.twinSource}. Response: ${meta.responseWindow}. DRAFT only — engineer release required.`,
    plannerGroup: "PM-RHN-ROT",
    workCenter: asset.unit.includes("FCC") ? "WC-MECH-FCC" : "WC-MECH-CDU1",
    estimatedHours: severity === "critical" ? 16 : severity === "warning" ? 8 : 4,
    requiredStart: start.toISOString(),
    requiredEnd: end.toISOString(),
    operations: [
      { op: 10, description: "Isolate per LOTO SH-LOTO-4412", duration: severity === "critical" ? 2 : 1 },
      { op: 20, description: "Field inspection and condition verification", duration: 2 },
      { op: 30, description: `Corrective work on ${asset.kind} per retrieved OEM / Shell standard`, duration: severity === "critical" ? 8 : 4 },
      { op: 40, description: "Functional test and baseline re-record to PI", duration: 2 },
    ],
    spareParts: inventory.map((i) => ({
      material: i.material,
      qty: i.qtyRequired,
      status: i.status === "procure" ? "PR draft created" : "Reserved in SAP MM",
    })),
    safetyNotes: [
      "Hot work permit if flange breaking required",
      "ISSoW approval before confined space entry",
      "Agent logged to Reelin ID — no autonomous SAP release",
    ],
    reelinId: `rid:agent:operadroom:rhn-${Date.now().toString(36)}`,
  };
}

export const SIM_STEPS: { phase: SimPhase; label: string; durationMs: number }[] = [
  { phase: "telemetry", label: "Telemetry Ingestion", durationMs: 2200 },
  { phase: "ingest", label: "Alert Normalization", durationMs: 1800 },
  { phase: "diagnose", label: "Manual & Root Cause", durationMs: 2800 },
  { phase: "inventory", label: "SAP MM Lookup", durationMs: 2200 },
  { phase: "draft", label: "Work Order Draft", durationMs: 2400 },
  { phase: "review", label: "Human Review Queue", durationMs: 1200 },
];

export function buildAgentLogs(asset: AssetScenario, severity: Severity, manual: ManualMatch, inventory: InventoryLine[]): AgentLogEntry[] {
  const meta = getSeverityMeta(severity);
  const triggered = asset.telemetry.filter((t) => {
    const val = t.values[severity];
    return t.direction === "above" ? val >= t.threshold[severity] : val <= t.threshold[severity];
  });

  return [
    { id: "1", phase: "telemetry", timestamp: "T+0.0s", level: "warn", message: `${meta.alertCode} from Cognite Data Fusion`, detail: `${triggered.length}/${asset.telemetry.length} tags breached on ${asset.tag}` },
    { id: "2", phase: "ingest", timestamp: "T+0.4s", level: "info", message: "Mapped to SAP functional location", detail: `${asset.functionalLocation} · Equipment master verified · Read-only OT` },
    { id: "3", phase: "ingest", timestamp: "T+0.9s", level: "info", message: "14-day PI Historian trend cross-check", detail: "Escalating slope · No duplicate open orders" },
    { id: "4", phase: "diagnose", timestamp: "T+1.6s", level: "action", message: "Maintenance corpus query", detail: `${manual.source} · ${(manual.confidence * 100).toFixed(0)}% match` },
    { id: "5", phase: "diagnose", timestamp: "T+2.4s", level: "success", message: "Root cause hypothesis ranked", detail: `Primary: ${asset.kind} performance deviation · Secondary: operating envelope breach` },
    { id: "6", phase: "inventory", timestamp: "T+3.2s", level: "action", message: "SAP MM stock check · Plant RHN1", detail: `${inventory.length} BOM lines · ${inventory.filter((i) => i.status === "procure").length} PR draft(s)` },
    { id: "7", phase: "inventory", timestamp: "T+3.8s", level: inventory.some((i) => i.status === "procure") ? "warn" : "success", message: inventory.some((i) => i.status === "procure") ? "Partial stock — PR draft prepared" : "Spares available for reservation" },
    { id: "8", phase: "draft", timestamp: "T+4.5s", level: "action", message: "SAP PM work order composition", detail: `${meta.orderType} · ${meta.priority}` },
    { id: "9", phase: "draft", timestamp: "T+5.1s", level: "success", message: "Operations and labor estimates attached", detail: "LOTO · inspection · corrective · test run" },
    { id: "10", phase: "review", timestamp: "T+5.8s", level: "info", message: "Saved as DRAFT in SAP PM", detail: "HITL policy — RELEASE blocked pending engineer sign-off" },
    { id: "11", phase: "review", timestamp: "T+6.0s", level: "success", message: "Reelin ID audit record sealed", detail: "Compliance export ready" },
  ];
}
