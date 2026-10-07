# PHASE 0B REPORT — Complete Phase 0

Track: frontend-first (backend frozen). Task type: **inspection + documentation + baseline scripts** (no UI changes).

---

## 1. Inspection findings (before changes)

- **Phase 0 report location:** `C:\Users\Qafams\Desktop\TrustLink Logistics\FRONTEND_PHASE_0_REPORT.md` (repo root). Now moved to `docs/frontend/reports/PHASE-0-REPORT.md`.
- `docs/frontend/` existed with only `plan/01_PLAN_AMENDMENTS_v2.md`. No `reports/`, no ledgers/snapshots.
- **No typecheck scripts** in customer/rider/shared `package.json`; `apps/shared` had **no `tsconfig.json`** and **no `node_modules`** (so `tsc` cannot resolve deps there).
- All three `utils/api.ts` hardcoded the LAN IP `192.168.0.152`; no `.env.example` files.
- Mobile apps store no token / send no `Authorization`; admin sends `Bearer admin_token` but `/auth/admin/login` does not exist.
- `apps/shared` has no tests; `npm test` is a placeholder echo.
- Confirmed (from reading backend source, not prior reports): `GET /deliveries` and `/deliveries/track/:trackingNumber` **require** a JWT (class-level guard); `@Roles` is only enforced where `RolesGuard` is present (only `UsersController`); POD `recipientOtp` is not generated/delivered by the backend; two divergent cancellation paths exist.
- No frontend UI files were changed; no backend files were touched.

## 2. Summary (≤5 lines)

1. Moved the Phase 0 report into `docs/frontend/reports/` and added the missing Phase 0 documentation (baseline, contract snapshot, FR trace, ledger, AGENTS addendum draft).
2. Added `typecheck` scripts (customer/rider/shared) + `apps/shared/tsconfig.json`.
3. Made the three API clients env-driven and added `.env.example` per app.
4. Ran real checks: customer/rider typecheck **pass**, both Metro bundles **pass**, admin **build passes**, admin **lint cannot run** (machine blocks oxlint binding), shared typecheck **fails** (no deps).
5. No dependency installs; no UI diffs; backend untouched.

## 3. Files created / modified / deleted

**Created (11)**
- `docs/frontend/reports/PHASE-0-REPORT.md` — the Phase 0 report, moved from repo root.
- `docs/frontend/BASELINE.md` — condensed baseline + required Q&A (a–e) with evidence.
- `docs/frontend/CONTRACT_SNAPSHOT.md` — full route/DTO/entity/enum/state-machine/fee/pricing/POD contract.
- `docs/frontend/REQUIREMENTS_TRACE.md` — FR-C/R/A → planned screens.
- `docs/frontend/CONTRACT_LEDGER.md` — SC-1…SC-15 + endpoint classification + D1–D20 + new SC-16/SC-17.
- `docs/frontend/AGENTS_ADDENDUM_DRAFT.md` — proposed AGENTS wording (NOT applied).
- `docs/frontend/reports/PHASE-0B-REPORT.md` — this report.
- `apps/customer/.env.example`, `apps/rider/.env.example`, `apps/admin/.env.example`.
- `apps/shared/tsconfig.json`.

**Modified (6)**
- `apps/customer/src/utils/api.ts`, `apps/rider/src/utils/api.ts`, `apps/admin/src/utils/api.ts` — LAN IP → env-driven base URL (no other changes).
- `apps/customer/package.json`, `apps/rider/package.json` — added `"typecheck": "tsc --noEmit"`.
- `apps/shared/package.json` — added `"typecheck": "tsc --noEmit"`.

**Deleted/moved (1)**
- `FRONTEND_PHASE_0_REPORT.md` (root) → moved to `docs/frontend/reports/PHASE-0-REPORT.md`.

**Counts:** created 11 · modified 6 · moved 1 · deleted 0 (net new files unless noted). No `backend/**`, `docker-compose.yml`, `.env`, or `AGENTS.md` changes.

## 4. Dependencies added

**None.** No installs were performed (per instructions). `apps/shared` still has no `node_modules`.

## 5. Commands run with real output

**Customer typecheck** — `apps/customer$ npm run typecheck`
```
> customer@1.0.0 typecheck
> tsc --noEmit
```
(exit 0 — no errors)

**Rider typecheck** — `apps/rider$ npm run typecheck`
```
> rider@1.0.0 typecheck
> tsc --noEmit
```
(exit 0 — no errors)

**Shared typecheck** — `apps/shared$ npm run typecheck` (fails: no deps)
```
error TS2688: Cannot find type definition file for 'react-native'.
  The file is in the program because:
    Entry point of type library 'react-native' specified in compilerOptions
```
Also initially reported `TS6046 --moduleResolution` (the runner resolved an older `tsc`); I changed `moduleResolution` from `bundler` to `node` so the only remaining failure is the missing dependency. **Not fixed** (would require installing deps).

