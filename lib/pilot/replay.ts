import type { AssetId, Severity } from "@/lib/demo/scenarios";

/** Historical replay scenarios for CDU-1 pilot (Dominik data placeholders) */

export interface ReplayScenario {
  id: string;
  title: string;
  date: string;
  assetId: AssetId;
  severity: Severity;
  summary: string;
  recordsExpected: number;
  baselineHours: number;
}

export const REPLAY_SCENARIOS: ReplayScenario[] = [
  {
    id: "replay-001",
    title: "P-2047 vibration excursion (critical)",
    date: "2025-11-14",
    assetId: "p2047",
    severity: "critical",
    summary: "Crude charge pump bearing trend breach during pre-TA window. 6.2h coordination baseline.",
    recordsExpected: 4,
    baselineHours: 6.2,
  },
  {
    id: "replay-002",
    title: "E-1156 fouling degradation (warning)",
    date: "2026-01-08",
    assetId: "e1156",
    severity: "warning",
    summary: "Preheat exchanger ΔT drop. Chemical cleaning WO delayed by manual record search.",
    recordsExpected: 3,
    baselineHours: 4.5,
  },
  {
    id: "replay-003",
    title: "F-2201 bridgewall temperature (critical)",
    date: "2026-02-22",
    assetId: "f2201",
    severity: "critical",
    summary: "Furnace bridgewall excursion. Safe Isolation pack rebuilt from three systems.",
    recordsExpected: 5,
    baselineHours: 7.0,
  },
  {
    id: "replay-004",
    title: "P-2049 NPSH margin loss (warning)",
    date: "2026-03-05",
    assetId: "p2049",
    severity: "warning",
    summary: "Reflux pump cavitation risk. Spares check across MM and field notes.",
    recordsExpected: 3,
    baselineHours: 5.1,
  },
  {
    id: "replay-005",
    title: "V-4820 control valve stiction (advisory)",
    date: "2026-04-18",
    assetId: "v4820",
    severity: "advisory",
    summary: "Fractionator feed valve actuator drift. Preventive isolation procedure standardization test case.",
    recordsExpected: 3,
    baselineHours: 3.8,
  },
];
