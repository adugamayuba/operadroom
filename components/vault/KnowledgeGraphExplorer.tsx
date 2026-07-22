"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getConnectedNodeIds,
  getInitialPositions,
  getNodeById,
  GRAPH_EDGES,
  GRAPH_NODES,
  KIND_COLORS,
  KIND_LABELS,
  type GraphNode,
  type GraphNodeKind,
} from "@/lib/vault/knowledgeGraph";

const KIND_RADIUS: Record<GraphNodeKind, number> = {
  unit: 5.5,
  asset: 4.5,
  document: 3.8,
  procedure: 4.2,
  person: 4,
  incident: 4,
};

const VB = { w: 100, h: 100 };

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 50, y: 50 };
  const p = pt.matrixTransform(ctm.inverse());
  return {
    x: Math.max(4, Math.min(VB.w - 4, p.x)),
    y: Math.max(4, Math.min(VB.h - 4, p.y)),
  };
}

export function KnowledgeGraphExplorer({
  onOpenDocument,
  onContinue,
  continueLabel = "Continue →",
  compact,
}: {
  onOpenDocument?: (docId: string) => void;
  onContinue?: () => void;
  continueLabel?: string;
  compact?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [positions, setPositions] = useState(getInitialPositions);
  const [selectedId, setSelectedId] = useState("p2047");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panDrag = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

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

  const onNodePointerDown = useCallback((id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragId(id);
    setSelectedId(id);
  }, []);

  const onSvgPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragId && svgRef.current) {
        const p = clientToSvg(svgRef.current, e.clientX, e.clientY);
        setPositions((prev) => ({ ...prev, [dragId]: p }));
        return;
      }
      if (panDrag.current && svgRef.current) {
        const dx = (e.clientX - panDrag.current.startX) * 0.08;
        const dy = (e.clientY - panDrag.current.startY) * 0.08;
        setPan({ x: panDrag.current.panX + dx, y: panDrag.current.panY + dy });
      }
    },
    [dragId]
  );

  const onSvgPointerUp = useCallback(() => {
    setDragId(null);
    panDrag.current = null;
  }, []);

  const onBackgroundPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (dragId) return;
      panDrag.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    },
    [dragId, pan]
  );

  useEffect(() => {
    const up = () => {
      setDragId(null);
      panDrag.current = null;
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const resetLayout = () => {
    setPositions(getInitialPositions());
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const viewBox = `${-pan.x} ${-pan.y} ${VB.w / zoom} ${VB.h / zoom}`;

  return (
    <div className={`vault-panel p-5 ${compact ? "p-4" : ""}`}>
      <div className="flex flex-wrap justify-between gap-3 items-start mb-4">
        <div>
          <p className="vault-label">Knowledge graph explorer</p>
          <p className="vault-body mt-1 max-w-lg">
            Drag nodes · pan canvas · click to highlight cluster · {GRAPH_NODES.length} nodes ·{" "}
            {GRAPH_EDGES.length} edges
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button type="button" onClick={() => setZoom((z) => Math.min(2, z + 0.15))} className="vault-btn-secondary text-[10px] py-1.5 px-2">
            +
          </button>
          <button type="button" onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))} className="vault-btn-secondary text-[10px] py-1.5 px-2">
            −
          </button>
          <button type="button" onClick={resetLayout} className="vault-btn-secondary text-[10px] py-1.5 px-3">
            Reset
          </button>
          {onContinue && (
            <button type="button" onClick={onContinue} className="vault-btn-primary">
              {continueLabel}
            </button>
          )}
        </div>
      </div>

      <div className={`grid ${compact ? "grid-cols-1" : "lg:grid-cols-[1fr_280px]"} gap-4`}>
        <div
          className={`relative border border-white/10 bg-[#030303] overflow-hidden touch-none ${
            compact ? "min-h-[360px]" : "aspect-[4/3] min-h-[380px]"
          }`}
        >
          <svg
            ref={svgRef}
            viewBox={viewBox}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onPointerMove={onSvgPointerMove}
            onPointerUp={onSvgPointerUp}
            onPointerLeave={onSvgPointerUp}
            onPointerDown={onBackgroundPointerDown}
          >
            <defs>
              {GRAPH_NODES.map((n) => (
                <filter key={n.id} id={`glow-${n.id}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor={KIND_COLORS[n.kind].glow} />
                </filter>
              ))}
            </defs>

            {[20, 40, 60, 80].map((g) => (
              <g key={g} opacity={0.05}>
                <line x1={g} y1={0} x2={g} y2={100} stroke="#fff" strokeWidth={0.12} />
                <line x1={0} y1={g} x2={100} y2={g} stroke="#fff" strokeWidth={0.12} />
              </g>
            ))}

            {GRAPH_EDGES.map((e, i) => {
              const from = positions[e.from];
              const to = positions[e.to];
              if (!from || !to) return null;
              const active = connected.has(e.from) && connected.has(e.to);
              const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
              return (
                <g key={i}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={active ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.1)"}
                    strokeWidth={active ? 0.45 : 0.2}
                    strokeDasharray={active ? undefined : "1 1"}
                  />
                  {active && e.label && hoverId && (e.from === hoverId || e.to === hoverId) && (
                    <text x={mid.x} y={mid.y - 1} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={2.2} fontFamily="monospace">
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}

            {GRAPH_NODES.map((node) => {
              const pos = positions[node.id] ?? { x: node.x, y: node.y };
              const isSelected = node.id === selectedId;
              const isConnected = connected.has(node.id);
              const dimmed = !isConnected && !dragId;
              const isHover = hoverId === node.id;
              const r = KIND_RADIUS[node.kind];
              const colors = KIND_COLORS[node.kind];
              const opacity = dimmed ? 0.2 : 1;
              const fill = dimmed ? "rgba(255,255,255,0.06)" : colors.fill;
              const stroke = isSelected ? "#fff" : isHover ? colors.stroke : colors.stroke;
              const sw = isSelected ? 0.55 : isHover ? 0.4 : 0.3;

              return (
                <g
                  key={node.id}
                  opacity={opacity}
                  style={{ cursor: dragId === node.id ? "grabbing" : "grab" }}
                  onPointerDown={(e) => onNodePointerDown(node.id, e)}
                  onPointerEnter={() => setHoverId(node.id)}
                  onPointerLeave={() => setHoverId((h) => (h === node.id ? null : h))}
                  filter={isSelected || isHover ? `url(#glow-${node.id})` : undefined}
                >
                  {node.kind === "document" ? (
                    <rect
                      x={pos.x - r}
                      y={pos.y - r}
                      width={r * 2}
                      height={r * 2}
                      rx={0.6}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={sw}
                    />
                  ) : node.kind === "procedure" ? (
                    <polygon
                      points={`${pos.x},${pos.y - r} ${pos.x + r},${pos.y} ${pos.x},${pos.y + r} ${pos.x - r},${pos.y}`}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={sw}
                    />
                  ) : (
                    <circle cx={pos.x} cy={pos.y} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />
                  )}
                  {(isSelected || isHover || !dimmed) && (
                    <text
                      x={pos.x}
                      y={pos.y + r + 3.2}
                      textAnchor="middle"
                      fill={dimmed ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.85)"}
                      fontSize={2.6}
                      fontFamily="monospace"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {node.label.length > 16 ? `${node.label.slice(0, 14)}…` : node.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-x-3 gap-y-1">
            {(Object.keys(KIND_LABELS) as GraphNodeKind[]).map((k) => (
              <span key={k} className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/45 font-mono">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: KIND_COLORS[k].fill }} />
                {KIND_LABELS[k]}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {selected && (
            <div className="border border-white/20 p-4" style={{ borderColor: KIND_COLORS[selected.kind].stroke }}>
              <p className="vault-label flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: KIND_COLORS[selected.kind].fill }} />
                {KIND_LABELS[selected.kind]}
              </p>
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
                  className="flex items-center gap-2 w-full text-left text-[14px] text-white/60 hover:text-white py-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: KIND_COLORS.incident.fill }} />
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
                  className="flex items-start gap-2 w-full text-left py-1.5 border-b border-white/5 last:border-0 hover:text-white text-white/60"
                >
                  <span className="w-1.5 h-1.5 rounded-sm shrink-0 mt-1.5" style={{ background: KIND_COLORS.document.fill }} />
                  <span>
                    <span className="text-[14px] block">{doc.label}</span>
                    <span className="text-[12px] text-white/30">{doc.detail}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {["p2047", "v4820", "t8", "weber", "cdu1"].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedId(id)}
                className={`text-[12px] font-mono px-2 py-1 border transition-colors ${
                  selectedId === id ? "border-white text-white bg-white/10" : "border-white/20 text-white/40 hover:border-white/40"
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
