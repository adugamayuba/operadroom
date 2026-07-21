/** Reelin ID on-chain audit events for vault security demo */

export type AuditEventType =
  | "sandbox_provisioned"
  | "page_uploaded"
  | "page_indexed"
  | "entity_extracted"
  | "graph_linked"
  | "search_executed"
  | "citation_opened"
  | "export_attempt"
  | "copy_flagged";

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  timestamp: string;
  actor: string;
  detail: string;
  blockHash: string;
  reelinId: string;
}

function mockHash(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i);
  return `0x${Math.abs(h).toString(16).padStart(8, "0")}…${seed.slice(-4)}`;
}

export function createAuditEvent(
  type: AuditEventType,
  detail: string,
  actor = "operadroom-agent"
): AuditEvent {
  const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  return {
    id,
    type,
    timestamp: ts,
    actor,
    detail,
    blockHash: mockHash(id + detail),
    reelinId: `RID-${id.slice(4, 12).toUpperCase()}`,
  };
}

export const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  sandbox_provisioned: "Sandbox provisioned",
  page_uploaded: "Page uploaded",
  page_indexed: "Page indexed",
  entity_extracted: "Entity extracted",
  graph_linked: "Graph linked",
  search_executed: "Search executed",
  citation_opened: "Citation opened",
  export_attempt: "Export attempt",
  copy_flagged: "Copy flagged",
};

export const SECURITY_COPY = {
  headline: "Isolated cloud sandbox · Reelin ID on-chain audit",
  body: "Customer data lives in a dedicated secure sandbox — never shared, never used to train global models. Every upload, index, search, and citation is sealed on-chain via Reelin ID. Unauthorized copy or export attempts are flagged and recorded for cyber security review.",
  bullets: [
    "Dedicated tenant sandbox per facility",
    "Per-page upload hash · indexed on-chain",
    "Every search query and citation reference logged",
    "Copy/export anomalies flagged automatically",
    "Full audit trail exportable for compliance review",
  ],
};
