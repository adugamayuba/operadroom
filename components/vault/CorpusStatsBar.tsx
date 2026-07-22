"use client";

import { VAULT_CORPUS_STATS } from "@/lib/vault/corpus";

export interface LiveCorpusStats {
  pages: number;
  documents: number;
  entities: number;
  graphLinks: number;
  complete: boolean;
}

export function CorpusStatsBar({ stats }: { stats: LiveCorpusStats }) {
  const items = [
    { label: "Pages indexed", value: stats.complete ? VAULT_CORPUS_STATS.pagesIndexed : stats.pages },
    { label: "Documents", value: stats.complete ? VAULT_CORPUS_STATS.documents : stats.documents },
    { label: "Entities", value: stats.complete ? VAULT_CORPUS_STATS.entities : stats.entities },
    { label: "Graph links", value: stats.complete ? 26 : stats.graphLinks },
    { label: "Oldest record", value: VAULT_CORPUS_STATS.oldestRecord, static: true },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-4">
      {items.map((item) => (
        <div key={item.label} className="border border-white/10 px-3 py-2.5 bg-black">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{item.label}</p>
          <p className="mt-1 text-[18px] font-mono text-white tabular-nums">
            {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
            {!stats.complete && !item.static && (
              <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-white demo-live-pulse align-middle" />
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
