/** Rahul-aligned POC framing: ESSA + SEAM maintenance execution */

export const POC_PROCESS = {
  code: "AM-05",
  name: "Safe Isolation & Maintenance Execution",
  seam: "SEAM · Asset Management",
  outcome:
    "Target: 3 engineers + agent cover the same execution load as a 10-person desk (POC metric)",
};

export const ESSA_STEPS = [
  { key: "eliminate", label: "Eliminate", detail: "Duplicate searches across WO, OEM, field notes" },
  { key: "simplify", label: "Simplify", detail: "One alert → one ranked procedure path" },
  { key: "standardize", label: "Standardize", detail: "Shell / OEM steps mapped to SAP operations" },
  { key: "aggregate", label: "Aggregate", detail: "Tags, P&IDs, historian, records in one context" },
  { key: "ai", label: "AI", detail: "Agent drafts WO · engineer owns release" },
] as const;

export const DATA_LAYER = [
  { name: "Tag Master", status: "Synced", detail: "ISA tags · equipment IDs" },
  { name: "P&ID Graph", status: "Linked", detail: "Node P-2047 resolved" },
  { name: "Cognite CDF", status: "Connected", detail: "Asset twin sync" },
  { name: "PI Historian", status: "Streaming", detail: "1.2s cycle" },
  { name: "SAP PM / MM", status: "Ready", detail: "HITL enforced" },
  { name: "Reelin ID", status: "Active", detail: "Audit trail" },
] as const;

export const PRIORITY_PROCESSES = [
  "Safe Isolation (LOTO / ISSoW)",
  "Management of Change",
  "Corrective Maintenance Execution",
  "Preventive Work Packaging",
  "Spares & BOM Alignment",
  "Turnaround Scope Link",
] as const;
