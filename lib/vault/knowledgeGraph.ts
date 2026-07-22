/** Knowledge graph data for Vault explorer — derived from Rheinland demo corpus */

export type GraphNodeKind = "unit" | "asset" | "document" | "procedure" | "person" | "incident";

export interface GraphNode {
  id: string;
  label: string;
  kind: GraphNodeKind;
  x: number;
  y: number;
  detail: string;
  docId?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
}

/** Spaced layout — no overlapping initial positions (viewBox 0–100) */
export const GRAPH_NODES: GraphNode[] = [
  { id: "cdu1", label: "CDU-1", kind: "unit", x: 50, y: 48, detail: "Crude distillation unit · 156 tags indexed" },
  { id: "p2047", label: "P-2047", kind: "asset", x: 28, y: 40, detail: "Crude charge pump · lead asset · 4 linked records" },
  { id: "e1156", label: "E-1156", kind: "asset", x: 70, y: 36, detail: "Preheat exchanger · charge train" },
  { id: "v4820", label: "V-4820", kind: "asset", x: 82, y: 54, detail: "Fractionator feed valve · actuator history" },
  { id: "t8", label: "T-8", kind: "asset", x: 18, y: 70, detail: "Tank farm · seasonal freeze events" },
  { id: "am05", label: "AM-05", kind: "procedure", x: 50, y: 14, detail: "Safe Isolation & Maintenance Execution" },
  { id: "weber", label: "H. Weber", kind: "person", x: 8, y: 38, detail: "Engineer · 1972 P-2047 · 1984 T-8" },
  { id: "inc-1972", label: "1972 bearing mod", kind: "incident", x: 16, y: 18, detail: "Non-standard spacer · OEM warning" },
  { id: "inc-1988", label: "1988 vibration", kind: "incident", x: 36, y: 12, detail: "Repeat failure · linked to 1972 mod" },
  { id: "inc-1984", label: "1984 freeze", kind: "incident", x: 10, y: 88, detail: "T-8 pressure drop · Valve 12-B bypass" },
  { id: "doc-1972", label: "MR-1972-0847", kind: "document", x: 26, y: 58, detail: "Handwritten maintenance card · 1972", docId: "doc-1972-p2047" },
  { id: "doc-1988", label: "WO-1988-4421", kind: "document", x: 40, y: 74, detail: "Corrective WO · vibration follow-up", docId: "doc-1988-p2047" },
  { id: "doc-pid", label: "P&ID 2047-A", kind: "document", x: 74, y: 22, detail: "Rev 1968-A · isolation valves", docId: "doc-pid-2047" },
  { id: "doc-safe", label: "Isolation proc.", kind: "document", x: 64, y: 68, detail: "AM-05 legacy · P-2047", docId: "doc-safe-p2047" },
  { id: "doc-t8", label: "Shift log Dec 84", kind: "document", x: 30, y: 90, detail: "Handwritten night shift log", docId: "doc-1984-t8" },
  { id: "doc-v4820", label: "Field note", kind: "document", x: 90, y: 72, detail: "Actuator stiction · Apr 2026", docId: "doc-v4820-stiction" },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { from: "cdu1", to: "p2047", label: "contains" },
  { from: "cdu1", to: "e1156" },
  { from: "cdu1", to: "v4820" },
  { from: "cdu1", to: "t8" },
  { from: "p2047", to: "e1156", label: "train" },
  { from: "e1156", to: "v4820", label: "train" },
  { from: "p2047", to: "am05" },
  { from: "am05", to: "doc-safe" },
  { from: "p2047", to: "doc-1972", label: "maintained" },
  { from: "p2047", to: "doc-1988" },
  { from: "p2047", to: "doc-pid" },
  { from: "p2047", to: "doc-safe" },
  { from: "p2047", to: "inc-1972" },
  { from: "p2047", to: "inc-1988" },
  { from: "inc-1972", to: "inc-1988", label: "causal" },
  { from: "inc-1972", to: "doc-1972" },
  { from: "inc-1988", to: "doc-1988" },
  { from: "weber", to: "doc-1972", label: "signed" },
  { from: "weber", to: "doc-t8" },
  { from: "weber", to: "inc-1972" },
  { from: "t8", to: "doc-t8" },
  { from: "t8", to: "inc-1984" },
  { from: "inc-1984", to: "doc-t8" },
  { from: "v4820", to: "doc-pid" },
  { from: "v4820", to: "doc-v4820" },
  { from: "doc-pid", to: "doc-safe", label: "references" },
];

export const KIND_COLORS: Record<GraphNodeKind, { fill: string; stroke: string; glow: string }> = {
  unit: { fill: "#ffffff", stroke: "#ffffff", glow: "rgba(255,255,255,0.35)" },
  asset: { fill: "#3b82f6", stroke: "#93c5fd", glow: "rgba(59,130,246,0.45)" },
  document: { fill: "#f59e0b", stroke: "#fcd34d", glow: "rgba(245,158,11,0.4)" },
  procedure: { fill: "#10b981", stroke: "#6ee7b7", glow: "rgba(16,185,129,0.4)" },
  person: { fill: "#a855f7", stroke: "#d8b4fe", glow: "rgba(168,85,247,0.4)" },
  incident: { fill: "#ef4444", stroke: "#fca5a5", glow: "rgba(239,68,68,0.45)" },
};

export const KIND_LABELS: Record<GraphNodeKind, string> = {
  unit: "Unit",
  asset: "Asset",
  document: "Document",
  procedure: "Procedure",
  person: "Engineer",
  incident: "Incident",
};

export function getInitialPositions(): Record<string, { x: number; y: number }> {
  return Object.fromEntries(GRAPH_NODES.map((n) => [n.id, { x: n.x, y: n.y }]));
}

export function getConnectedNodeIds(nodeId: string): Set<string> {
  const connected = new Set<string>([nodeId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const e of GRAPH_EDGES) {
      if (connected.has(e.from) && !connected.has(e.to)) {
        connected.add(e.to);
        changed = true;
      }
      if (connected.has(e.to) && !connected.has(e.from)) {
        connected.add(e.from);
        changed = true;
      }
    }
  }
  return connected;
}

export function getNodeById(id: string): GraphNode | undefined {
  return GRAPH_NODES.find((n) => n.id === id);
}
