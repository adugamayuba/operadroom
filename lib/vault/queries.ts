import { VAULT_CORPUS_STATS } from "./corpus";

export interface VaultCitation {
  docId: string;
  label: string;
  excerpt: string;
}

export interface VaultAnswer {
  id: string;
  answer: string;
  citations: VaultCitation[];
  reelinId: string;
  searchMs: number;
  confidence: number;
  followUp?: string;
  showIsolationChecklist?: boolean;
}

export const SUGGESTED_PROMPTS = [
  "What do we know about P-2047 bearing work before 1990?",
  "Draft a Safe Isolation plan for P-2047 from legacy records",
  "Have we ever had a pressure drop on Tank T-8 during winter freezes?",
  "Show maintenance history for V-4820 including old P&IDs",
  "Compare P-2047 and V-4820 — linked incidents and isolation paths",
] as const;

export interface IsolationStep {
  id: string;
  tag: string;
  action: string;
}

export const SAFE_ISOLATION_STEPS: IsolationStep[] = [
  { id: "s1", tag: "IV-2047-A", action: "Close and lock upstream isolation valve" },
  { id: "s2", tag: "IV-2047-B", action: "Close and lock downstream isolation valve" },
  { id: "s3", tag: "BD-2047-1", action: "Bleed charge line · verify zero energy" },
  { id: "s4", tag: "LOTO 2047-1–4", action: "Apply locks at four designated LOTO points" },
  { id: "s5", tag: "AM-05", action: "Execution engineer + permit holder sign-off before work" },
];

interface QueryRule {
  id: string;
  match: (q: string) => boolean;
  answer: VaultAnswer;
}

