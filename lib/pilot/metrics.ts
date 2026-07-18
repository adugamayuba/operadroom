/** Pilot success metrics — local persistence for 90-day POC */

export interface PilotMetrics {
  incidentsProcessed: number;
  releasesApproved: number;
  totalBaselineHoursSaved: number;
  totalOperadroomHours: number;
  recordsCitedTotal: number;
  majorRewriteCount: number;
  events: PilotEvent[];
}

export interface PilotEvent {
  id: string;
  at: string;
  assetTag: string;
  replayId?: string;
  draftMinutes: number;
  baselineHours: number;
  recordsCited: number;
  majorRewrite: boolean;
  reelinId: string;
}

const STORAGE_KEY = "operadroom-pilot-metrics";

const EMPTY: PilotMetrics = {
  incidentsProcessed: 0,
  releasesApproved: 0,
  totalBaselineHoursSaved: 0,
  totalOperadroomHours: 0,
  recordsCitedTotal: 0,
  majorRewriteCount: 0,
  events: [],
};

export function loadPilotMetrics(): PilotMetrics {
  if (typeof window === "undefined") return { ...EMPTY, events: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PilotMetrics) : { ...EMPTY, events: [] };
  } catch {
    return { ...EMPTY, events: [] };
  }
}

export function savePilotMetrics(m: PilotMetrics): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
}

export function recordRelease(
  m: PilotMetrics,
  payload: {
    assetTag: string;
    replayId?: string;
    elapsedMs: number;
    baselineHours: number;
    recordsCited: number;
    majorRewrite: boolean;
    reelinId: string;
  }
): PilotMetrics {
  const operadroomHours = payload.elapsedMs / 3600000;
  const saved = Math.max(0, payload.baselineHours - operadroomHours);
  const event: PilotEvent = {
    id: `evt-${Date.now()}`,
    at: new Date().toISOString(),
    assetTag: payload.assetTag,
    replayId: payload.replayId,
    draftMinutes: Math.round((payload.elapsedMs / 60000) * 10) / 10,
    baselineHours: payload.baselineHours,
    recordsCited: payload.recordsCited,
    majorRewrite: payload.majorRewrite,
    reelinId: payload.reelinId,
  };
  return {
    incidentsProcessed: m.incidentsProcessed + 1,
    releasesApproved: m.releasesApproved + 1,
    totalBaselineHoursSaved: m.totalBaselineHoursSaved + saved,
    totalOperadroomHours: m.totalOperadroomHours + operadroomHours,
    recordsCitedTotal: m.recordsCitedTotal + payload.recordsCited,
    majorRewriteCount: m.majorRewriteCount + (payload.majorRewrite ? 1 : 0),
    events: [event, ...m.events].slice(0, 50),
  };
}

export function pilotKpis(m: PilotMetrics) {
  const rewriteRate =
    m.releasesApproved > 0 ? (m.majorRewriteCount / m.releasesApproved) * 100 : 0;
  const avgRecords = m.releasesApproved > 0 ? m.recordsCitedTotal / m.releasesApproved : 0;
  const avgDraftMin =
    m.events.length > 0
      ? m.events.reduce((s, e) => s + e.draftMinutes, 0) / m.events.length
      : 0;
  return { rewriteRate, avgRecords, avgDraftMin };
}
