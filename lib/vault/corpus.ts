/** Synthetic legacy archive for Rheinland Plant Memory demo */

export type VaultDocType = "maintenance_card" | "work_order" | "pid" | "shift_log" | "procedure";

export interface VaultDocument {
  id: string;
  title: string;
  type: VaultDocType;
  date: string;
  source: string;
  assetTags: string[];
  page: number;
  lines: { text: string; highlight?: boolean }[];
  condition: "faded" | "stained" | "typed" | "handwritten";
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
    condition: "handwritten",
    lines: [
      { text: "Rheinland · Crude Charge Pump P-2047" },
      { text: "Work order ref: MR-1972-0847" },
      { text: "" },
      { text: "Bearing replacement completed. Drive end SKF 6318." },
      { text: "NOTE — non-standard spacer installed (3.2mm).", highlight: true },
      { text: "Do NOT revert to OEM spec without engineering review.", highlight: true },
      { text: "Signed: H. Weber · Shift B" },
    ],
  },
  "doc-1988-p2047": {
    id: "doc-1988-p2047",
    title: "Corrective WO — P-2047 vibration follow-up",
    type: "work_order",
    date: "03 Nov 1988",
    source: "Archive B · CDU-1 · WO microfilm",
    assetTags: ["P-2047"],
    page: 2,
    condition: "typed",
    lines: [
      { text: "Equipment: P-2047 Crude Charge Pump" },
      { text: "FL: RHN-CDU1-P2047" },
      { text: "Finding: elevated vibration at DE bearing · 7.2 mm/s" },
      { text: "Action: alignment check · spacer per 1972 card verified", highlight: true },
      { text: "Closed: vibration normalized to 2.1 mm/s" },
    ],
  },
  "doc-pid-2047": {
    id: "doc-pid-2047",
    title: "P&ID excerpt — CDU-1 charge pump train",
    type: "pid",
    date: "Rev. 1968-A",
    source: "Engineering vault · Sheet 2047-A",
    assetTags: ["P-2047", "V-4820", "E-1156"],
    page: 1,
    condition: "faded",
    lines: [
      { text: "Sheet 2047-A · Crude charge & preheat" },
      { text: "P-2047 → E-1156 → V-4820 fractionator feed" },
      { text: "Isolation: IV-2047-A upstream · IV-2047-B downstream", highlight: true },
      { text: "Bleed: BD-2047-1 · LOTO points marked ■" },
    ],
  },
  "doc-safe-p2047": {
    id: "doc-safe-p2047",
    title: "Safe Isolation procedure — P-2047 (legacy)",
    type: "procedure",
    date: "Amended 1994",
    source: "Archive B · Safety bundle 12",
    assetTags: ["P-2047"],
    page: 3,
    condition: "stained",
    lines: [
      { text: "AM-05 Safe Isolation · P-2047 Crude Charge Pump" },
      { text: "1. Confirm zero energy · IV-2047-A/B closed & locked" },
      { text: "2. Bleed downstream via BD-2047-1", highlight: true },
      { text: "3. Verify LOTO points 2047-1 through 2047-4" },
      { text: "4. Sign-off: execution engineer + permit holder" },
    ],
  },
  "doc-1984-t8": {
    id: "doc-1984-t8",
    title: "Shift log — Tank T-8 winter freeze event",
    type: "shift_log",
    date: "14 Dec 1984",
    source: "Archive B · Shift logs · Dec 1984",
    assetTags: ["T-8", "V-12-B"],
    page: 1,
    condition: "handwritten",
    lines: [
      { text: "Night shift · Tank farm · 02:40" },
      { text: "T-8 pressure drop during freeze · inlet line restricted" },
      { text: "Resolution: bypass Valve 12-B per winter protocol", highlight: true },
      { text: "Engineer Weber on site · restored by 05:15" },
      { text: "Recommend: inspect trace heating before next freeze" },
    ],
  },
  "doc-v4820-stiction": {
    id: "doc-v4820-stiction",
    title: "Field note — V-4820 actuator drift",
    type: "maintenance_card",
    date: "18 Apr 2026",
    source: "Hard drive export · Field notes PDF",
    assetTags: ["V-4820"],
    page: 1,
    condition: "typed",
    lines: [
      { text: "V-4820 fractionator feed valve · stiction observed" },
      { text: "Recommend actuator service · isolation per AM-05" },
      { text: "Cross-ref legacy P&ID Rev 1968-A for bleed points", highlight: true },
    ],
  },
};

export function getDocument(id: string): VaultDocument | undefined {
  return VAULT_DOCUMENTS[id];
}
