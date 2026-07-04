export type Severity = "advisory" | "warning" | "critical";

export type SimPhase =
  | "idle"
  | "telemetry"
  | "ingest"
  | "diagnose"
  | "inventory"
  | "draft"
  | "review"
  | "approved";

export type AssetId = "p2047" | "c3011" | "e1156";

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
  unit: string;
  functionalLocation: string;
  twinSource: string;
  telemetry: TelemetryReading[];
}

export const FACILITY = {
  name: "Rheinland Refinery Complex",
  code: "SH-RHN-01",
  region: "North Rhine-Westphalia, Germany",
  integration: "SAP S/4HANA PM · IBM Maximo · Cognite Data Fusion",
};

export const ASSETS: Record<AssetId, AssetScenario> = {
  p2047: {
    id: "p2047",
    tag: "P-2047",
    name: "Crude Charge Pump",
    unit: "CDU-1 · Crude Distillation",
    functionalLocation: "RHN-CDU1-P2047",
    twinSource: "Cognite · PI Historian · Aveva Predictive",
    telemetry: [
      {
        label: "Vibration (DE)",
        unit: "mm/s RMS",
        baseline: 2.1,
        values: { advisory: 4.2, warning: 6.8, critical: 9.4 },
        threshold: { advisory: 4.0, warning: 6.5, critical: 9.0 },
        direction: "above",
      },
      {
        label: "Bearing Temp (NDE)",
        unit: "°C",
        baseline: 68,
        values: { advisory: 78, warning: 92, critical: 108 },
        threshold: { advisory: 75, warning: 90, critical: 105 },
        direction: "above",
      },
      {
        label: "Discharge Pressure",
        unit: "bar",
        baseline: 18.4,
        values: { advisory: 17.1, warning: 15.8, critical: 14.2 },
        threshold: { advisory: 17.5, warning: 16.0, critical: 14.5 },
        direction: "below",
      },
      {
        label: "Flow Rate",
        unit: "m³/h",
        baseline: 842,
        values: { advisory: 798, warning: 761, critical: 712 },
        threshold: { advisory: 810, warning: 780, critical: 740 },
        direction: "below",
      },
    ],
  },
  c3011: {
    id: "c3011",
    tag: "C-3011",
    name: "Recycle Gas Compressor",
    unit: "FCC · Fluid Catalytic Cracking",
    functionalLocation: "RHN-FCC-C3011",
    twinSource: "Siemens MindSphere · OSIsoft PI",
    telemetry: [
      {
        label: "Vibration (Axial)",
        unit: "mm/s RMS",
        baseline: 3.4,
        values: { advisory: 5.9, warning: 8.2, critical: 11.1 },
        threshold: { advisory: 5.5, warning: 8.0, critical: 10.5 },
        direction: "above",
      },
      {
        label: "Discharge Temp",
        unit: "°C",
        baseline: 142,
        values: { advisory: 158, warning: 171, critical: 189 },
        threshold: { advisory: 155, warning: 168, critical: 185 },
        direction: "above",
      },
      {
        label: "Lube Oil Pressure",
        unit: "bar",
        baseline: 4.2,
        values: { advisory: 3.6, warning: 3.1, critical: 2.4 },
        threshold: { advisory: 3.8, warning: 3.2, critical: 2.6 },
        direction: "below",
      },
    ],
  },
  e1156: {
    id: "e1156",
    tag: "E-1156",
    name: "Crude Preheat Exchanger",
    unit: "CDU-1 · Heat Recovery",
    functionalLocation: "RHN-CDU1-E1156",
    twinSource: "Aspen Mtell · Honeywell Forge",
    telemetry: [
      {
        label: "Tube Side ΔT",
        unit: "°C",
        baseline: 42,
        values: { advisory: 34, warning: 28, critical: 21 },
        threshold: { advisory: 36, warning: 30, critical: 24 },
        direction: "below",
      },
      {
        label: "Fouling Factor",
        unit: "m²·K/W",
        baseline: 0.00042,
        values: { advisory: 0.00068, warning: 0.00091, critical: 0.00124 },
        threshold: { advisory: 0.00065, warning: 0.00088, critical: 0.0012 },
        direction: "above",
      },
      {
        label: "Shell Pressure Drop",
        unit: "bar",
        baseline: 0.31,
        values: { advisory: 0.48, warning: 0.62, critical: 0.79 },
        threshold: { advisory: 0.45, warning: 0.6, critical: 0.75 },
        direction: "above",
      },
    ],
  },
};

