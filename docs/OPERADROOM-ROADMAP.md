# Operadroom Product Roadmap

**Entity:** Reelin AI Inc · `operadroom.reelin.ai`  
**Last updated:** 2026-07-10  
**Advisor input:** Rahul Kumar (Shell SEAM / ESSA framework)

---

## USP (one line)

**Maintenance execution agent** that aggregates tag master, P&IDs, historian, and work history — then drafts SAP work orders with **engineer-owned release** and **Reelin ID audit**. Not another monitoring dashboard.

---

## ESSA + AI (every targeted process)

| Step | Operadroom action |
|------|-------------------|
| **Eliminate** | Remove duplicate manual searches across WO systems, OEM PDFs, field notes |
| **Simplify** | One anomaly → one ranked corrective path |
| **Standardize** | Map site procedures to SAP PM operations and safety steps |
| **Aggregate** | Fuse tags, P&ID nodes, PI trends, Cognite twin, SAP equipment master |
| **AI** | Agent proposes fix + draft WO · human signs release |

---

## Phase 0 — Data integration (POC prerequisite)

Before AI execution, the site API must link:

- Master tag system ↔ equipment master (SAP functional location)
- P&ID graph nodes ↔ live tags
- PI Historian ↔ alert normalization
- Digitized legacy WOs, OEM manuals, field notes (read-only ingest)

**Demo today:** Simulated Rheinland sandbox with all layers shown as connected.

---

## POC scope (Phase 1) — one unit, one process deep

**Process:** **Safe Isolation & Maintenance Execution** (SEAM Asset Management · AM-05)

**Facility:** One process unit (e.g. CDU-1), 5–15 assets

**Success metrics:**

| Metric | Target |
|--------|--------|
| Alert → draft WO time | −40% vs manual desk baseline |
| Engineer rewrite rate | <25% of agent drafts need major edits |
| Records retrieved | ≥3 relevant sources auto-cited per incident |
| Audit completeness | 100% actions on Reelin ID trail |
| Staffing outcome | **3 engineers + agent** vs **10-person** desk equivalent (POC narrative) |

**Commercial:** $250K–$500K pilot · $250K+ ARR per site post-POC

---

## Priority processes (Phase 1–2)

From ~18 asset management processes, focus **top 6**:

1. **Safe Isolation** (LOTO / ISSoW) ← POC lead
2. **Management of Change**
3. **Corrective maintenance execution**
4. **Preventive work packaging**
5. **Spares & BOM alignment**
6. **Turnaround scope linkage**

---

## Phase 2 — Expand unit + add processes

- Second process: **Management of Change**
- Multi-unit within same site
- OPEX feed from released WOs to finance models
- Change management: customer PMO or partner-led (TBD per account)

---

## Phase 3 — Verticals & robotics brain

**Target verticals (niche, not generic):**

- Hydrogen / chemicals
- Lithium recycling
- Mining
- Shipping decarbonization

**Robotics:** Operadroom as **execution brain** — planning and scheduling output feeds field / humanoid workflows (same Reelin ID, future channel).

---

## Go-to-market lanes

| Lane | Owner | Notes |
|------|-------|-------|
| Germany refinery POC | Abel + Dominik network | Enterprise pilot discussions |
| Product / ESSA / roadmap | Rahul advisor | **No O&G pitches** · COI-safe |
| Process / field | John (pending intro) | Procedure validation |

---

## Change management

Operadroom does **not** replace site change org. POC includes:

- Customer identifies **maintenance execution owner**
- Operadroom trains on agent + HITL workflow (2-week)
- Optional partner for CM (Phase 2 statement in contracts)

---

## Next 30 days (Abel)

- [x] Tune live demo to ESSA + Safe Isolation narrative
- [ ] Rahul review of roadmap (Fri 7/17)
- [ ] One-page POC SOW template (scope, metrics, Phase 0 data checklist)
- [ ] Pilot doc for Germany track (separate from Rahul O&G boundary)
