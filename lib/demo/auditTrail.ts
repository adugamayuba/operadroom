import { FACILITY, getSeverityMeta, type Severity, type SimPhase, type WorkOrderDraft } from "./scenarios";

export type AuditActor = "operadroom" | "engineer" | "system" | "sap";

export interface AuditEvent {
  id: string;
  at: string;
  phase: string;
  actor: AuditActor;
  action: string;
  detail?: string;
  recordHash: string;
}

export interface AuditRecord {
  reelinId: string;
  slug: string;
  facility: string;
  facilityCode: string;
  assetTag: string;
  assetName: string;
  severity: Severity;
  alertCode: string;
  startedAt: string;
  sealedAt?: string;
  status: "open" | "sealed";
  engineerNotes?: string;
  sapWorkOrder?: string;
  selectedFix?: string;
  workOrder?: WorkOrderDraft;
  events: AuditEvent[];
}

const STORAGE_PREFIX = "operadroom-audit:";

function mockHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return `0x${Math.abs(h).toString(16).padStart(8, "0")}${Math.abs(h * 7).toString(16).padStart(8, "0")}`;
}

export function reelinIdSlug(reelinId: string): string {
  const parts = reelinId.split(":");
  return parts[parts.length - 1] ?? reelinId;
}

export function auditPagePath(reelinId: string): string {
  return `/demo/audit/${encodeURIComponent(reelinIdSlug(reelinId))}`;
}

export function saveAuditRecord(record: AuditRecord): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${record.slug}`, JSON.stringify(record));
  localStorage.setItem(`${STORAGE_PREFIX}id:${record.reelinId}`, record.slug);
}

export function loadAuditRecord(slugOrId: string): AuditRecord | null {
  if (typeof window === "undefined") return null;
  const decoded = decodeURIComponent(slugOrId);
  const direct = localStorage.getItem(`${STORAGE_PREFIX}${decoded}`);
  if (direct) {
    try {
      return JSON.parse(direct) as AuditRecord;
    } catch {
      return null;
    }
  }
  const mapped = localStorage.getItem(`${STORAGE_PREFIX}id:${decoded}`);
  if (mapped) {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${mapped}`);
    if (raw) {
      try {
        return JSON.parse(raw) as AuditRecord;
      } catch {
        return null;
      }
    }
  }
  return null;
}

const PHASE_AUDIT: Partial<Record<SimPhase, { action: string; detail?: string; actor?: AuditActor }>> = {
  detecting: { action: "C3 Reliability alert ingested", detail: "Site API · Operadroom solution agent activated", actor: "system" },
  ingest: { action: "Alert mapped to SAP equipment", detail: "PI Historian context attached (read-only)", actor: "operadroom" },
  records: { action: "Historical records digitized and queried", detail: "Prior WOs, OEM manuals, field notes indexed", actor: "operadroom" },
  diagnose: { action: "Root cause analysis completed", actor: "operadroom" },
  analyze: { action: "Corrective procedures evaluated", detail: "Multi-criteria scoring: downtime, spares, safety, SLA", actor: "operadroom" },
  select: { action: "Procedure selected", actor: "operadroom" },
  inventory: { action: "SAP MM availability check", actor: "sap" },
  draft: { action: "Work order draft composed", detail: "SAP PM DRAFT created · RELEASE blocked pending HITL-01", actor: "operadroom" },
  review: { action: "Awaiting engineer release", detail: "HITL-01 · Notes will update engineer Reelin ID agent", actor: "system" },
};

