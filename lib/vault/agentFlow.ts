/** Guided agent pipeline — document processing stages for vault demo */

export interface AgentDocJob {
  id: string;
  docId: string;
  name: string;
  type: string;
  pages: number;
  tags: string[];
  insight?: string;
}

export const AGENT_DOC_QUEUE: AgentDocJob[] = [
  {
    id: "j1",
    docId: "doc-1972-p2047",
    name: "Maintenance card · P-2047 · 1972",
    type: "Handwritten card",
    pages: 1,
    tags: ["P-2047", "CDU-1", "bearing"],
    insight: "Non-standard spacer noted — do not revert to OEM",
  },
  {
    id: "j2",
    docId: "doc-pid-2047",
    name: "P&ID Sheet 2047-A · Rev 1968",
    type: "Engineering drawing",
    pages: 2,
    tags: ["P-2047", "V-4820", "E-1156", "IV-2047-A"],
    insight: "Isolation valve chain mapped upstream/downstream",
  },
  {
    id: "j3",
    docId: "doc-1984-t8",
    name: "Shift log · Tank T-8 · Dec 1984",
    type: "Handwritten log",
    pages: 3,
    tags: ["T-8", "V-12-B", "winter"],
    insight: "Freeze event resolution pattern captured",
  },
  {
    id: "j4",
    docId: "doc-safe-p2047",
    name: "AM-05 Safe Isolation · P-2047",
    type: "Procedure",
    pages: 4,
    tags: ["P-2047", "AM-05", "LOTO"],
    insight: "Legacy isolation steps align with current AM-05",
  },
  {
    id: "j5",
    docId: "doc-1988-p2047",
    name: "WO microfilm · P-2047 · 1988",
    type: "Work order",
    pages: 2,
    tags: ["P-2047", "vibration"],
    insight: "Repeat failure linked to 1972 modification",
  },
  {
    id: "j6",
    docId: "doc-v4820-stiction",
    name: "Field notes · V-4820 · PDF export",
    type: "Digital scan",
    pages: 1,
    tags: ["V-4820", "actuator"],
    insight: "Actuator stiction — cross-ref 1968 P&ID bleed points",
  },
];

export type AgentStage =
  | "receive"
  | "ocr"
  | "classify"
  | "tag"
  | "extract"
  | "graph"
  | "index";

export const AGENT_STAGES: { id: AgentStage; label: string; detail: string }[] = [
  { id: "receive", label: "Receive scan", detail: "Page hash registered · batch sealed" },
  { id: "ocr", label: "Vision OCR", detail: "Handwriting · faded type · DE/EN mixed" },
  { id: "classify", label: "Classify document", detail: "WO · P&ID · procedure · shift log" },
  { id: "tag", label: "Tag equipment IDs", detail: "Link to SAP functional locations" },
  { id: "extract", label: "Extract entities", detail: "Dates · engineers · failure modes · parts" },
  { id: "graph", label: "Build knowledge graph", detail: "Connect assets · events · procedures" },
  { id: "index", label: "Semantic index", detail: "Natural-language searchable corpus" },
];

export interface TrendInsight {
  id: string;
  title: string;
  detail: string;
  assets: string[];
  severity: "info" | "warn" | "critical";
}

export const AGENT_INSIGHTS: TrendInsight[] = [
  {
    id: "i1",
    title: "Repeat modification pattern · P-2047",
    detail: "1972 spacer change referenced again in 1988 WO — OEM substitution risk on bearing work",
    assets: ["P-2047"],
    severity: "warn",
  },
  {
    id: "i2",
    title: "Isolation path complete · CDU-1 charge train",
    detail: "P&ID + AM-05 procedure + valve tags form closed Safe Isolation graph",
    assets: ["P-2047", "V-4820"],
    severity: "info",
  },
  {
    id: "i3",
    title: "Seasonal failure cluster · Tank farm",
    detail: "Winter freeze events on T-8 documented across 3 decades of shift logs",
    assets: ["T-8"],
    severity: "info",
  },
  {
    id: "i4",
    title: "Institutional knowledge gap risk",
    detail: "14 engineer signatures in archive have no digital successor — retirement exposure flagged",
    assets: ["CDU-1"],
    severity: "critical",
  },
];

export interface BrainAction {
  id: string;
  title: string;
  problem: string;
  action: string;
  metric: string;
  prompt: string;
}

export const BRAIN_ACTIONS: BrainAction[] = [
  {
    id: "memory",
    title: "Institutional memory search",
    problem: "Engineers spend hours in archive rooms searching paper bundles",
    action: "Ask plain-English questions — get answers with citations to the exact scanned page",
    metric: "4–6 hours → under 3 seconds",
    prompt: "What do we know about P-2047 bearing work before 1990?",
  },
  {
    id: "isolation",
    title: "Safe Isolation from legacy P&IDs",
    problem: "Field crews hunt disconnected drawings to trace lockout points",
    action: "Agent traces scanned P&IDs and procedures → isolation checklist in seconds",
    metric: "Half-day search → 10 seconds",
    prompt: "Draft a Safe Isolation plan for P-2047 from legacy records",
  },
  {
    id: "anomaly",
    title: "Anomaly context resolver",
    problem: "Live alert with no link to decades of prior work on same asset",
    action: "Cross-reference vibration alert against full maintenance history and modifications",
    metric: "Root cause context from 847 archived pages",
    prompt: "Show maintenance history for V-4820 including old P&IDs",
  },
  {
    id: "compliance",
    title: "Audit-ready compliance search",
    problem: "Regulators ask for proof — records scattered across rooms and drives",
    action: "Every answer sealed with Reelin ID · full chain-of-custody for cyber review",
    metric: "100% cited · on-chain activity log",
    prompt: "Have we ever had a pressure drop on Tank T-8 during winter freezes?",
  },
];
