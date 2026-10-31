# M0 — Baseline, repo hygiene, and CI skeleton

**Branch:** `mvp-m0-baseline` (from `main` @ `b4306ae`)
**Scope:** repository/build configuration only. No product behavior, API, or screen changes.
**Plan:** `~/.commandcode/plans/mvp-delivery-roadmap.md` (approved 2026-10-31).

---

## 1. What this milestone fixed

1. **Froze the uncommitted Phase 19 work** into `b4306ae` so the workspace, `app.config.ts` files, single root lockfile, and release docs are no longer at risk.
2. **Created `main`** at that commit; `master` was fast-forwarded to match. The repo previously had 18 phase branches, 2 tags, and **no remote**.
3. **Split the backend test layers.** `jest.config.js` is now unit-only (10 spec files, no database). Added `test/jest-integration.json` for real-DB suites (`*.integration-spec.ts`, `passWithNoTests` until M5). `test:e2e` remains the HTTP suite.
4. **Removed dead test scaffolding:** `test/database.test.config.ts`, `test/global-setup.ts` (declared `export default` twice), and `test/global-teardown.ts` — none were referenced by any Jest config.
5. **Made the backend installable from a clean tree.** A fresh `npm install` previously failed on three peer-dependency conflicts (see §3).
6. **Added a working backend linter.** The `lint` script pointed at ESLint, which was not installed and had no config. It now runs `oxlint` (same tool as the admin console) with 0 errors.
7. **Corrected the root workspace scripts and README.** The README claimed per-app installs, Expo Go, 133 tests, and `admin@trustlink.com / admin123`; all four were stale or wrong.
8. **Added a CI skeleton** (`.github/workflows/ci.yml`) with backend, shared, admin, and mobile jobs. The e2e step is `continue-on-error` until M1 fixes signup validation.

---

## 2. Files created / modified / deleted

**Created (5)**
| Path | Why |
|---|---|
| `.github/workflows/ci.yml` | CI skeleton: build/lint/unit/integration/e2e, shared tests, admin build, mobile typecheck |
| `.nvmrc` | Pin Node 20 |
| `backend/test/jest-integration.json` | Separate real-DB integration config |
| `docs/frontend/reports/M0-REPORT.md` | This report |
| `~/.commandcode/plans/mvp-delivery-roadmap.md` | Approved M0–M9 plan (outside the repo) |

**Modified (11)**: `README.md` · `package.json` (root scripts, `engines`) · `backend/package.json` (scripts, dependency alignment, `oxlint`) · `backend/package-lock.json` · `backend/jest.config.js` · `backend/.env.example` · `apps/customer/.env.example` · `apps/rider/.env.example` · `apps/admin/.env.example` · `docs/DEVELOPMENT_ROADMAP.md` (changelog) · `.commandcode/*` (session files, not committed).

**Deleted (3)**: `backend/test/database.test.config.ts`, `backend/test/global-setup.ts`, `backend/test/global-teardown.ts`.

---

## 3. Dependency changes (and why)

A clean `npm install` in `backend/` failed before this milestone. These are the root causes and the fixes:

| Package | Before | After | Reason |
|---|---|---|---|
| `@nestjs/typeorm` | `^10.0.2` | `^11.0.3` | v10 peers only Nest 8/9/10; the app runs Nest 11. v11 supports Nest 11 |
| `class-validator` | `^0.15.1` | `^0.14.0` | `@nestjs/mapped-types` peers `^0.13 \|\| ^0.14`; 0.15 is out of range |
| `ts-jest` | `^29.4.12` | `^29.4.15` | 29.4.12 peers Babel `<8`; 29.4.15 widens to `<9`, matching `@babel/core@8` |
| `redis` | `^6.2.1` | removed | Unused in source; TypeORM peers `redis ^3 \|\| ^4`. `ioredis` stays for M2 |
| `sqlite3`, `@types/sqlite3` | `^6.0.1` / `^3.1.11` | removed | Only used by the deleted dead test config; TypeORM peers `sqlite3 ^5` |
| `oxlint` | — | `^1.81.0` | Backend lint has no ESLint config or dependency today |

`npm install` now completes: **2 packages added, 50 removed**, 925 audited. `npm ci --dry-run` reports the backend lockfile up to date.

**Security note:** `npm install` reports **37 advisories (6 low, 20 moderate, 10 high, 1 critical)** in the existing dependency graph. This is not introduced by M0 and will be triaged in M7 (deployment hardening) — do not run `npm audit fix --force` blindly.

---

