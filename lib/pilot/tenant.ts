/** Rheinland pilot tenant configuration */

export const PILOT_TENANT = {
  id: "rheinland-cdu1",
  name: "Rheinland Pilot · CDU-1",
  facility: "Energy & Chemicals Park Rheinland",
  facilityCode: "SH-RHN-01",
  unit: "CDU-1 · Crude Distillation",
  process: "AM-05 · Safe Isolation & Maintenance Execution",
  leadAsset: "P-2047",
  assetCount: 15,
  durationDays: 90,
  scenario: "Pre-TA · OPEX containment",
} as const;

export type PilotRole = "engineer" | "observer";

export const PILOT_ROLES: { id: PilotRole; label: string; canRelease: boolean }[] = [
  { id: "engineer", label: "Maintenance execution engineer", canRelease: true },
  { id: "observer", label: "Observer", canRelease: false },
];
