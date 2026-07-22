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

export const GRAPH_NODES: GraphNode[] = [
  { id: "cdu1", label: "CDU-1", kind: "unit", x: 50, y: 50, detail: "Crude distillation unit · 156 tags indexed" },
  { id: "p2047", label: "P-2047", kind: "asset", x: 28, y: 38, detail: "Crude charge pump · lead asset · 4 linked records" },
  { id: "e1156", label: "E-1156", kind: "asset", x: 62, y: 32, detail: "Preheat exchanger · charge train" },
  { id: "v4820", label: "V-4820", kind: "asset", x: 72, y: 52, detail: "Fractionator feed valve · actuator history" },
  { id: "t8", label: "T-8", kind: "asset", x: 22, y: 68, detail: "Tank farm · seasonal freeze events" },
  { id: "am05", label: "AM-05", kind: "procedure", x: 50, y: 22, detail: "Safe Isolation & Maintenance Execution" },
  { id: "weber", label: "H. Weber", kind: "person", x: 12, y: 48, detail: "Engineer · 1972 P-2047 · 1984 T-8" },
  { id: "inc-1972", label: "1972 bearing mod", kind: "incident", x: 18, y: 28, detail: "Non-standard spacer · OEM warning" },
  { id: "inc-1988", label: "1988 vibration", kind: "incident", x: 38, y: 18, detail: "Repeat failure · linked to 1972 mod" },
  { id: "inc-1984", label: "1984 freeze", kind: "incident", x: 14, y: 78, detail: "T-8 pressure drop · Valve 12-B bypass" },
  { id: "doc-1972", label: "MR-1972-0847", kind: "document", x: 32, y: 58, detail: "Handwritten maintenance card · 1972", docId: "doc-1972-p2047" },
  { id: "doc-1988", label: "WO-1988-4421", kind: "document", x: 42, y: 72, detail: "Corrective WO · vibration follow-up", docId: "doc-1988-p2047" },
  { id: "doc-pid", label: "P&ID 2047-A", kind: "document", x: 68, y: 38, detail: "Rev 1968-A · isolation valves", docId: "doc-pid-2047" },
  { id: "doc-safe", label: "Isolation proc.", kind: "document", x: 58, y: 68, detail: "AM-05 legacy · P-2047", docId: "doc-safe-p2047" },
  { id: "doc-t8", label: "Shift log Dec 84", kind: "document", x: 32, y: 82, detail: "Handwritten night shift log", docId: "doc-1984-t8" },
  { id: "doc-v4820", label: "Field note", kind: "document", x: 82, y: 62, detail: "Actuator stiction · Apr 2026", docId: "doc-v4820-stiction" },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { from: "cdu1", to: "p2047", label: "contains" },
  { from: "cdu1", to: "e1156" },
  { from: "cdu1", to: "v4820" },
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

export const KIND_LABELS: Record<GraphNodeKind, string> = {
  unit: "Unit",
  asset: "Asset",
  document: "Document",
  procedure: "Procedure",
  person: "Engineer",
  incident: "Incident",
};