**Admin build** — `apps/admin$ npm run build` (passes)
```
> admin@0.0.0 build
> tsc -b && vite build
vite v8.3.0 building client environment for production...
✓ 135 modules transformed.
dist/index.html                   0.45 kB │ gzip:   0.29 kB
dist/assets/index-DCttRE2w.css   14.42 kB │ gzip:   3.51 kB
dist/assets/index-B4nFYeYO.js   405.38 kB │ gzip: 120.02 kB
✓ built in 1.58s
```

**Admin lint** — `apps/admin$ npm run lint` (cannot run on this machine)
```
> admin@0.0.0 lint
> oxlint
Error: Cannot find native binding. ... An Application Control policy has blocked this file.
  \\?\...\node_modules\@oxlint\binding-win32-x64-msvc\oxlint.win32-x64-msvc.node
```

**Customer Metro bundle** — `apps/customer$ npx expo export --platform android`
```
Android Bundled 78111ms index.ts (1422 modules)
› android bundles (1): _expo/static/js/android/index-5fdb8b9403e1218590d63c2c613b0f80.hbc (3.7MB)
Exported: <scratchpad>\cust-export
```

**Rider Metro bundle** — `apps/rider$ npx expo export --platform android`
```
Android Bundled 25698ms index.ts (1426 modules)
› android bundles (1): _expo/static/js/android/index-dc1e7943885e933cfa1adf085fea087b.hbc (3.7MB)
Exported: <scratchpad>\rider-export
```

**Git** — `git status --short` / `git diff --stat` run; pre-existing uncommitted tree (README, all screens, backend, assets, etc.) unchanged by this phase. New untracked from this phase: `apps/{customer,rider,admin}/.env.example`, `apps/shared/tsconfig.json`, `docs/frontend/**`. Outputs pasted in chat.

## 6. Acceptance checklist

| Criterion | ✓/✗ | Evidence |
|---|---|---|
| Phase 0 report moved into `docs/frontend/reports/` | ✓ | `move` output: `1 file(s) moved` → `PHASE-0-REPORT.md` |
| `typecheck` script added (customer) | ✓ | `apps/customer/package.json` |
| `typecheck` script added (rider) | ✓ | `apps/rider/package.json` |
| `typecheck` script added (shared) + `tsconfig.json` | ✓ | `apps/shared/package.json`, `apps/shared/tsconfig.json` |
| Typecheck/bundle/build/lint run with real output | ✓ | §5 (2 fail for environment/dep reasons, recorded) |
| Three `api.ts` env-driven (EXPO_PUBLIC_API_URL / VITE_API_URL) | ✓ | `apps/*/src/utils/api.ts` |
| `.env.example` per app | ✓ | 3 files created |
| `BASELINE.md` incl. (a)–(e) with evidence | ✓ | `docs/frontend/BASELINE.md` §2 |
| `CONTRACT_SNAPSHOT.md` (routes, DTOs, entities, enums, tables, POD, track, payment) | ✓ | `docs/frontend/CONTRACT_SNAPSHOT.md` |
| `REQUIREMENTS_TRACE.md` (FR → screens) | ✓ | `docs/frontend/REQUIREMENTS_TRACE.md` |
| `CONTRACT_LEDGER.md` (SC-1…15 + endpoint table, relabelled per D) | ✓ | `docs/frontend/CONTRACT_LEDGER.md` |
| AGENTS addendum drafted, not applied | ✓ | `docs/frontend/AGENTS_ADDENDUM_DRAFT.md`; `AGENTS.md` untouched |
| Backend read-only | ✓ | no `backend/**` edits |
| No UI diffs | ✓ | only `api.ts` (config), package scripts, shared tsconfig touched |
| Unknowns listed | ✓ | §"Unknowns I could not determine" |
| Git status + diff --stat captured | ✓ | §5 |

## 7. Deviations and why

1. **Shared typecheck fails** — `apps/shared` has no `node_modules`; installing is out of scope ("no dependency installs"). Script + tsconfig added so it works once deps are installed (FB13). Recorded, not fixed.
2. **Initial shared `tsconfig` used `moduleResolution: bundler`**, which the resolved (older) `tsc` rejected (`TS6046`). Changed to `node` to remove a self-inflicted error and expose only the real missing-deps failure.
3. **Admin lint could not run** — an OS Application Control policy blocks `oxlint`'s native `.node` binary. Environmental, not code.
4. **Two extra ledger rows (SC-16, SC-17)** added beyond the required SC-1…SC-15, clearly separated as newly observed, because they are real conflicts (payment amount units; role-guard not enforced). Flagged "Needs decision".
5. **Report moved (not copied)** per the instruction "Move your Phase 0 report" — the root file no longer exists.

