"use client";

import { useMemo, useState } from "react";
import {
  getConnectedNodeIds,
  getNodeById,
  GRAPH_EDGES,
  GRAPH_NODES,
  KIND_LABELS,
  type GraphNode,
  type GraphNodeKind,
} from "@/lib/vault/knowledgeGraph";

const KIND_RADIUS: Record<GraphNodeKind, number> = {
  unit: 14,
  asset: 11,
  document: 8,
  procedure: 10,
  person: 9,
  incident: 9,
};

function nodeFill(kind: GraphNodeKind, active: boolean, dimmed: boolean) {
  if (dimmed) return "rgba(255,255,255,0.08)";
  if (!active) return "rgba(255,255,255,0.15)";
  return kind === "unit" ? "#fff" : "rgba(255,255,255,0.9)";
}

function nodeStroke(active: boolean, selected: boolean) {
  if (selected) return "#fff";
  if (active) return "rgba(255,255,255,0.6)";
  return "rgba(255,255,255,0.15)";
}

export function KnowledgeGraphExplorer({
  onOpenDocument,
  onContinue,
}: {
  onOpenDocument?: (docId: string) => void;
  onContinue?: () => void;
}) {
  const [selectedId, setSelectedId] = useState("p2047");

  const connected = useMemo(() => getConnectedNodeIds(selectedId), [selectedId]);
  const selected = getNodeById(selectedId);

  const linkedDocs = useMemo(() => {
    const docs: GraphNode[] = [];
    for (const id of connected) {
      const n = getNodeById(id);
      if (n?.kind === "document" && n.docId) docs.push(n);
    }
    return docs;
  }, [connected]);

  const linkedIncidents = useMemo(() => {
    return [...connected]
      .map((id) => getNodeById(id))
      .filter((n): n is GraphNode => !!n && n.kind === "incident");
  }, [connected]);

  return (
    <div className="vault-panel p-5">
      <div className="flex flex-wrap justify-between gap-3 items-start mb-4">
        <div>
          <p className="vault-label">Knowledge graph explorer</p>
          <p className="vault-body mt-1 max-w-lg">
            {GRAPH_NODES.length} nodes · {GRAPH_EDGES.length} edges · click any tag to trace documents, incidents, and
            procedures
          </p>
        </div>
        {onContinue && (
          <button type="button" onClick={onContinue} className="vault-btn-primary shrink-0">
            Continue to actions →
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <div className="relative border border-white/10 bg-black aspect-[4/3] min-h-[320px] overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Grid */}
            {[20, 40, 60, 80].map((g) => (
              <g key={g} opacity={0.06}>
                <line x1={g} y1={0} x2={g} y2={100} stroke="#fff" strokeWidth={0.15} />
                <line x1={0} y1={g} x2={100} y2={g} stroke="#fff" strokeWidth={0.15} />
              </g>
            ))}

            {/* Edges */}
            {GRAPH_EDGES.map((e, i) => {
              const from = getNodeById(e.from);
              const to = getNodeById(e.to);
              if (!from || !to) return null;
              const active = connected.has(e.from) && connected.has(e.to);
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={active ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.08)"}
                  strokeWidth={active ? 0.35 : 0.15}
                />
              );
            })}

            {/* Nodes */}
            {GRAPH_NODES.map((node) => {
              const isSelected = node.id === selectedId;
              const isConnected = connected.has(node.id);
              const dimmed = !isConnected;
              const r = KIND_RADIUS[node.kind];

              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(node.id)}
                  style={{ transition: "opacity 0.25s" }}
                  opacity={dimmed ? 0.25 : 1}
                >
                  {node.kind === "document" ? (
                    <rect
                      x={node.x - r}
                      y={node.y - r}
                      width={r * 2}
                      height={r * 2}
                      fill={nodeFill(node.kind, isConnected, dimmed)}
                      stroke={nodeStroke(isConnected, isSelected)}
                      strokeWidth={isSelected ? 0.6 : 0.25}
                    />
                  ) : node.kind === "procedure" ? (
                    <polygon
                      points={`${node.x},${node.y - r} ${node.x + r},${node.y} ${node.x},${node.y + r} ${node.x - r},${node.y}`}
                      fill={nodeFill(node.kind, isConnected, dimmed)}
                      stroke={nodeStroke(isConnected, isSelected)}
                      strokeWidth={isSelected ? 0.6 : 0.25}
                    />
                  ) : (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={r}
                      fill={nodeFill(node.kind, isConnected, dimmed)}
                      stroke={nodeStroke(isConnected, isSelected)}
                      strokeWidth={isSelected ? 0.6 : 0.25}
                    />
                  )}
                  <text
                    x={node.x}
                    y={node.y + r + 4}
                    textAnchor="middle"
                    fill={dimmed ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.75)"}
                    fontSize={2.8}
                    fontFamily="monospace"
                  >
                    {node.label.length > 14 ? `${node.label.slice(0, 12)}…` : node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="absolute bottom-2 left-2 flex flex-wrap gap-2">
            {(Object.keys(KIND_LABELS) as GraphNodeKind[]).map((k) => (
              <span key={k} className="text-[10px] uppercase tracking-wider text-white/35 font-mono">
                {KIND_LABELS[k]}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {selected && (
            <div className="border border-white/20 p-4">
              <p className="vault-label">{KIND_LABELS[selected.kind]}</p>
              <p className="text-[18px] font-medium text-white mt-1 font-mono">{selected.label}</p>
              <p className="vault-body mt-2">{selected.detail}</p>
              <p className="text-[12px] font-mono text-white/30 mt-3">{connected.size - 1} connected nodes</p>
            </div>
          )}

          {linkedIncidents.length > 0 && (
            <div className="border border-white/10 p-3">
              <p className="vault-label mb-2">Incidents</p>
              {linkedIncidents.map((inc) => (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => setSelectedId(inc.id)}
                  className="block w-full text-left text-[14px] text-white/60 hover:text-white py-1"
                >
                  {inc.label}
                </button>
              ))}
            </div>
          )}

          {linkedDocs.length > 0 && (
            <div className="border border-white/10 p-3">
              <p className="vault-label mb-2">Source documents</p>
              {linkedDocs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(doc.id);
                    if (doc.docId && onOpenDocument) onOpenDocument(doc.docId);
                  }}
                  className="block w-full text-left text-[14px] text-white/60 hover:text-white py-1.5 border-b border-white/5 last:border-0"
                >
                  {doc.label}
                  <span className="block text-[12px] text-white/30 mt-0.5">{doc.detail}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {["p2047", "v4820", "t8", "weber"].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedId(id)}
                className={`text-[12px] font-mono px-2 py-1 border ${
                  selectedId === id ? "border-white text-white" : "border-white/20 text-white/40"
                }`}
              >
                {getNodeById(id)?.label ?? id}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
