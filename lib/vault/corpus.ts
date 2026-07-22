import type { AgentStage } from "./agentFlow";

/** Synthetic legacy archive for Rheinland Plant Memory demo */

export type VaultDocType = "maintenance_card" | "work_order" | "pid" | "shift_log" | "procedure";

export interface PageRegion {
  id: string;
  label: string;
  top: number;
  left: number;
  width: number;
  height: number;
  stage: AgentStage;
}

export interface PageBlock {
  text: string;
  highlight?: boolean;
  handwritten?: boolean;
  indent?: number;
  size?: "sm" | "md" | "lg";
  spacer?: boolean;
}

export interface VaultDocument {
  id: string;
  title: string;
  type: VaultDocType;
  date: string;
  source: string;
  assetTags: string[];
  page: number;
  totalPages: number;
  blocks: PageBlock[];
  condition: "faded" | "stained" | "typed" | "handwritten";
  regions: PageRegion[];
  stamp?: string;
}

export const VAULT_CORPUS_STATS = {
  pagesIndexed: 847,
  documents: 312,
  assetTags: 156,
  entities: 12403,
  oldestRecord: "1952",
  rooms: ["Archive B · CDU-1", "Engineering vault · Building 14"],
} as const;

export const VAULT_DOCUMENTS: Record<string, VaultDocument> = {
  "doc-1972-p2047": {
    id: "doc-1972-p2047",
    title: "Maintenance card — P-2047 bearing overhaul",
    type: "maintenance_card",
    date: "14 Mar 1972",
    source: "Archive B · CDU-1 · Bundle 47",
    assetTags: ["P-2047", "CDU-1"],
    page: 1,
    totalPages: 1,
    condition: "handwritten",
    stamp: "MR-1972-0847",
    regions: [
      { id: "r-tag", label: "P-2047", top: 14, left: 8, width: 42, height: 8, stage: "tag" },
      { id: "r-body", label: "Bearing note", top: 38, left: 8, width: 84, height: 18, stage: "ocr" },
      { id: "r-spacer", label: "Spacer 3.2mm", top: 58, left: 10, width: 78, height: 14, stage: "extract" },
      { id: "r-sign", label: "H. Weber", top: 78, left: 8, width: 35, height: 10, stage: "extract" },
    ],
    blocks: [
      { text: "SHELL · RHEINLAND", size: "sm", handwritten: false },
      { text: "Maintenance Record — Crude Unit", size: "sm", handwritten: true },
      { spacer: true, text: "" },
      { text: "Equipment Tag: P-2047", size: "lg", handwritten: true },
      { text: "Crude Charge Pump · CDU-1", handwritten: true },
      { text: "Functional Loc: RHN-CDU1-P2047", size: "sm", handwritten: true },
      { spacer: true, text: "" },
      { text: "Work Performed:", handwritten: true },
      { text: "Bearing replacement — drive end SKF 6318", handwritten: true, indent: 1 },
      { text: "Alignment checked · coupling re-torqued", handwritten: true, indent: 1 },
      { spacer: true, text: "" },
      { text: "⚠ NOTE — non-standard spacer installed (3.2mm)", handwritten: true, highlight: true },
      { text: "Do NOT revert to OEM spec without eng. review", handwritten: true, highlight: true },
      { spacer: true, text: "" },
      { text: "Parts used: spacer custom · gasket set", handwritten: true, indent: 1 },
      { text: "Next inspection: 6 months", handwritten: true, indent: 1 },
      { spacer: true, text: "" },
      { text: "Signed: H. Weber · Shift B · 14/03/72", handwritten: true },
      { text: "Supervisor init: [illegible]", size: "sm", handwritten: true },
    ],
  },
  "doc-1988-p2047": {
    id: "doc-1988-p2047",
    title: "Corrective WO — P-2047 vibration follow-up",
    type: "work_order",
    date: "03 Nov 1988",
    source: "Archive B · CDU-1 · WO microfilm",
    assetTags: ["P-2047"],
    page: 1,
    totalPages: 2,
    condition: "typed",
    stamp: "WO-1988-4421",
    regions: [
      { id: "r-tag", label: "P-2047", top: 12, left: 6, width: 38, height: 7, stage: "tag" },
      { id: "r-find", label: "Vibration 7.2 mm/s", top: 32, left: 6, width: 88, height: 12, stage: "ocr" },
      { id: "r-act", label: "Spacer verified", top: 48, left: 6, width: 88, height: 10, stage: "extract" },
    ],
    blocks: [
      { text: "CORRECTIVE WORK ORDER — RHEINLAND REFINERY", size: "sm" },
      { text: "Equipment: P-2047 Crude Charge Pump", size: "md" },
      { text: "FL: RHN-CDU1-P2047 · Priority: 2", size: "sm" },
      { spacer: true, text: "" },
      { text: "Finding: Elevated vibration at DE bearing · 7.2 mm/s RMS", size: "md" },
      { text: "Trend: increasing over 14-day PI window", size: "sm" },
      { spacer: true, text: "" },
      { text: "Action: Alignment check · spacer per 1972 card verified", highlight: true },
      { text: "Reference: MR-1972-0847 maintenance record", size: "sm" },
      { spacer: true, text: "" },
      { text: "Closed: vibration normalized to 2.1 mm/s", size: "md" },
      { text: "Closed by: K. Brenner · 03 Nov 1988", size: "sm" },
    ],
  },
  "doc-pid-2047": {
    id: "doc-pid-2047",
    title: "P&ID Sheet 2047-A · Crude charge train",
    type: "pid",
    date: "Rev. 1968-A",
    source: "Engineering vault · Sheet 2047-A",
    assetTags: ["P-2047", "V-4820", "E-1156"],
    page: 1,
    totalPages: 2,
    condition: "faded",
    stamp: "2047-A",
    regions: [
      { id: "r-pump", label: "P-2047", top: 42, left: 12, width: 18, height: 12, stage: "tag" },
      { id: "r-iso", label: "IV-2047-A/B", top: 55, left: 28, width: 44, height: 10, stage: "extract" },
      { id: "r-valve", label: "V-4820", top: 42, left: 68, width: 18, height: 12, stage: "tag" },
    ],
    blocks: [
      { text: "P&ID — CRUDE CHARGE & PREHEAT", size: "sm" },
      { text: "Sheet 2047-A · Rev 1968-A · CDU-1", size: "md" },
      { spacer: true, text: "" },
      { text: "┌─────────┐      ┌─────────┐      ┌─────────┐", size: "sm" },
      { text: "│ P-2047  │──────│ E-1156  │──────│ V-4820  │", size: "md" },
      { text: "│ Charge  │      │ Preheat │      │ Frac.   │", size: "sm" },
      { text: "└────┬────┘      └─────────┘      └────┬────┘", size: "sm" },
      { spacer: true, text: "" },
      { text: "Isolation: IV-2047-A upstream · IV-2047-B downstream", highlight: true },
      { text: "Bleed point: BD-2047-1 · LOTO ■ ■ ■ ■", size: "sm" },
      { text: "Note: see MR-1972-0847 for pump modification", size: "sm", handwritten: true },
    ],
  },
  "doc-safe-p2047": {
    id: "doc-safe-p2047",
    title: "Safe Isolation — P-2047 (legacy)",
    type: "procedure",
    date: "Amended 1994",
    source: "Archive B · Safety bundle 12",
    assetTags: ["P-2047", "AM-05"],
    page: 1,
    totalPages: 4,
    condition: "stained",
    stamp: "AM-05",
    regions: [
      { id: "r-hdr", label: "AM-05", top: 8, left: 6, width: 50, height: 8, stage: "classify" },
      { id: "r-step2", label: "Bleed BD-2047-1", top: 42, left: 8, width: 84, height: 8, stage: "extract" },
      { id: "r-loto", label: "LOTO 2047-1..4", top: 52, left: 8, width: 84, height: 8, stage: "tag" },
    ],
    blocks: [
      { text: "AM-05 · SAFE ISOLATION PROCEDURE", size: "md" },
      { text: "Equipment: P-2047 Crude Charge Pump", size: "sm" },
      { spacer: true, text: "" },
      { text: "1. Confirm zero energy · notify control room", size: "sm" },
      { text: "2. Close & lock IV-2047-A (upstream)", size: "sm" },
      { text: "3. Close & lock IV-2047-B (downstream)", size: "sm" },
      { text: "4. Bleed downstream via BD-2047-1", highlight: true },
      { text: "5. Verify LOTO points 2047-1 through 2047-4", highlight: true },
      { text: "6. Sign-off: execution engineer + permit holder", size: "sm" },
    ],
  },
  "doc-1984-t8": {
    id: "doc-1984-t8",
    title: "Shift log — Tank T-8 · Dec 1984",
    type: "shift_log",
    date: "14 Dec 1984",
    source: "Archive B · Shift logs",
    assetTags: ["T-8", "V-12-B"],
    page: 1,
    totalPages: 3,
    condition: "handwritten",
    regions: [
      { id: "r-tank", label: "T-8", top: 18, left: 8, width: 25, height: 8, stage: "tag" },
      { id: "r-event", label: "Freeze event", top: 35, left: 8, width: 84, height: 20, stage: "ocr" },
      { id: "r-fix", label: "Valve 12-B bypass", top: 58, left: 10, width: 80, height: 12, stage: "extract" },
    ],
    blocks: [
      { text: "Night Shift Log — Tank Farm", handwritten: true, size: "md" },
      { text: "Date: 14 Dec 1984 · 02:40", handwritten: true },
      { spacer: true, text: "" },
      { text: "Tank T-8 — pressure drop during freeze", handwritten: true },
      { text: "Inlet line restricted · trace heat suspect", handwritten: true, indent: 1 },
      { spacer: true, text: "" },
      { text: "Action: bypass Valve 12-B per winter protocol", handwritten: true, highlight: true },
      { text: "Engineer Weber on site · restored 05:15", handwritten: true },
      { spacer: true, text: "" },
      { text: "Recommend: inspect trace heating before next freeze", handwritten: true, indent: 1 },
    ],
  },
  "doc-v4820-stiction": {
    id: "doc-v4820-stiction",
    title: "Field note — V-4820 actuator",
    type: "maintenance_card",
    date: "18 Apr 2026",
    source: "Hard drive export · Field notes",
    assetTags: ["V-4820"],
    page: 1,
    totalPages: 1,
    condition: "typed",
    regions: [
      { id: "r-tag", label: "V-4820", top: 14, left: 6, width: 40, height: 8, stage: "tag" },
      { id: "r-note", label: "Stiction", top: 30, left: 6, width: 88, height: 14, stage: "extract" },
    ],
    blocks: [
      { text: "FIELD NOTE — CDU-1", size: "sm" },
      { text: "V-4820 · Fractionator feed valve", size: "md" },
      { text: "Observation: actuator stiction / drift", size: "md" },
      { text: "Recommend service · isolation per AM-05", size: "sm" },
      { text: "Cross-ref P&ID Rev 1968-A for bleed points", highlight: true, size: "sm" },
    ],
  },
};

export function getDocument(id: string): VaultDocument | undefined {
  return VAULT_DOCUMENTS[id];
}

export const JOB_TO_DOC: Record<string, string> = {
  j1: "doc-1972-p2047",
  j2: "doc-pid-2047",
  j3: "doc-1984-t8",
  j4: "doc-safe-p2047",
  j5: "doc-1988-p2047",
  j6: "doc-v4820-stiction",
};