const SEVERITY_META: Record<
  Severity,
  { label: string; alertCode: string; priority: string; orderType: string; responseWindow: string }
> = {
  advisory: {
    label: "Advisory",
    alertCode: "ALM-PRED-02",
    priority: "P3 — Scheduled",
    orderType: "PM01 — Preventive",
    responseWindow: "72 hours",
  },
  warning: {
    label: "Warning",
    alertCode: "ALM-PRED-01",
    priority: "P2 — Corrective",
    orderType: "PM02 — Corrective",
    responseWindow: "48 hours",
  },
  critical: {
    label: "Critical",
    alertCode: "ALM-PRED-00",
    priority: "P1 — Emergency",
    orderType: "PM03 — Breakdown",
    responseWindow: "4 hours",
  },
};

export function getSeverityMeta(severity: Severity) {
  return SEVERITY_META[severity];
}

export function buildManualMatch(asset: AssetScenario, severity: Severity): ManualMatch {
  const matches: Record<AssetId, ManualMatch> = {
    p2047: {
      source: "OEM Manual · Flowserve DVSP · Rev 4.2",
      section: "§7.4 Bearing Diagnostics & Run-Down Criteria",
      excerpt:
        severity === "critical"
          ? "Immediate shutdown required if DE vibration exceeds 9.0 mm/s RMS with concurrent NDE bearing temp >105°C. Inspect thrust bearing clearance, verify lube oil supply pressure ≥3.5 bar, and perform borescope before restart."
          : severity === "warning"
            ? "Schedule bearing inspection within 48h when vibration trend exceeds 6.5 mm/s RMS for >30 min. Check coupling alignment, foundation bolts, and lube oil particle count per ISO 4406."
            : "Monitor vibration trend. Increase PI snapshot frequency to 1-min intervals. Plan alignment check at next TA window.",
      confidence: severity === "critical" ? 0.97 : severity === "warning" ? 0.94 : 0.89,
    },
    c3011: {
      source: "Shell Engineering Standard · SES-T-6971",
      section: "§3.2 Reciprocating Compressor Vibration Limits",
      excerpt:
        severity === "critical"
          ? "Axial vibration >10.5 mm/s requires immediate load reduction to 60% and lube system inspection. Do not restart until rod drop and valve condition verified."
          : "Cross-reference discharge temperature with anti-surge map. Inspect suction scrubber differential and valve plate wear per turnaround checklist.",
      confidence: 0.96,
    },
    e1156: {
      source: "TEMA Standards · API 660 Heat Exchanger Maintenance",
      section: "§5.1 Fouling & Thermal Performance Degradation",
      excerpt:
        severity === "critical"
          ? "ΔT degradation >35% from design indicates severe fouling or tube blockage. Recommend chemical cleaning or bundle pull at earliest shutdown slot. Verify bypass valve integrity."
          : "Fouling factor trend warrants scheduling offline cleaning. Review crude blend slate impact on wax deposition rate.",
      confidence: 0.92,
    },
  };
  return matches[asset.id];
}

