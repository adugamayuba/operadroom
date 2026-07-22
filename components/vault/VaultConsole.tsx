"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/demo/LogoMark";
import { AgentPageIngest } from "@/components/vault/AgentPageIngest";
import { KnowledgeGraphExplorer } from "@/components/vault/KnowledgeGraphExplorer";
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
  SUGGESTED_PROMPTS,
  VAULT_CORPUS_STATS,
  type AuditEvent,
  type VaultAnswer,
} from "@/lib/vault";

type DemoPhase = "intro" | "ingest" | "insights" | "graph" | "brain" | "query";

const PHASE_ORDER: DemoPhase[] = ["intro", "ingest", "insights", "graph", "brain", "query"];
const PHASE_LABELS = ["Start", "Ingest", "Insights", "Graph", "Actions", "Query"];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  answer?: VaultAnswer;
  loading?: boolean;
}

function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

function VaultNav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-black border-b border-white/10 pt-[env(safe-area-inset-top)]">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LogoMark className="w-5 h-5 text-white/80" />
          <span className="text-[15px] font-semibold tracking-[0.35em] uppercase text-white">Vault</span>
          <span className="hidden sm:inline text-[12px] text-white/35 border-l border-white/15 pl-2 ml-1 tracking-[0.2em] uppercase">
            Plant Memory
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] tracking-[0.15em] uppercase text-white/45">
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white demo-live-pulse" />
            Secure sandbox
          </span>
        </div>
      </div>
    </header>
  );
}

