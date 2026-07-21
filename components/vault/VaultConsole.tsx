"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/demo/LogoMark";
import { useDemoTheme } from "@/components/demo/DemoThemeProvider";
import { ScannedDocument } from "@/components/vault/ScannedDocument";
import { trackEvent } from "@/lib/analytics";
import { FACILITY } from "@/lib/demo/scenarios";
import {
  AGENT_DOC_QUEUE,
  AGENT_INSIGHTS,
  AGENT_STAGES,
  AUDIT_EVENT_LABELS,
  BRAIN_ACTIONS,
  createAuditEvent,
  fallbackAnswer,
  getDocument,
  matchVaultQuery,
  SECURITY_COPY,
  VAULT_CORPUS_STATS,
  type AuditEvent,
  type VaultAnswer,
} from "@/lib/vault";

type DemoPhase = "intro" | "ingest" | "insights" | "brain" | "query";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  answer?: VaultAnswer;
  loading?: boolean;
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

function VaultNav() {
  const { theme, toggle } = useDemoTheme();
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[var(--demo-surface)] border-b border-[var(--demo-border)] pt-[env(safe-area-inset-top)]">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <LogoMark className="w-4 h-4 opacity-80" />
          <span className="text-[13px] font-semibold tracking-wide uppercase">Operadroom Vault</span>
          <span className="hidden sm:inline text-[10px] text-[var(--demo-muted)] border-l border-[var(--demo-border)] pl-2 ml-1 uppercase tracking-wider">
            Plant Memory
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="hidden sm:flex items-center gap-1.5 text-[var(--demo-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--demo-ok)] demo-live-pulse" />
            Secure sandbox active
          </span>
          <button
            type="button"
            onClick={toggle}
            className="text-[11px] border border-[var(--demo-border)] px-2.5 py-1 text-[var(--demo-muted)] uppercase tracking-wider"
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </div>
    </header>
  );
}