export function buildInventory(asset: AssetScenario, severity: Severity): InventoryLine[] {
  if (asset.id === "p2047") {
    return [
      {
        material: "1047821",
        description: "Radial Ball Bearing 6316-C3",
        plant: "RHN1",
        sloc: "0001",
        qtyAvailable: severity === "critical" ? 2 : 4,
        qtyRequired: 2,
        status: "available",
      },
      {
        material: "1047829",
        description: "Mechanical Seal Kit DVSP-450",
        plant: "RHN1",
        sloc: "0001",
        qtyAvailable: severity === "critical" ? 0 : 1,
        qtyRequired: 1,
        status: severity === "critical" ? "procure" : "available",
      },
      {
        material: "8820144",
        description: "Lube Oil Filter Element 10μm",
        plant: "RHN1",
        sloc: "0003",
        qtyAvailable: 6,
        qtyRequired: 2,
        status: "available",
      },
    ];
  }
  if (asset.id === "c3011") {
    return [
      {
        material: "3319022",
        description: "Suction Valve Plate Set",
        plant: "RHN1",
        sloc: "0002",
        qtyAvailable: 1,
        qtyRequired: 1,
        status: "available",
      },
      {
        material: "3319044",
        description: "Lube Oil Cooler Gasket Kit",
        plant: "RHN1",
        sloc: "0002",
        qtyAvailable: 0,
        qtyRequired: 1,
        status: "procure",
      },
    ];
  }
  return [
    {
      material: "5510233",
      description: "Chemical Cleaning Agent Bundle",
      plant: "RHN1",
      sloc: "0004",
      qtyAvailable: 3,
      qtyRequired: 1,
      status: "available",
    },
    {
      material: "5510299",
      description: "Gasket Set Tube Sheet E-1156",
      plant: "RHN1",
      sloc: "0004",
      qtyAvailable: 2,
      qtyRequired: 1,
      status: "available",
    },
  ];
}