function AuditLedger({ events }: { events: AuditEvent[] }) {
  return (
    <div className="vault-panel flex flex-col h-full">
      <div className="p-3 border-b border-white/10">
        <p className="vault-label">Reelin ID · on-chain</p>
      </div>
      <div className="flex-1 overflow-y-auto demo-scroll p-2 space-y-1 max-h-[320px] lg:max-h-[calc(100vh-8rem)]">
        {events.length === 0 && <p className="text-[12px] text-white/25 p-2">Awaiting events</p>}
        {events.map((e) => (
          <div key={e.id} className="text-[11px] border border-white/10 px-2 py-1.5 font-mono">
            <div className="flex justify-between text-white/70">
              <span>{AUDIT_EVENT_LABELS[e.type]}</span>
              <span className="text-white/30">{e.timestamp.slice(11)}</span>
            </div>
            <p className="text-white/40 mt-0.5 truncate">{e.detail}</p>
            <p className="text-white/25 mt-0.5 truncate">{e.reelinId}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseStepper({
  phase,
  maxReached,
  onNavigate,
}: {
  phase: DemoPhase;
  maxReached: number;
  onNavigate: (p: DemoPhase) => void;
}) {
  const idx = PHASE_ORDER.indexOf(phase);
  return (
    <div className="flex flex-wrap gap-1">
      {PHASE_LABELS.map((s, i) => {
        const reachable = i <= maxReached;
        const active = i === idx;
        return (
          <button
            key={s}
            type="button"
            disabled={!reachable}
            onClick={() => reachable && onNavigate(PHASE_ORDER[i])}
            className={`text-[11px] uppercase tracking-[0.16em] px-2.5 py-1.5 border transition-colors ${
              active
                ? "border-white text-white bg-white/10"
                : reachable
                  ? "border-white/40 text-white/70 hover:border-white hover:text-white"
                  : "border-white/15 text-white/25 cursor-not-allowed"
            }`}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

export function VaultConsole() {
  const [phase, setPhase] = useState<DemoPhase>("intro");
  const [maxPhaseReached, setMaxPhaseReached] = useState(0);
  const [queryTab, setQueryTab] = useState<"ask" | "graph">("ask");
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [docIndex, setDocIndex] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [ingestDone, setIngestDone] = useState(false);
  const [visibleInsights, setVisibleInsights] = useState(0);
  const [extractedLabels, setExtractedLabels] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const selectedDoc = selectedDocId ? getDocument(selectedDocId) : null;
  const currentJob = AGENT_DOC_QUEUE[docIndex];

  const goToPhase = useCallback((p: DemoPhase) => {
    setPhase(p);
    trackEvent("vault_phase", { phase: p });
  }, []);

  useEffect(() => {
    const idx = PHASE_ORDER.indexOf(phase);
    setMaxPhaseReached((m) => Math.max(m, idx));
  }, [phase]);

  useEffect(() => {
    if (phase === "query") setQueryTab("ask");
  }, [phase]);

  const pushAudit = useCallback((type: Parameters<typeof createAuditEvent>[0], detail: string) => {
    setAuditEvents((prev) => [createAuditEvent(type, detail), ...prev].slice(0, 50));
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
    setExtractedLabels([]);
    setMessages([]);
    setSelectedDocId(null);
    pushAudit("sandbox_provisioned", `${FACILITY.code} · isolated tenant · EU region`);
    trackEvent("vault_demo_start");
  };

  useEffect(() => {
    if (phase !== "ingest" || ingestDone || !currentJob) return;

    const stage = AGENT_STAGES[stageIndex];
    const doc = getDocument(currentJob.docId);

    const t = setTimeout(() => {
      if (stage.id === "receive") pushAudit("page_uploaded", `${currentJob.name} · hash sealed`);
      if (stage.id === "index") pushAudit("page_indexed", `${currentJob.name} · ${currentJob.tags.join(", ")}`);
      if (stage.id === "graph") pushAudit("graph_linked", `${currentJob.tags[0]} ↔ knowledge graph`);
      if (stage.id === "extract" && currentJob.insight) pushAudit("entity_extracted", currentJob.insight);

      if (stage.id === "tag") {
        setExtractedLabels((prev) => [...new Set([...prev, ...currentJob.tags])]);
      }
      if (stage.id === "extract") {
        const regionLabels = doc?.regions.filter((r) => r.stage === "extract").map((r) => r.label) ?? [];
        if (currentJob.insight) regionLabels.push(currentJob.insight.slice(0, 24));
        setExtractedLabels((prev) => [...new Set([...prev, ...regionLabels])]);
      }
      if (stage.id === "index") {
        setExtractedLabels([]);
      }

      if (stageIndex < AGENT_STAGES.length - 1) {
        setStageIndex((s) => s + 1);
      } else if (docIndex < AGENT_DOC_QUEUE.length - 1) {
        setDocIndex((d) => d + 1);
        setStageIndex(0);
        setExtractedLabels([]);
      } else {
        setIngestDone(true);
        setPhase("insights");
        trackEvent("vault_demo_ingest_complete");
      }
    }, 900);

    return () => clearTimeout(t);
  }, [phase, docIndex, stageIndex, ingestDone, currentJob, pushAudit]);

  useEffect(() => {
    if (phase !== "insights") return;
    if (visibleInsights >= AGENT_INSIGHTS.length) {
      const t = setTimeout(() => setPhase("graph"), 1000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleInsights((v) => v + 1), 650);
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

  return (
    <>
      <VaultNav />
      <main className="pt-16 pb-10 min-h-screen bg-black">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1fr_260px] gap-5 items-start">
            <div className="min-w-0">
              <div className="py-5 border-b border-white/10 flex flex-wrap gap-4 justify-between items-end">
                <div>
                  <p className="vault-label">{FACILITY.name}</p>
                  <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight uppercase text-white">Plant Memory</h1>
                  <p className="mt-3 text-[15px] sm:text-[16px] text-white/50 max-w-2xl leading-relaxed">
                    Centuries of legacy records → AI agent ingests, catalogs, and builds an agentic brain. Every action
                    sealed on-chain via Reelin ID.
                  </p>
                </div>
                <PhaseStepper phase={phase} maxReached={maxPhaseReached} onNavigate={goToPhase} />
              </div>

              {phase === "intro" && (
                <div className="mt-6 space-y-4">
                  <div className="vault-panel p-6">
                    <p className="vault-label">Live demonstration</p>
                    <p className="text-[17px] text-white mt-3 font-medium tracking-tight">
                      Watch the agent scan, touch, and extract from real archive pages.
                    </p>
                    <p className="vault-body mt-2 max-w-lg">
                      {AGENT_DOC_QUEUE.length} documents · {VAULT_CORPUS_STATS.pagesIndexed} pages · handwritten cards,
                      P&IDs, shift logs.
                    </p>
                    <button type="button" onClick={startDemo} className="vault-btn-primary mt-5">
                      Initiate demo
                    </button>
                  </div>
                  <div className="vault-panel p-6">
                    <p className="vault-label">{SECURITY_COPY.headline}</p>
                    <p className="vault-body mt-2">{SECURITY_COPY.body}</p>
                    <ul className="mt-4 grid sm:grid-cols-2 gap-2">
                      {SECURITY_COPY.bullets.map((b) => (
                        <li key={b} className="text-[14px] text-white/55 flex gap-2">
                          <span className="text-white">—</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {phase === "ingest" && currentJob && (
                <div className="mt-6">
                  <AgentPageIngest job={currentJob} stageIndex={stageIndex} extractedLabels={extractedLabels} />
                  <p className="mt-4 text-[12px] text-white/30 uppercase tracking-[0.2em] text-center">
                    Document {docIndex + 1} of {AGENT_DOC_QUEUE.length}
                  </p>
                </div>
              )}

              {phase === "insights" && (
                <div className="mt-6 vault-panel p-5">
                  <p className="vault-label mb-4">Cross-document insights</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {AGENT_INSIGHTS.slice(0, visibleInsights).map((ins) => (
                      <div key={ins.id} className="border border-white/15 p-4 vault-chip-in text-[14px]">
                        <p className="text-white font-medium uppercase tracking-wide text-[12px]">{ins.title}</p>
                        <p className="text-white/50 mt-2 leading-relaxed">{ins.detail}</p>
                        <p className="font-mono text-[11px] mt-3 text-white/30">{ins.assets.join(" · ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {phase === "graph" && (
                <div className="mt-6">
                  <KnowledgeGraphExplorer
                    continueLabel={
                      maxPhaseReached >= PHASE_ORDER.indexOf("query") ? "Back to Ask the plant →" : "Continue to actions →"
                    }
                    onContinue={() => {
                      pushAudit("graph_linked", "Knowledge graph explored · P-2047 cluster");
                      if (maxPhaseReached >= PHASE_ORDER.indexOf("query")) {
                        goToPhase("query");
                        setQueryTab("ask");
                      } else {
                        goToPhase("brain");
                      }
                    }}
                    onOpenDocument={(docId) => {
                      setSelectedDocId(docId);
                      pushAudit("citation_opened", `Graph → ${docId}`);
                    }}
                  />
                </div>
              )}

              {phase === "brain" && (
                <div className="mt-6 space-y-4">
                  <div className="vault-panel p-5">
                    <p className="vault-label">Agentic brain · operational actions</p>
                    <p className="vault-body mt-2">
                      Digitization unlocks execution — select an action to query the live corpus.
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
                        className="vault-panel p-5 text-left hover:border-white/40 transition-colors group"
                      >
                        <p className="vault-label group-hover:text-white">{a.title}</p>
                        <p className="text-[14px] text-white/40 mt-2">{a.problem}</p>
                        <p className="text-[15px] text-white/80 mt-3">{a.action}</p>
                        <p className="text-[12px] font-mono mt-3 text-white/50 border border-white/15 inline-block px-2 py-0.5">
                          {a.metric}
                        </p>
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setPhase("query")} className="vault-btn-secondary">
                    Open query interface
                  </button>
                </div>
              )}

              {phase === "query" && (
                <div className="mt-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setQueryTab("ask")}
                      className={`text-[12px] uppercase tracking-[0.14em] px-4 py-2 border ${
                        queryTab === "ask" ? "border-white text-white bg-white/10" : "border-white/25 text-white/50 hover:border-white/50"
                      }`}
                    >
                      Ask the plant
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueryTab("graph")}
                      className={`text-[12px] uppercase tracking-[0.14em] px-4 py-2 border ${
                        queryTab === "graph" ? "border-white text-white bg-white/10" : "border-white/25 text-white/50 hover:border-white/50"
                      }`}
                    >
                      Knowledge graph
                    </button>
                  </div>

                  {queryTab === "graph" ? (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <KnowledgeGraphExplorer
                        compact
                        onOpenDocument={(docId) => {
                          setSelectedDocId(docId);
                          pushAudit("citation_opened", `Graph → ${docId}`);
                        }}
                      />
                      <div className="vault-panel p-4 flex items-start justify-center min-h-[360px] bg-black">
                        {selectedDoc ? (
                          <ScannedDocument doc={selectedDoc} autoScrollHighlight />
                        ) : (
                          <p className="text-[13px] text-white/30 uppercase tracking-[0.15em] mt-20">
                            Select a source document · full page view
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                <div className="grid lg:grid-cols-2 gap-4">
                  <div className="vault-panel flex flex-col min-h-[500px]">
                    <div className="p-4 border-b border-white/10">
                      <p className="vault-label">Ask the plant</p>
                      <p className="vault-body mt-1">
                        {VAULT_CORPUS_STATS.pagesIndexed} pages indexed · citations · Reelin ID sealed
                      </p>
                      <div className="mt-3">
                        <p className="vault-label mb-2">Suggested questions</p>
                        <div className="flex flex-col gap-2">
                          {SUGGESTED_PROMPTS.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => submitQuery(p)}
                              className="vault-suggest-btn w-full"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto demo-scroll p-4 space-y-3 max-h-[360px]">
                      {messages.length === 0 && (
                        <p className="text-[14px] text-white/35">Select a suggested question or type your own below.</p>
                      )}
                      {messages.map((msg) => (
                        <div key={msg.id} className={msg.role === "user" ? "text-right" : ""}>
                          <div
                            className={`inline-block max-w-[95%] text-left text-[15px] px-3 py-2.5 border ${
                              msg.role === "user" ? "border-white/25 text-white/80" : "border-white/10 text-white/70"
                            }`}
                          >
                            {msg.loading ? (
                              <span className="text-white/40 animate-pulse">Searching…</span>
                            ) : (
                              <>
                                <p className="leading-relaxed">{renderBold(msg.text)}</p>
                                {msg.answer?.citations.map((c) => (
                                  <button
                                    key={c.docId}
                                    type="button"
                                    onClick={() => {
                                      setSelectedDocId(c.docId);
                                      pushAudit("citation_opened", c.label);
                                    }}
                                    className="block w-full text-left text-[13px] mt-2 pt-2 border-t border-white/10 text-white/50 hover:text-white"
                                  >
                                    {c.label}
                                  </button>
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <form
                      className="p-3 border-t border-white/10 flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitQuery(query);
                      }}
                    >
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Query archive…"
                        className="flex-1 bg-black border border-white/20 px-3 py-2.5 text-[15px] text-white placeholder:text-white/30"
                      />
                      <button type="submit" className="vault-btn-primary shrink-0">
                        Search
                      </button>
                    </form>
                  </div>
                  <div className="vault-panel p-4 flex items-start justify-center min-h-[500px] bg-black">
                    {selectedDoc ? (
                      <ScannedDocument doc={selectedDoc} autoScrollHighlight />
                    ) : (
                      <p className="text-[13px] text-white/30 uppercase tracking-[0.15em] mt-20">
                        Select citation · full page view
                      </p>
                    )}
                  </div>
                </div>
                  )}
                </div>
              )}

              {phase !== "intro" && (
                <button type="button" onClick={startDemo} className="vault-btn-secondary mt-6">
                  Restart demo
                </button>
              )}
            </div>

            <div className="lg:sticky lg:top-14">
              <AuditLedger events={auditEvents} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
