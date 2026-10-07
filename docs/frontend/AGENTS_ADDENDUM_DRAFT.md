# AGENTS.md addendum — DRAFT (NOT APPLIED)

> **Status: proposal only.** Per Amendment Pack v2 §6 and Phase 0B instructions, this wording is drafted for review. **`AGENTS.md` was NOT modified.** Apply only after explicit approval (then edit `AGENTS.md` and remove this note).

## Proposed section to add to `AGENTS.md`

```
## Frontend-first track (from 2026-10-07)

UI work follows `docs/frontend/plan/` and supersedes the roadmap's phase order for
frontend work. Backend is frozen. AGENTS rule 1 (regression-gate) applies to backend
phases only. REQUIREMENTS.md still wins on behaviour; conflicts go to
`docs/frontend/CONTRACT_LEDGER.md` as "Needs decision".
```

### Rationale / context (for the reviewer, not necessarily committed)
- Supersedes `docs/DEVELOPMENT_ROADMAP.md` phase order **for frontend/UI work only** (backend phases keep their gates).
- Points CommandCode at `docs/frontend/plan/` (amendments v2 + phase prompts) and the ledgers/snapshots under `docs/frontend/`.
- Keeps `docs/REQUIREMENTS.md` as the behaviour source of truth, routing conflicts to the ledger.

### Related docs added this phase
- `docs/frontend/BASELINE.md`
- `docs/frontend/CONTRACT_SNAPSHOT.md`
- `docs/frontend/REQUIREMENTS_TRACE.md`
- `docs/frontend/CONTRACT_LEDGER.md`
- `docs/frontend/reports/PHASE-0-REPORT.md`, `docs/frontend/reports/PHASE-0B-REPORT.md`