function AuditLedger({ events }: { events: AuditEvent[] }) {
  return (
    <div className="demo-panel flex flex-col h-full min-h-[320px] lg:min-h-0">
      <div className="p-3 border-b border-[var(--demo-border-subtle)]">
        <p className="demo-label">Reelin ID · on-chain audit</p>
        <p className="text-[10px] text-[var(--demo-muted)] mt-1">Every action sealed for cyber security review</p>
      </div>
      <div className="flex-1 overflow-y-auto demo-scroll p-2 space-y-1.5 max-h-[280px] lg:max-h-none">
        {events.length === 0 && (
          <p className="text-[10px] text-[var(--demo-faint)] p-2">Audit log empty — run demo to begin</p>
        )}
        {events.map((e) => (
          <div key={e.id} className="text-[9px] border border-[var(--demo-border-subtle)] px-2 py-1.5 font-mono">
            <div className="flex justify-between gap-2">
              <span className="text-[var(--demo-text)] font-medium">{AUDIT_EVENT_LABELS[e.type]}</span>
              <span className="text-[var(--demo-faint)] shrink-0">{e.timestamp.slice(11)}</span>
            </div>
            <p className="text-[var(--demo-muted)] mt-0.5 truncate">{e.detail}</p>
            <p className="text-[var(--demo-faint)] mt-0.5 truncate">{e.reelinId} · {e.blockHash}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseStepper({ phase }: { phase: DemoPhase }) {
  const steps: { id: DemoPhase; label: string }[] = [
    { id: "intro", label: "Start" },
    { id: "ingest", label: "Ingest" },
    { id: "insights", label: "Insights" },
    { id: "brain", label: "Actions" },
    { id: "query", label: "Query" },
  ];
  const order = steps.map((s) => s.id);
  const idx = order.indexOf(phase);

  return (
    <div className="flex flex-wrap gap-1">
      {steps.map((s, i) => (
        <div
          key={s.id}
          className={`text-[9px] uppercase tracking-wider px-2 py-1 border ${
            i <= idx ? "demo-field-ok" : "border-[var(--demo-border-subtle)] text-[var(--demo-faint)]"
          }`}
        >
          {i + 1}. {s.label}
        </div>
      ))}
    </div>
  );
}

export function VaultConsole() {
  const [phase, setPhase] = useState<DemoPhase>("intro");
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [docIndex, setDocIndex] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [ingestDone, setIngestDone] = useState(false);
  const [visibleInsights, setVisibleInsights] = useState(0);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const selectedDoc = selectedDocId ? getDocument(selectedDocId) : null;

  const pushAudit = useCallback((type: Parameters<typeof createAuditEvent>[0], detail: string) => {
    setAuditEvents((prev) => [createAuditEvent(type, detail), ...prev].slice(0, 40));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startDemo = () => {
    setPhase("ingest");
    setDocIndex(0);
    setStageIndex(0);
    setIngestDone(false);
    setVisibleInsights(0);
    setMessages([]);
    setSelectedDocId(null);
    pushAudit("sandbox_provisioned", `${FACILITY.code} · isolated tenant · EU region`);
    trackEvent("vault_demo_start");
  };

  // Ingest animation loop
  useEffect(() => {
    if (phase !== "ingest" || ingestDone) return;

    const doc = AGENT_DOC_QUEUE[docIndex];
    const stage = AGENT_STAGES[stageIndex];

    const t = setTimeout(() => {
      if (stage.id === "receive") pushAudit("page_uploaded", `${doc.name} · ${doc.pages} pg · hash sealed`);
      if (stage.id === "index") pushAudit("page_indexed", `${doc.name} · ${doc.tags.join(", ")}`);
      if (stage.id === "graph") pushAudit("graph_linked", `${doc.tags[0]} ↔ knowledge graph`);
      if (stage.id === "extract") pushAudit("entity_extracted", doc.insight ?? doc.name);

      if (stageIndex < AGENT_STAGES.length - 1) {
        setStageIndex((s) => s + 1);
      } else if (docIndex < AGENT_DOC_QUEUE.length - 1) {
        setDocIndex((d) => d + 1);
        setStageIndex(0);
      } else {
        setIngestDone(true);
        setPhase("insights");
        trackEvent("vault_demo_ingest_complete");
      }
    }, 520);

    return () => clearTimeout(t);
  }, [phase, docIndex, stageIndex, ingestDone, pushAudit]);

  // Insights reveal
  useEffect(() => {
    if (phase !== "insights") return;
    if (visibleInsights >= AGENT_INSIGHTS.length) {
      const t = setTimeout(() => setPhase("brain"), 1200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleInsights((v) => v + 1), 700);
    return () => clearTimeout(t);
  }, [phase, visibleInsights]);

  const submitQuery = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      pushAudit("search_executed", trimmed.slice(0, 100));
      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: trimmed };
      const loadingId = `a-${Date.now()}`;
      setMessages((m) => [...m, userMsg, { id: loadingId, role: "assistant", text: "", loading: true }]);
      setQuery("");
      trackEvent("vault_query", { q: trimmed.slice(0, 80) });

      const matched = matchVaultQuery(trimmed) ?? fallbackAnswer(trimmed);
      setTimeout(() => {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === loadingId ? { id: loadingId, role: "assistant", text: matched.answer, answer: matched } : msg
          )
        );
        if (matched.citations[0]) {
          setSelectedDocId(matched.citations[0].docId);
          pushAudit("citation_opened", matched.citations[0].label);
        }
      }, Math.min(matched.searchMs, 2800));
    },
    [pushAudit]
  );

  const currentDoc = AGENT_DOC_QUEUE[docIndex];
  const currentStage = AGENT_STAGES[stageIndex];

  return (
    <>
      <VaultNav />
      <main className="pt-14 pb-10 min-h-screen">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1fr_280px] gap-4 items-start">
            {/* Main demo canvas */}
            <div className="min-w-0">
              <div className="py-4 border-b border-[var(--demo-border-subtle)] flex flex-wrap gap-4 justify-between items-end">
                <div>
                  <p className="demo-label">{FACILITY.name}</p>
                  <h1 className="mt-1 text-xl font-semibold">Plant Memory</h1>
                  <p className="mt-2 text-[13px] text-[var(--demo-muted)] max-w-2xl">
                    Centuries of legacy records → AI agent ingests, catalogs, and builds an agentic brain — queryable in
                    seconds, every action on-chain via Reelin ID.
                  </p>
                </div>
                <PhaseStepper phase={phase} />
              </div>

              {phase === "intro" && (
                <div className="mt-4 space-y-4">
                  <div className="demo-panel p-5">
                    <p className="demo-label">Live demo</p>
                    <p className="text-[14px] font-medium mt-2">
                      Watch the agent process a legacy archive batch — scan, catalog, tag, extract, graph, then act.
                    </p>
                    <p className="text-[12px] text-[var(--demo-muted)] mt-2 max-w-xl">
                      Simulates {AGENT_DOC_QUEUE.length} documents from a facility archive ({VAULT_CORPUS_STATS.pagesIndexed}{" "}
                      pages indexed). After digitization, the brain resolves isolation plans, anomaly context, and
                      compliance searches.
                    </p>
                    <button type="button" onClick={startDemo} className="demo-btn-primary mt-4">
                      Run live demo
                    </button>
                  </div>

                  <div className="demo-panel p-5">
                    <p className="demo-label">{SECURITY_COPY.headline}</p>
                    <p className="text-[12px] text-[var(--demo-muted)] mt-2 max-w-2xl">{SECURITY_COPY.body}</p>
                    <ul className="mt-3 grid sm:grid-cols-2 gap-2">
                      {SECURITY_COPY.bullets.map((b) => (
                        <li key={b} className="text-[11px] flex gap-2 items-start">
                          <span className="text-[var(--demo-ok)] shrink-0">✓</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {phase === "ingest" && (
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div className="demo-panel p-4">
                    <p className="demo-label">Agent · document queue</p>
                    <p className="text-[11px] text-[var(--demo-muted)] mt-1 mb-3">
                      Processing {docIndex + 1} / {AGENT_DOC_QUEUE.length}
                    </p>
                    <div className="space-y-2 max-h-[340px] overflow-y-auto demo-scroll">
                      {AGENT_DOC_QUEUE.map((d, i) => {
                        const active = i === docIndex;
                        const done = i < docIndex || ingestDone;
                        return (
                          <div
                            key={d.id}
                            className={`border px-3 py-2 text-[11px] ${
                              active ? "demo-field-focus" : done ? "demo-field-ok" : "border-[var(--demo-border-subtle)] opacity-50"
                            }`}
                          >
                            <p className="font-medium">{d.name}</p>
                            <p className="text-[var(--demo-muted)] mt-0.5">
                              {d.type} · {d.pages} pg · {d.tags.join(" · ")}
                            </p>
                            {active && d.insight && (
                              <p className="mt-1 text-[10px] text-[var(--demo-focus)]">→ {d.insight}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="demo-panel p-4">
                    <p className="demo-label">Pipeline · {currentDoc?.name ?? "…"}</p>
                    <div className="mt-3 space-y-2">
                      {AGENT_STAGES.map((s, i) => {
                        const done = i < stageIndex || ingestDone;
                        const active = i === stageIndex && !ingestDone;
                        return (
                          <div
                            key={s.id}
                            className={`flex gap-3 text-[11px] border px-3 py-2 ${
                              active ? "demo-field-focus" : done ? "demo-field-ok" : "border-[var(--demo-border-subtle)]"
                            }`}
                          >
                            <span className="font-mono text-[var(--demo-faint)] w-4">{done ? "✓" : "·"}</span>
                            <div>
                              <p className="font-medium">{s.label}</p>
                              <p className="text-[var(--demo-muted)]">{s.detail}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {currentStage && !ingestDone && (
                      <p className="mt-3 text-[10px] animate-pulse text-[var(--demo-muted)]">
                        Agent running {currentStage.label}…
                      </p>
                    )}
                  </div>

                  {/* Mini graph */}
                  <div className="demo-panel p-4 md:col-span-2">
                    <p className="demo-label">Knowledge graph · live build</p>
                    <div className="mt-3 flex flex-wrap gap-2 items-center justify-center py-4">
                      {["P-2047", "E-1156", "V-4820", "T-8", "AM-05", "1972-WO", "P&ID-68"].map((node, i) => (
                        <div
                          key={node}
                          className={`text-[10px] font-mono px-2 py-1 border transition-opacity duration-500 ${
                            i <= docIndex + stageIndex / 2 ? "demo-field-ok opacity-100" : "opacity-20 border-[var(--demo-border-subtle)]"
                          }`}
                        >
                          {node}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {phase === "insights" && (
                <div className="mt-4 demo-panel p-4">
                  <p className="demo-label">Agent · trend & insight extraction</p>
                  <p className="text-[11px] text-[var(--demo-muted)] mt-1 mb-4">
                    Cross-document analysis across {VAULT_CORPUS_STATS.pagesIndexed} pages
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {AGENT_INSIGHTS.slice(0, visibleInsights).map((ins) => (
                      <div
                        key={ins.id}
                        className={`border p-3 text-[11px] demo-fade-in ${
                          ins.severity === "critical"
                            ? "demo-field-alert"
                            : ins.severity === "warn"
                              ? "demo-field-warn"
                              : "demo-field-ok"
                        }`}
                      >
                        <p className="font-medium">{ins.title}</p>
                        <p className="text-[var(--demo-muted)] mt-1">{ins.detail}</p>
                        <p className="font-mono text-[10px] mt-2 text-[var(--demo-faint)]">{ins.assets.join(" · ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {phase === "brain" && (
                <div className="mt-4 space-y-4">
                  <div className="demo-panel p-4">
                    <p className="demo-label">Agentic brain · what it does with the data</p>
                    <p className="text-[12px] text-[var(--demo-muted)] mt-1 max-w-2xl">
                      Digitization is step one. The brain solves operational problems — click any action to query the live
                      corpus.
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {BRAIN_ACTIONS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setPhase("query");
                          submitQuery(a.prompt);
                        }}
                        className="demo-panel p-4 text-left hover:demo-field-focus transition-colors"
                      >
                        <p className="demo-label">{a.title}</p>
                        <p className="text-[11px] text-[var(--demo-muted)] mt-2">{a.problem}</p>
                        <p className="text-[12px] mt-2 font-medium">{a.action}</p>
                        <p className="text-[10px] font-mono mt-2 demo-field-ok inline-block px-2 py-0.5">{a.metric}</p>
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setPhase("query")} className="demo-btn-primary">
                    Open Ask the plant →
                  </button>
                </div>
              )}

              {phase === "query" && (
                <div className="mt-4 grid lg:grid-cols-2 gap-4">
                  <div className="demo-panel flex flex-col min-h-[480px]">
                    <div className="p-4 border-b border-[var(--demo-border-subtle)]">
                      <p className="demo-label">Ask the plant</p>
                      <p className="text-[10px] text-[var(--demo-muted)] mt-1">
                        {VAULT_CORPUS_STATS.pagesIndexed} pages · citations · Reelin ID sealed
                      </p>
                    </div>
                    <div className="flex-1 overflow-y-auto demo-scroll p-4 space-y-3 max-h-[360px]">
                      {messages.length === 0 && (
                        <p className="text-[12px] text-[var(--demo-faint)]">Ask about equipment, isolation, or history…</p>
                      )}
                      {messages.map((msg) => (
                        <div key={msg.id} className={msg.role === "user" ? "text-right" : ""}>
                          <div
                            className={`inline-block max-w-[95%] text-left text-[12px] px-3 py-2 ${
                              msg.role === "user" ? "bg-[var(--demo-surface-2)] border border-[var(--demo-border)]" : "border border-[var(--demo-border-subtle)]"
                            }`}
                          >
                            {msg.loading ? (
                              <span className="text-[var(--demo-muted)] animate-pulse">Searching archive…</span>
                            ) : (
                              <>
                                <p className="leading-relaxed">{renderBold(msg.text)}</p>
                                {msg.answer && msg.answer.citations.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-[var(--demo-border-subtle)] space-y-1">
                                    {msg.answer.citations.map((c) => (
                                      <button
                                        key={c.docId}
                                        type="button"
                                        onClick={() => {
                                          setSelectedDocId(c.docId);
                                          pushAudit("citation_opened", c.label);
                                        }}
                                        className="block w-full text-left text-[10px] px-2 py-1 border border-[var(--demo-border-subtle)] hover:demo-field-focus"
                                      >
                                        {c.label}
                                      </button>
                                    ))}
                                    <p className="text-[9px] font-mono text-[var(--demo-faint)]">{msg.answer.reelinId}</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <form
                      className="p-3 border-t border-[var(--demo-border-subtle)] flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitQuery(query);
                      }}
                    >
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask the plant…"
                        className="flex-1 border border-[var(--demo-border)] bg-[var(--demo-surface)] px-3 py-2 text-[12px]"
                      />
                      <button type="submit" className="demo-btn-primary shrink-0">
                        Search
                      </button>
                    </form>
                  </div>

                  <div className="demo-panel p-4 min-h-[480px]">
                    <p className="demo-label">Source · AI highlight</p>
                    {selectedDoc ? (
                      <div className="mt-3">
                        <ScannedDocument doc={selectedDoc} autoScrollHighlight />
                      </div>
                    ) : (
                      <p className="mt-12 text-center text-[12px] text-[var(--demo-faint)]">
                        Citation opens scanned page with highlighted passage
                      </p>
                    )}
                  </div>
                </div>
              )}

              {phase !== "intro" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {phase !== "ingest" && (
                    <button type="button" onClick={startDemo} className="demo-btn-secondary text-[11px]">
                      Restart demo
                    </button>
                  )}
                  {phase === "brain" && (
                    <button type="button" onClick={() => setPhase("query")} className="demo-btn-secondary text-[11px]">
                      Skip to query
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Audit sidebar */}
            <div className="lg:sticky lg:top-[3.75rem]">
              <AuditLedger events={auditEvents} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
