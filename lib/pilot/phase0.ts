/** Phase 0 data layer checklist — pilot prerequisite */

export interface Phase0Item {
  id: string;
  layer: string;
  detail: string;
  source: string;
}

export const PHASE0_CHECKLIST: Phase0Item[] = [
  { id: "tags", layer: "Tag Master", detail: "ISA tags ↔ SAP functional locations (15 CDU-1 assets)", source: "SAP / PI export" },
  { id: "pid", layer: "P&ID Graph", detail: "Node map for CDU-1 equipment train", source: "Engineering document ingest" },
  { id: "pi", layer: "PI Historian", detail: "14-day trend + alert thresholds (read-only)", source: "OSIsoft PI connector" },
  { id: "sap", layer: "SAP PM / MM", detail: "Equipment master + spares snapshot", source: "SAP S/4HANA export" },
  { id: "records", layer: "Maintenance records", detail: "OEM manuals + 24 mo WO history (pump class)", source: "Document library upload" },
  { id: "cognite", layer: "Cognite CDF", detail: "Asset twin sync for CDU-1 scope", source: "CDF read-only API" },
];

const STORAGE_KEY = "operadroom-pilot-phase0";

export function loadPhase0State(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function savePhase0State(state: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function phase0Progress(state: Record<string, boolean>): { done: number; total: number; complete: boolean } {
  const total = PHASE0_CHECKLIST.length;
  const done = PHASE0_CHECKLIST.filter((i) => state[i.id]).length;
  return { done, total, complete: done === total };
}
