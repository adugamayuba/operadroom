/** Dominik-aligned Rheinland pilot economics — illustrative POC metrics */

export const PILOT_CONTEXT = {
  scenario: "Pre-TA · OPEX containment",
  unit: "CDU-1 · Crude Distillation",
  leadAsset: "P-2047 · Crude Charge Pump",
  facility: "Energy & Chemicals Park Rheinland",
} as const;

export const COORDINATION_BASELINE = {
  traditionalRoles: "10–15 coordinating roles",
  traditionalWallClock: "4–6 hours",
  traditionalPersonHours: 50,
  operadroomRoles: "1 engineer + agent",
  operadroomTargetMinutes: 30,
  operadroomPersonHours: 2.5,
  loadedLaborRateEur: 85,
  downtimeAvoidanceHours: 3,
  downtimeRateEurPerHour: { low: 100_000, high: 250_000 },
} as const;

export function personHoursSaved(): number {
  return COORDINATION_BASELINE.traditionalPersonHours - COORDINATION_BASELINE.operadroomPersonHours;
}

export function laborSavingsEur(): number {
  return Math.round(personHoursSaved() * COORDINATION_BASELINE.loadedLaborRateEur);
}

export function formatEur(n: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export function formatElapsedMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function downtimeExposureRange(): { low: string; high: string } {
  const { downtimeAvoidanceHours, downtimeRateEurPerHour } = COORDINATION_BASELINE;
  return {
    low: formatEur(downtimeAvoidanceHours * downtimeRateEurPerHour.low),
    high: formatEur(downtimeAvoidanceHours * downtimeRateEurPerHour.high),
  };
}
