"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/demo/LogoMark";
import { useDemoTheme } from "@/components/demo/DemoThemeProvider";
import { buildFallbackAudit, loadAuditRecord, type AuditRecord } from "@/lib/demo/auditTrail";

function formatAuditTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const ACTOR_LABEL: Record<string, string> = {
  operadroom: "Operadroom agent",
  engineer: "Maintenance engineer",
  system: "System policy",
  sap: "SAP PM / MM",
};

export default function AuditPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const { theme, toggle } = useDemoTheme();
  const [record, setRecord] = useState<AuditRecord | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const loaded = loadAuditRecord(slug);
    if (loaded) {
      setRecord(loaded);
      setUsingFallback(false);
    } else {
      setRecord(buildFallbackAudit(slug || "rhn-demo"));
      setUsingFallback(true);
    }
  }, [slug]);

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[13px] text-[var(--demo-muted)]">Loading audit record…</p>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-[var(--demo-border)] bg-[var(--demo-surface)] pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoMark className="w-4 h-4 opacity-80" />
            <span className="text-[13px] font-semibold">Reelin ID · Audit verification</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/demo" className="text-[11px] border border-[var(--demo-border)] px-2.5 py-1 text-[var(--demo-muted)]">
              Back to demo
            </Link>
            <button type="button" onClick={toggle} className="text-[11px] border border-[var(--demo-border)] px-2.5 py-1 text-[var(--demo-muted)]">
              {theme === "light" ? "Dark" : "Light"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {usingFallback && (
          <div className="demo-field-warn px-4 py-3 mb-4 text-[12px]">
            Sample audit record — run a live incident on the demo to populate a session-bound trail.
          </div>
        )}

        <div className="border border-[var(--demo-border)] bg-[var(--demo-surface)] p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="demo-label">Reelin ID</p>
              <p className="mt-1 text-[13px] font-mono break-all">{record.reelinId}</p>
            </div>
            <span
              className={`self-start demo-pill px-2.5 py-1 text-[11px] font-medium ${
                record.status === "sealed" ? "demo-field-ok" : "demo-field-warn"
              }`}
            >
              {record.status === "sealed" ? "Sealed" : "Open session"}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-[var(--demo-border-subtle)] text-[12px]">
            <div>
              <p className="demo-label">Facility</p>
              <p className="mt-1">{record.facility}</p>
              <p className="text-[var(--demo-muted)] font-mono text-[11px]">{record.facilityCode}</p>
            </div>
            <div>
              <p className="demo-label">Asset</p>
              <p className="mt-1 font-mono">{record.assetTag}</p>
              <p className="text-[var(--demo-muted)]">{record.assetName}</p>
            </div>
            <div>
              <p className="demo-label">Alert</p>
              <p className="mt-1 font-mono demo-pill demo-field-warn inline-block">{record.alertCode}</p>
            </div>
            <div>
              <p className="demo-label">Session opened</p>
              <p className="mt-1 font-mono">{formatAuditTime(record.startedAt)}</p>
            </div>
            {record.sealedAt && (
              <div>
                <p className="demo-label">Sealed</p>
                <p className="mt-1 font-mono">{formatAuditTime(record.sealedAt)}</p>
              </div>
            )}
            {record.sapWorkOrder && (
              <div>
                <p className="demo-label">SAP work order</p>
                <p className="mt-1 font-mono demo-pill demo-field-ok inline-block">{record.sapWorkOrder}</p>
              </div>
            )}
          </div>

          {record.engineerNotes && (
            <div className="mt-5 pt-5 border-t border-[var(--demo-border-subtle)]">
              <p className="demo-label">Engineer notes</p>
              <p className="mt-2 text-[12px] text-[var(--demo-muted)] whitespace-pre-wrap border-l-2 border-[var(--demo-focus)] pl-3">
                {record.engineerNotes}
              </p>
            </div>
          )}
        </div>

        <div className="demo-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--demo-border-subtle)]">
            <p className="demo-label">Immutable event chain</p>
            <p className="demo-heading mt-0.5">{record.events.length} timestamped records</p>
          </div>
          <ol className="divide-y divide-[var(--demo-border-subtle)]">
            {record.events.map((event, i) => (
              <li key={event.id} className="px-4 py-4 flex gap-4">
                <div className="shrink-0 w-6 text-[11px] font-mono text-[var(--demo-faint)] pt-0.5">{String(i + 1).padStart(2, "0")}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="text-[13px] font-medium">{event.action}</p>
                    <span className="text-[10px] font-mono text-[var(--demo-muted)]">{formatAuditTime(event.at)}</span>
                  </div>
                  <p className="text-[11px] text-[var(--demo-muted)] mt-1">
                    {ACTOR_LABEL[event.actor] ?? event.actor} · phase {event.phase}
                  </p>
                  {event.detail && <p className="text-[12px] mt-2 text-[var(--demo-text)]">{event.detail}</p>}
                  <p className="text-[10px] font-mono text-[var(--demo-faint)] mt-2 break-all">{event.recordHash}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-[11px] text-[var(--demo-faint)] text-center pb-8">
          Operadroom pilot · Reelin ID compliance export · HITL-01 enforced on all SAP RELEASE actions
        </p>
      </main>
    </>
  );
}