export function buildWorkOrder(
  asset: AssetScenario,
  severity: Severity,
  inventory: InventoryLine[]
): WorkOrderDraft {
  const meta = getSeverityMeta(severity);
  const now = new Date();
  const startOffset = severity === "critical" ? 1 : severity === "warning" ? 8 : 24;
  const endOffset = severity === "critical" ? 6 : severity === "warning" ? 32 : 96;

  const start = new Date(now.getTime() + startOffset * 3600000);
  const end = new Date(now.getTime() + endOffset * 3600000);

  const shortText =
    severity === "critical"
      ? `${asset.tag} — Emergency bearing/vibration intervention`
      : severity === "warning"
        ? `${asset.tag} — Corrective inspection per predictive alert`
        : `${asset.tag} — Preventive follow-up from twin anomaly`;

  return {
    orderType: meta.orderType,
    priority: meta.priority,
    equipment: `${asset.tag} · ${asset.name}`,
    functionalLocation: asset.functionalLocation,
    shortText,
    longText: `Auto-generated by Operadroom Agent from ${meta.alertCode} predictive alert. Twin source: ${asset.twinSource}. Response window: ${meta.responseWindow}. All field values derived from read-only telemetry mapping and OEM maintenance corpus. Status: DRAFT — requires authorized engineer release before SAP PM release.`,
    plannerGroup: "PM-RHN-ROT",
    workCenter: "WC-MECH-CDU1",
    estimatedHours: severity === "critical" ? 16 : severity === "warning" ? 8 : 4,
    requiredStart: start.toISOString(),
    requiredEnd: end.toISOString(),
    operations: [
      {
        op: 10,
        description: "Isolate equipment per LOTO procedure SH-LOTO-4412",
        duration: severity === "critical" ? 2 : 1,
      },
      {
        op: 20,
        description: "Perform vibration analysis and bearing temperature verification",
        duration: 2,
      },
      {
        op: 30,
        description:
          asset.id === "p2047"
            ? "Replace bearing assembly / inspect mechanical seal per OEM §7.4"
            : asset.id === "c3011"
              ? "Inspect valve plates and lube oil system per SES-T-6971"
              : "Execute bundle inspection / chemical cleaning per API 660",
        duration: severity === "critical" ? 8 : 4,
      },
      { op: 40, description: "Alignment check, test run, and post-work vibration baseline", duration: 2 },
    ],
    spareParts: inventory.map((i) => ({
      material: i.material,
      qty: i.qtyRequired,
      status: i.status === "procure" ? "PR draft created" : "Reserved in SAP MM",
    })),
    safetyNotes: [
      "Hot work permit required if seal replacement involves flange breaking",
      "Confined space entry not authorized without ISSoW approval",
      "Agent action logged to Reelin ID — no autonomous SAP release",
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

export function buildAgentLogs(
  asset: AssetScenario,
  severity: Severity,
  manual: ManualMatch,
  inventory: InventoryLine[]
): AgentLogEntry[] {
  const meta = getSeverityMeta(severity);
  const triggered = asset.telemetry.filter((t) => {
    const val = t.values[severity];
    return t.direction === "above" ? val >= t.threshold[severity] : val <= t.threshold[severity];
  });

  return [
    {
      id: "1",
      phase: "telemetry",
      timestamp: "T+0.0s",
      level: "warn",
      message: `${meta.alertCode} received from Cognite Data Fusion`,
      detail: `${triggered.length} of ${asset.telemetry.length} tags breached ${meta.label.toLowerCase()} thresholds on ${asset.tag}`,
    },
    {
      id: "2",
      phase: "ingest",
      timestamp: "T+0.4s",
      level: "info",
      message: "Mapped alert to SAP functional location",
      detail: `${asset.functionalLocation} · Equipment master verified · Read-only OT gateway`,
    },
    {
      id: "3",
      phase: "ingest",
      timestamp: "T+0.9s",
      level: "info",
      message: "Cross-referenced 14-day PI Historian trend",
      detail: "Escalating vibration slope detected · No duplicate open PM orders",
    },
    {
      id: "4",
      phase: "diagnose",
      timestamp: "T+1.6s",
      level: "action",
      message: "Queried maintenance knowledge base",
      detail: `${manual.source} · Match confidence ${(manual.confidence * 100).toFixed(0)}%`,
    },
    {
      id: "5",
      phase: "diagnose",
      timestamp: "T+2.4s",
      level: "success",
      message: "Root cause hypothesis ranked",
      detail:
        asset.id === "p2047"
          ? "Primary: bearing degradation · Secondary: alignment drift · Tertiary: lube contamination"
          : "Primary: performance degradation per twin model · Secondary: fouling / wear pattern",
    },
    {
      id: "6",
      phase: "inventory",
      timestamp: "T+3.2s",
      level: "action",
      message: "SAP MM stock check — Plant RHN1",
      detail: `${inventory.length} BOM lines evaluated · ${inventory.filter((i) => i.status === "procure").length} procurement draft(s)`,
    },
    {
      id: "7",
      phase: "inventory",
      timestamp: "T+3.8s",
      level: inventory.some((i) => i.status === "procure") ? "warn" : "success",
      message: inventory.some((i) => i.status === "procure")
        ? "Partial stock — PR draft prepared for missing materials"
        : "All required spares available for reservation",
    },
    {
      id: "8",
      phase: "draft",
      timestamp: "T+4.5s",
      level: "action",
      message: "Composing SAP PM work order draft",
      detail: `${meta.orderType} · ${meta.priority} · ${meta.responseWindow} response window`,
    },
    {
      id: "9",
      phase: "draft",
      timestamp: "T+5.1s",
      level: "success",
      message: "4 operations structured with labor estimates",
      detail: "LOTO, inspection, corrective work, post-run verification",
    },
    {
      id: "10",
      phase: "review",
      timestamp: "T+5.8s",
      level: "info",
      message: "Work order saved as DRAFT in SAP PM",
      detail: "Awaiting engineer authorization — agent blocked from RELEASE per HITL policy",
    },
    {
      id: "11",
      phase: "review",
      timestamp: "T+6.0s",
      level: "success",
      message: "Reelin ID audit trail sealed",
      detail: "Cryptographic action log ready for compliance export",
    },
  ];
}