const RULES: QueryRule[] = [
  {
    id: "p2047-bearing",
    match: (q) =>
      /p-?2047/i.test(q) &&
      /bearing|vibration|1972|1990|handwritten|spacer|modification|know about|history|maintenance|before/i.test(q),
    answer: {
      id: "p2047-bearing",
      answer:
        "P-2047 has documented bearing work dating to **14 Mar 1972**. Engineer H. Weber recorded a **non-standard 3.2mm spacer** installed during a bearing overhaul — with an explicit note **not to revert to OEM spec** without engineering review. A **1988 corrective work order** confirms vibration was resolved after verifying that same spacer configuration. This likely explains recurring vibration patterns if OEM parts were substituted in later interventions.",
      citations: [
        {
          docId: "doc-1972-p2047",
          label: "1972 maintenance card · handwritten",
          excerpt: "Non-standard spacer installed (3.2mm). Do NOT revert to OEM spec.",
        },
        {
          docId: "doc-1988-p2047",
          label: "1988 WO · vibration follow-up",
          excerpt: "Spacer per 1972 card verified · vibration normalized.",
        },
        {
          docId: "doc-pid-2047",
          label: "P&ID Rev. 1968-A",
          excerpt: "Charge pump train · isolation points IV-2047-A/B.",
        },
      ],
      reelinId: "RID-VAULT-20260722-P2047-BRG",
      searchMs: 2400,
      confidence: 0.94,
      followUp: "Draft Safe Isolation for P-2047 using legacy P&ID?",
    },
  },
  {
    id: "safe-isolation",
    match: (q) =>
      /safe isolation|isolation plan|lockout|loto|isolate/i.test(q) ||
      (/draft/i.test(q) && /p-?2047|v-?4820/i.test(q) && /isol/i.test(q)),
    answer: {
      id: "safe-isolation",
      answer:
        "Based on legacy site records, a **Safe Isolation for P-2047** requires: close and lock **IV-2047-A** (upstream) and **IV-2047-B** (downstream), bleed via **BD-2047-1**, verify **LOTO points 2047-1 through 2047-4**, and obtain execution engineer + permit holder sign-off per **AM-05**. P&ID Rev. 1968-A confirms the charge pump train connection through E-1156 to V-4820.",
      citations: [
        {
          docId: "doc-safe-p2047",
          label: "AM-05 procedure · amended 1994",
          excerpt: "IV-2047-A/B closed & locked · bleed BD-2047-1.",
        },
        {
          docId: "doc-pid-2047",
          label: "P&ID Sheet 2047-A",
          excerpt: "Isolation valves and bleed point locations.",
        },
      ],
      reelinId: "RID-VAULT-20260722-P2047-ISO",
      searchMs: 1800,
      confidence: 0.91,
      showIsolationChecklist: true,
      followUp: "Compare P-2047 and V-4820 — linked incidents and isolation paths",
    },
  },
  {
    id: "t8-freeze",
    match: (q) =>
      (/t-?8|tank\s*8/i.test(q) || /tank/i.test(q)) &&
      /freeze|winter|pressure drop|cold/i.test(q),
    answer: {
      id: "t8-freeze",
      answer:
        "Yes. On **14 Dec 1984**, a night shift log records a **pressure drop on Tank T-8 during a freeze**. Engineer **Weber** resolved it by **bypassing Valve 12-B** per the winter protocol. Service was restored by 05:15. The log recommends inspecting trace heating before the next freeze event.",
      citations: [
        {
          docId: "doc-1984-t8",
          label: "Shift log · 14 Dec 1984",
          excerpt: "Bypass Valve 12-B per winter protocol · Weber on site.",
        },
      ],
      reelinId: "RID-VAULT-20260722-T8-FRZ",
      searchMs: 3100,
      confidence: 0.89,
    },
  },
  {
    id: "v4820-history",
    match: (q) => /v-?4820|fractionator feed|stiction|actuator/i.test(q),
    answer: {
      id: "v4820-history",
      answer:
        "V-4820 (fractionator feed valve) appears on **P&ID Rev. 1968-A** downstream of P-2047 and E-1156. A recent field note (Apr 2026) documents **actuator stiction** and recommends service with **AM-05 Safe Isolation**, cross-referencing the 1968 P&ID for bleed points.",
      citations: [
        {
          docId: "doc-v4820-stiction",
          label: "Field note · Apr 2026",
          excerpt: "Stiction observed · isolation per AM-05.",
        },
        {
          docId: "doc-pid-2047",
          label: "P&ID Rev. 1968-A",
          excerpt: "V-4820 on fractionator feed line.",
        },
      ],
      reelinId: "RID-VAULT-20260722-V4820",
      searchMs: 2100,
      confidence: 0.87,
    },
  },
  {
    id: "asset-compare",
    match: (q) =>
      /compare/i.test(q) &&
      (/p-?2047/i.test(q) || /v-?4820/i.test(q)) &&
      (/v-?4820/i.test(q) || /p-?2047/i.test(q)),
    answer: {
      id: "asset-compare",
      answer:
        "**P-2047** (charge pump) carries the deepest legacy record trail: **1972 bearing modification**, **1988 vibration repeat**, and a complete **Safe Isolation path** (IV-2047-A/B, AM-05). **V-4820** (fractionator feed valve) sits downstream on the same train per P&ID 1968-A — linked via **E-1156**, with recent **actuator stiction** (Apr 2026). Shared isolation: work on V-4820 requires P-2047 train isolation first. No bearing incidents on V-4820; failure mode is valve/actuator, not rotating equipment.",
      citations: [
        {
          docId: "doc-1972-p2047",
          label: "1972 maintenance card · P-2047",
          excerpt: "Non-standard spacer · do not revert OEM.",
        },
        {
          docId: "doc-pid-2047",
          label: "P&ID Rev. 1968-A · train layout",
          excerpt: "P-2047 → E-1156 → V-4820 charge train.",
        },
        {
          docId: "doc-v4820-stiction",
          label: "Field note · V-4820 · Apr 2026",
          excerpt: "Actuator stiction · isolate per AM-05.",
        },
      ],
      reelinId: "RID-VAULT-20260722-COMPARE",
      searchMs: 2600,
      confidence: 0.9,
      followUp: "Draft a Safe Isolation plan for P-2047 from legacy records",
    },
  },
];

export function matchVaultQuery(query: string): VaultAnswer | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  for (const rule of RULES) {
    if (rule.match(trimmed)) return rule.answer;
  }
  return null;
}

export function fallbackAnswer(_query: string): VaultAnswer {
  return {
    id: "fallback",
    answer: `No exact match in the indexed Rheinland archive (${VAULT_CORPUS_STATS.pagesIndexed} pages). Try asking about **P-2047 bearing history**, **Safe Isolation**, **Tank T-8 winter events**, or **V-4820** maintenance records.`,
    citations: [],
    reelinId: "RID-VAULT-20260722-NOMATCH",
    searchMs: 4200,
    confidence: 0.42,
  };
}