## 4. Commands run with real output

```
backend$ npm run build                    → nest build, 0 errors
backend$ npm run test:unit                → 10 suites / 133 tests passed (32.1 s)
backend$ npm run test:unit -- --listTests → 10 files, auth.e2e-spec excluded
backend$ npm run lint                     → 86 warnings, 0 errors (oxlint, 60 files)
backend$ npm ci --dry-run                 → up to date (925 packages)

root$ npm run typecheck                   → customer, rider, shared all clean
root$ npm test --workspace @trustlink/shared → 15 files / 151 tests passed
root$ npm run build --workspace admin     → 90 modules, 315.76 kB JS (94.61 kB gzip), 12.93 kB CSS
root$ npm run lint --workspace admin      → 5 warnings, 0 errors
root$ npm ci --dry-run                    → resolves; reports devDeps as "remove" because this
                                             machine exports NODE_ENV=production globally
```

`docker compose ps` failed: **Docker Desktop's Linux engine is not running on this machine.** Integration and e2e suites were therefore not executed locally; the CI workflow runs them with Postgres 16 + Redis 7 service containers.

---

## 5. Acceptance checklist (M0 plan)

| Criterion | ✓ | Evidence |
|---|---|---|
| Phase 19 committed, clean baseline | ✓ | `b4306ae` (24 files) |
| `main` exists and matches the baseline | ✓ | `main` and `master` at `b4306ae` |
| Unit tests run without Postgres | ✓ | 133 pass; test list excludes e2e |
| Separate integration/e2e configs | ✓ | `jest.config.js`, `test/jest-integration.json`, `test/jest-e2e.json` |
| Dead test scaffolding removed | ✓ | 3 files deleted |
| Backend lint executes | ✓ | oxlint, 0 errors |
| Clean install possible | ✓ | peer conflicts resolved; `npm ci --dry-run` up to date |
| README matches reality | ✓ | rewritten |
| Env examples complete and current | ✓ | data-source vars; admin/callbacks/CORS/storage vars |
| Root scripts and Node pin | ✓ | `test`, `typecheck`, `lint`, `build`; `engines.node >=20` |
| CI skeleton present | ✓ | `.github/workflows/ci.yml` |
| No product code changed | ✓ | only config/docs/tooling |

---

## 6. Known issues / open items

1. **No git remote yet.** `main` is local only. The plan's next step needs a GitHub repo URL and push access. I did not invent one.
2. **Docker was not running**, so the known e2e baseline (20/21, signup validation) could not be re-confirmed locally. CI will exercise it; M1 fixes the failure.
3. **86 backend lint warnings** (unused imports/params). They are mostly in files M1 will rewrite for DTOs; the lint gate is green (0 errors) in the meantime.
4. **37 npm advisories** in the backend dependency graph — triage in M7, not blindly auto-fixed.
5. **SC-48 measurement is now inconsistent.** Phase 19 reported the admin bundle at 557.24 kB (92 modules); this milestone measured **315.76 kB (90 modules)** with the same workspace and React pin. This needs a proper before/after before the ledger row is closed or kept open. Not changed in M0.
6. **`NODE_ENV=production` is exported globally on this machine.** Installs need `NODE_ENV=development`; this is documented in the README and BUILD.md. CI is unaffected.
7. **The e2e CI step is non-blocking** until M1 lands; the workflow comment says exactly when to remove `continue-on-error`.

---

## 7. Next milestone

**M1 — Backend contract, validation, auth, and RBAC.** DTO classes with `class-validator`, admin login + seed, role enforcement on every controller, route-shadowing fix, SC-43 rider release, `completeDelivery` persistence/notification, exception filter, and health readiness. Exit gate: 21/21 auth e2e plus the RBAC matrix.

---

## 8. Proposed commit message

```
chore(repo): m0 baseline, test layers, lint, and ci skeleton

- commit phase 19 workspace/EAS baseline and create main; master fast-forwarded
- split backend jest into unit (DB-free) and integration configs; delete three dead
  test scaffolding files (sqlite global setup/teardown/config)
- fix backend dependency resolution: @nestjs/typeorm 11, class-validator 0.14,
  ts-jest 29.4.15; remove unused redis/sqlite3 packages; add oxlint
- replace the stale README and env templates; add root scripts and Node 20 pin
- add a GitHub Actions skeleton (backend services + shared/admin/mobile jobs);
  the e2e step stays non-blocking until M1 fixes signup validation

Co-authored-by: CommandCodeBot <noreply@commandcode.ai>
```
