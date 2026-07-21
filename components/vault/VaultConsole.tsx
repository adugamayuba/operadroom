"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/demo/LogoMark";
import { useDemoTheme } from "@/components/demo/DemoThemeProvider";
import { ScannedDocument } from "@/components/vault/ScannedDocument";
import { trackEvent } from "@/lib/analytics";
import { FACILITY } from "@/lib/demo/scenarios";
import {
  fallbackAnswer,
  getDocument,
  INGEST_COMPLETE_STATS,
  INGEST_STEPS,
  matchVaultQuery,
  SUGGESTED_PROMPTS,
  VAULT_CORPUS_STATS,
  type VaultAnswer,
} from "@/lib/vault";

type VaultTab = "ask" | "ingest" | "archive";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  answer?: VaultAnswer;
  loading?: boolean;
}

function VaultNav() {
  const { theme, toggle } = useDemoTheme();
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[var(--demo-surface)] border-b border-[var(--demo-border)] pt-[env(safe-area-inset-top)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <LogoMark className="w-4 h-4 opacity-80" />
          <span className="text-[13px] font-semibold tracking-wide uppercase">Operadroom Vault</span>
          <span className="hidden sm:inline text-[10px] text-[var(--demo-muted)] border-l border-[var(--demo-border)] pl-2 ml-1 uppercase tracking-wider">
            Plant Memory
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <Link href="/demo" className="text-[var(--demo-muted)] hover:text-[var(--demo-text)]">
            Execution demo
          </Link>
          <Link href="/pilot" className="text-[var(--demo-muted)] hover:text-[var(--demo-text)] hidden sm:inline">
            Pilot
          </Link>
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

function renderAnswerText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function VaultConsole() {
  const [tab, setTab] = useState<VaultTab>("ask");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [ingestRunning, setIngestRunning] = useState(false);
  const [ingestStep, setIngestStep] = useState(-1);
  const [ingestComplete, setIngestComplete] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedDoc = selectedDocId ? getDocument(selectedDocId) : null;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const runIngest = useCallback(() => {
    if (ingestRunning) return;
    setIngestRunning(true);
    setIngestComplete(false);
    setIngestStep(0);
    trackEvent("vault_ingest_start");
  }, [ingestRunning]);

  useEffect(() => {
    if (!ingestRunning || ingestStep < 0) return;
    if (ingestStep >= INGEST_STEPS.length) {
      setIngestRunning(false);
      setIngestComplete(true);
      trackEvent("vault_ingest_complete");
      return;
    }
    const step = INGEST_STEPS[ingestStep];
    const t = setTimeout(() => setIngestStep((s) => s + 1), step.durationMs);
    return () => clearTimeout(t);
  }, [ingestRunning, ingestStep]);

  const submitQuery = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: trimmed };
      const loadingId = `a-${Date.now()}`;
      setMessages((m) => [...m, userMsg, { id: loadingId, role: "assistant", text: "", loading: true }]);
      setQuery("");
      trackEvent("vault_query", { q: trimmed.slice(0, 80) });

      const matched = matchVaultQuery(trimmed) ?? fallbackAnswer(trimmed);
      const delay = matched.searchMs;

      setTimeout(() => {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === loadingId
              ? {
                  id: loadingId,
                  role: "assistant",
                  text: matched.answer,
                  answer: matched,
                }
              : msg
          )
        );
        if (matched.citations[0]) setSelectedDocId(matched.citations[0].docId);
      }, Math.min(delay, 3200));
    },
    []
  );

  return (
    <>
      <VaultNav />
      <main className="pt-14 pb-12 min-h-screen">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          {/* Hero */}
          <div className="py-5 border-b border-[var(--demo-border-subtle)]">
            <p className="demo-label">{FACILITY.name} · {FACILITY.code}</p>
            <h1 className="mt-1 text-xl font-semibold">Plant Memory</h1>
            <p className="mt-2 text-[13px] text-[var(--demo-muted)] max-w-3xl">
              Turn pre-war paper archives into a searchable institutional brain. Legacy maintenance cards, P&IDs, and
              shift logs — indexed by equipment tag, queryable in seconds.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
            {[
              { label: "Pages indexed", value: String(VAULT_CORPUS_STATS.pagesIndexed) },
              { label: "Documents", value: String(VAULT_CORPUS_STATS.documents) },
              { label: "Asset tags", value: String(VAULT_CORPUS_STATS.assetTags) },
              { label: "Entities", value: VAULT_CORPUS_STATS.entities.toLocaleString() },
              { label: "Oldest record", value: VAULT_CORPUS_STATS.oldestRecord },
            ].map((s) => (
              <div key={s.label} className="border border-[var(--demo-border)] px-3 py-2 bg-[var(--demo-surface-2)]">
                <p className="demo-label">{s.label}</p>
                <p className="text-[14px] font-mono font-medium mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 border-b border-[var(--demo-border-subtle)]">
            {(
              [
                ["ask", "Ask the plant"],
                ["ingest", "Ingest pipeline"],
                ["archive", "Archive index"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`text-[11px] px-3 py-2 uppercase tracking-wider border-b-2 -mb-px ${
                  tab === id
                    ? "border-[var(--demo-text)] text-[var(--demo-text)]"
                    : "border-transparent text-[var(--demo-muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "ingest" && (
            <div className="demo-panel p-4 mt-4">
              <div className="flex flex-wrap justify-between gap-3 items-start">
                <div>
                  <p className="demo-label">Digitization pipeline</p>
                  <p className="text-[12px] text-[var(--demo-muted)] mt-1">
                    Low-cost scan → Vision OCR → entity graph → semantic index. {INGEST_COMPLETE_STATS.qaQueue} pages
                    flagged for human QA (low confidence).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={ingestRunning}
                  onClick={runIngest}
                  className="demo-btn-primary disabled:opacity-40"
                >
                  {ingestRunning ? "Processing batch…" : "Simulate batch ingest"}
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {INGEST_STEPS.map((step, i) => {
                  const done = ingestComplete || i < ingestStep;
                  const active = ingestRunning && i === ingestStep;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 text-[11px] border px-3 py-2 ${
                        active ? "demo-field-focus" : done ? "demo-field-ok" : "border-[var(--demo-border-subtle)]"
                      }`}
                    >
                      <span className="font-mono text-[var(--demo-faint)] w-5 shrink-0">{done ? "✓" : i + 1}</span>
                      <div>
                        <p className="font-medium">{step.label}</p>
                        <p className="text-[var(--demo-muted)] mt-0.5">{step.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {ingestComplete && (
                <p className="mt-4 text-[11px] demo-field-ok px-3 py-2">
                  Archive B · CDU-1 batch ready — {INGEST_COMPLETE_STATS.pages} pages searchable via Ask the plant.
                </p>
              )}
            </div>
          )}

          {tab === "archive" && (
            <div className="demo-panel p-4 mt-4">
              <p className="demo-label">Indexed sources</p>
              <ul className="mt-3 space-y-2 text-[11px]">
                {VAULT_CORPUS_STATS.rooms.map((room) => (
                  <li key={room} className="flex justify-between border-b border-[var(--demo-border-subtle)] py-2">
                    <span>{room}</span>
                    <span className="text-[var(--demo-muted)] font-mono">847 pages</span>
                  </li>
                ))}
                <li className="flex justify-between border-b border-[var(--demo-border-subtle)] py-2">
                  <span>Hard drive export · legacy PDFs</span>
                  <span className="text-[var(--demo-muted)] font-mono">23 files</span>
                </li>
              </ul>
            </div>
          )}

          {tab === "ask" && (
            <div className="grid lg:grid-cols-2 gap-4 mt-4">
              {/* Chat */}
              <div className="demo-panel flex flex-col min-h-[520px]">
                <div className="p-4 border-b border-[var(--demo-border-subtle)]">
                  <p className="demo-label">Ask the plant</p>
                  <p className="text-[11px] text-[var(--demo-muted)] mt-1">
                    Plain-English search across {VAULT_CORPUS_STATS.pagesIndexed} scanned pages · citations to source
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {SUGGESTED_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => submitQuery(p)}
                        className="text-[10px] border border-[var(--demo-border-subtle)] px-2 py-1 text-[var(--demo-muted)] hover:border-[var(--demo-border)] hover:text-[var(--demo-text)] text-left"
                      >
                        {p.length > 48 ? `${p.slice(0, 48)}…` : p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto demo-scroll p-4 space-y-4 max-h-[400px]">
                  {messages.length === 0 && (
                    <p className="text-[12px] text-[var(--demo-faint)]">
                      Try: &ldquo;What do we know about P-2047 bearing work before 1990?&rdquo;
                    </p>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className={msg.role === "user" ? "text-right" : ""}>
                      <div
                        className={`inline-block max-w-[95%] text-left text-[12px] px-3 py-2 ${
                          msg.role === "user"
                            ? "bg-[var(--demo-surface-2)] border border-[var(--demo-border)]"
                            : "border border-[var(--demo-border-subtle)]"
                        }`}
                      >
                        {msg.loading ? (
                          <span className="text-[var(--demo-muted)] animate-pulse">Searching archive…</span>
                        ) : (
                          <>
                            <p className="leading-relaxed">{renderAnswerText(msg.text)}</p>
                            {msg.answer && msg.answer.citations.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-[var(--demo-border-subtle)] space-y-1.5">
                                <p className="demo-label text-[9px]">Sources</p>
                                {msg.answer.citations.map((c) => (
                                  <button
                                    key={c.docId}
                                    type="button"
                                    onClick={() => setSelectedDocId(c.docId)}
                                    className="block w-full text-left text-[10px] px-2 py-1.5 border border-[var(--demo-border-subtle)] hover:demo-field-focus"
                                  >
                                    <span className="font-medium">{c.label}</span>
                                    <span className="text-[var(--demo-muted)] block mt-0.5 truncate">{c.excerpt}</span>
                                  </button>
                                ))}
                                <p className="text-[9px] font-mono text-[var(--demo-faint)] mt-2">
                                  {msg.answer.reelinId} · {(msg.answer.searchMs / 1000).toFixed(1)}s ·{" "}
                                  {Math.round(msg.answer.confidence * 100)}% confidence
                                </p>
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
                  className="p-4 border-t border-[var(--demo-border-subtle)] flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitQuery(query);
                  }}
                >
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about equipment, isolation, history…"
                    className="flex-1 border border-[var(--demo-border)] bg-[var(--demo-surface)] px-3 py-2 text-[12px]"
                  />
                  <button type="submit" className="demo-btn-primary shrink-0">
                    Search
                  </button>
                </form>
              </div>

              {/* Document viewer */}
              <div className="demo-panel p-4 min-h-[520px]">
                <p className="demo-label">Source document</p>
                {selectedDoc ? (
                  <div className="mt-3">
                    <ScannedDocument doc={selectedDoc} autoScrollHighlight />
                  </div>
                ) : (
                  <div className="mt-8 text-center text-[12px] text-[var(--demo-faint)] px-4">
                    Select a citation to view the scanned page with AI highlight on the exact passage.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bridge to execution */}
          <div className="demo-panel p-4 mt-4 flex flex-wrap gap-4 items-center justify-between">
            <div>
              <p className="demo-label">Phase 2 · Execution layer</p>
              <p className="text-[12px] mt-1 text-[var(--demo-muted)] max-w-xl">
                Once records are live, Operadroom runs Safe Isolation → SAP work order → engineer release on the same
                corpus.
              </p>
            </div>
            <Link href="/demo" className="demo-btn-secondary">
              Open execution demo →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