export function createAuditRecord(params: {
  reelinId: string;
  assetTag: string;
  assetName: string;
  severity: Severity;
  selectedFix?: string;
}): AuditRecord {
  const meta = getSeverityMeta(params.severity);
  const now = new Date().toISOString();
  const slug = reelinIdSlug(params.reelinId);
  const record: AuditRecord = {
    reelinId: params.reelinId,
    slug,
    facility: FACILITY.name,
    facilityCode: FACILITY.code,
    assetTag: params.assetTag,
    assetName: params.assetName,
    severity: params.severity,
    alertCode: meta.alertCode,
    startedAt: now,
    status: "open",
    selectedFix: params.selectedFix,
    events: [
      {
        id: "evt-1",
        at: now,
        phase: "detecting",
        actor: "operadroom",
        action: "Incident session opened",
        detail: `${params.assetTag} · ${meta.alertCode} · Reelin ID bound`,
        recordHash: mockHash(`${params.reelinId}-open-${now}`),
      },
    ],
  };
  saveAuditRecord(record);
  return record;
}

export function appendAuditPhase(record: AuditRecord, phase: SimPhase): AuditRecord {
  const meta = PHASE_AUDIT[phase];
  if (!meta) return record;
  if (record.events.some((e) => e.phase === phase && e.action === meta.action)) return record;

  const at = new Date().toISOString();
  const event: AuditEvent = {
    id: `evt-${record.events.length + 1}`,
    at,
    phase,
    actor: meta.actor ?? "operadroom",
    action: meta.action,
    detail: meta.detail,
    recordHash: mockHash(`${record.reelinId}-${phase}-${at}`),
  };

  const updated: AuditRecord = { ...record, events: [...record.events, event] };
  saveAuditRecord(updated);
  return updated;
}

export function attachWorkOrderToAudit(record: AuditRecord, workOrder: WorkOrderDraft): AuditRecord {
  const updated: AuditRecord = { ...record, workOrder, reelinId: workOrder.reelinId, slug: reelinIdSlug(workOrder.reelinId) };
  saveAuditRecord(updated);
  return updated;
}

export function sealAuditRecord(
  record: AuditRecord,
  params: { engineerNotes: string; sapWorkOrder: string }
): AuditRecord {
  const at = new Date().toISOString();
  const releaseEvent: AuditEvent = {
    id: `evt-${record.events.length + 1}`,
    at,
    phase: "approved",
    actor: "engineer",
    action: "SAP RELEASE authorized",
    detail: params.engineerNotes
      ? `Engineer notes appended · WO ${params.sapWorkOrder} released to planning`
      : `WO ${params.sapWorkOrder} released to planning · HITL-01 satisfied`,
    recordHash: mockHash(`${record.reelinId}-seal-${at}-${params.engineerNotes}`),
  };

  const updated: AuditRecord = {
    ...record,
    status: "sealed",
    sealedAt: at,
    engineerNotes: params.engineerNotes || undefined,
    sapWorkOrder: params.sapWorkOrder,
    events: [...record.events, releaseEvent],
  };
  saveAuditRecord(updated);
  return updated;
}

export function buildFallbackAudit(slug: string): AuditRecord {
  const meta = getSeverityMeta("warning");
  const started = new Date(Date.now() - 120000).toISOString();
  const reelinId = `rid:agent:operadroom:${slug}`;
  return {
    reelinId,
    slug,
    facility: FACILITY.name,
    facilityCode: FACILITY.code,
    assetTag: "P-2047",
    assetName: "Crude Charge Pump",
    severity: "warning",
    alertCode: meta.alertCode,
    startedAt: started,
    sealedAt: new Date().toISOString(),
    status: "sealed",
    sapWorkOrder: "9001847",
    engineerNotes: "Demo audit record — run a live incident on /demo to populate a browser-local trail.",
    events: [
      { id: "evt-1", at: started, phase: "detecting", actor: "operadroom", action: "Anomaly detected", detail: "Threshold breach on P-2047", recordHash: mockHash("1") },
      { id: "evt-2", at: started, phase: "records", actor: "operadroom", action: "Maintenance records retrieved", recordHash: mockHash("2") },
      { id: "evt-3", at: started, phase: "draft", actor: "operadroom", action: "Work order draft composed", recordHash: mockHash("3") },
      { id: "evt-4", at: new Date().toISOString(), phase: "approved", actor: "engineer", action: "SAP RELEASE authorized", recordHash: mockHash("4") },
    ],
  };
}