## 8. Ledger rows added / "Needs decision"

- Seeded **SC-1…SC-15** (from Amendment Pack v2 §4) + endpoint classification table relabelled with **D1–D20**.
- Added **SC-16** (payment `amount` kobo vs naira — Needs decision) and **SC-17** (`@Roles` not enforced outside `UsersController` — Needs decision).
- Open "Needs decision" items: SC-2 (cancellation tiers), SC-5 (OTP 5 vs 10 min), SC-8 (distance source), SC-16 (amount units), SC-17 (role enforcement), admin-login (backend endpoint vs interim mock).

## 9. Scaffolds still present

**None added this phase.** No temporary scaffolds exist that require `docs/frontend/SCAFFOLD_REGISTER.md`. Pre-existing mock data in screens is documented, not scaffolded.

## 10. Known issues, risks, open questions

- **Risks:** shared package cannot be validated locally (no deps); admin lint unverifiable on this machine; the working tree has a large pre-existing uncommitted diff unrelated to this phase (must not be swept into a frontend commit).
- **Known issues (deferred backend):** no admin login; no recipient-OTP generation; maps/distance absent (fare needs `distanceKm`); signup has no field validation; OTP rate-limit/Redis unused; `@Roles` enforcement gap.
- **Open questions:** amount units (SC-16); whether the `@Roles` gap is intended (SC-17); whether `/auth/profile/setup` should be guarded (it currently is not).

## 11. How a human verifies this phase manually

1. Read `docs/frontend/BASELINE.md`, `CONTRACT_SNAPSHOT.md`, `REQUIREMENTS_TRACE.md`, `CONTRACT_LEDGER.md`, `AGENTS_ADDENDUM_DRAFT.md`.
2. `cd apps/customer && npm run typecheck` → expect no output (pass).
3. `cd apps/rider && npm run typecheck` → expect no output (pass).
4. `cd apps/admin && npm run build` → expect `✓ built`.
5. `cd apps/customer && npx expo export --platform android` and same for `apps/rider` → expect `Android Bundled … modules`.
6. `git status --short` → confirm only the files in §3 changed; `git diff -- apps/*/src/utils/api.ts apps/*/package.json apps/shared/tsconfig.json`.
7. Confirm `AGENTS.md` is unchanged (`git status` shows it clean).

## 12. Proposed commit message and file list

```
chore(frontend): phase 0 baseline — docs, typecheck scripts, env-driven API URLs

- move Phase 0 report to docs/frontend/reports/PHASE-0-REPORT.md
- add BASELINE, CONTRACT_SNAPSHOT, REQUIREMENTS_TRACE, CONTRACT_LEDGER docs
- add AGENTS addendum draft (not applied)
- add typecheck scripts (customer, rider, shared) + apps/shared/tsconfig.json
- env-driven API base URLs (EXPO_PUBLIC_API_URL / VITE_API_URL) + .env.example per app
```
**Files to stage (exact):**
```
apps/customer/src/utils/api.ts
apps/rider/src/utils/api.ts
apps/admin/src/utils/api.ts
apps/customer/package.json
apps/rider/package.json
apps/shared/package.json
apps/shared/tsconfig.json
apps/customer/.env.example
apps/rider/.env.example
apps/admin/.env.example
docs/frontend/BASELINE.md
docs/frontend/CONTRACT_SNAPSHOT.md
docs/frontend/REQUIREMENTS_TRACE.md
docs/frontend/CONTRACT_LEDGER.md
docs/frontend/AGENTS_ADDENDUM_DRAFT.md
docs/frontend/reports/PHASE-0-REPORT.md
docs/frontend/reports/PHASE-0B-REPORT.md
```
(Note: `apps/customer/src/utils/` and `apps/rider/src/utils/` are currently **untracked** — staging `api.ts` also works via the explicit file paths above. Do not stage the unrelated pre-existing modifications.)

## Unknowns I could not determine

- `GET /api/health` exact response body (endpoint confirmed; shape not read).
- Whether the missing `RolesGuard` outside `UsersController` is intentional.
- Whether `PaymentService` amounts are expected in kobo or naira (SC-16) — code comment vs pricing config disagree.
- Whether `/auth/profile/setup` being unauthenticated is intentional.
- Whether `oxlint` runs on a machine without the Application Control restriction (could not verify here).
- The exact `trackingNumber` year convention for fixtures (code uses the current year, e.g. `TLK-2026-…`).

STOPPED. Awaiting approval for the next phase.
