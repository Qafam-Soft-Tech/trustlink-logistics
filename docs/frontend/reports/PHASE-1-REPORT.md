# PHASE 1 REPORT — Data boundary

Branch: `fe-phase-1-data-boundary` (confirmed before any change; tree was clean).

---

## 1. Inspection findings (before changes)

- **Contract-first target:** screen → hook → port → adapter (mock | api). Screens currently call `api` (axios) or fixtures directly; there is no `services/types/hooks` boundary.
- `apps/shared` had **no `node_modules`**; its `typecheck` (added Phase 0B) pointed at the whole `src` incl. RN components and could not resolve `react-native`.
- `apps/{customer,rider}/src/{utils/api.ts}` hardcode nothing now (env-driven since 0B), but stores **no token** and has no request interceptor (D19 is a later phase).
- Backend contracts (read-only) source of truth: `docs/frontend/CONTRACT_SNAPSHOT.md`; conflicts in `docs/frontend/CONTRACT_LEDGER.md`.
- Known hazards anticipated by the prompt: npm auto-installing `peerDependencies` into `apps/shared` (duplicate react-native), and the environment's global `NODE_ENV=production` (npm omits devDependencies).
- Verified from the backend: `GET /deliveries` and `/deliveries/track/:trackingNumber` require a JWT; `@Roles` is enforced only in `UsersController`; POD `recipientOtp` is not generated server-side; **no** `DELETE /deliveries/addresses/:id` route.

## 2. Summary (≤5 lines)

1. Added the shared data boundary: typed `domain`, `data/ports`, a mock adapter with a lifecycle engine + fixtures + 8 scenarios, an api adapter over the real routes, and a `createDataLayer` composition root.
2. Added `validation` + `formatters` (naira, no Intl) and a vitest suite.
3. Added QueryClient + DataProvider at each `App.tsx` and base hooks under each app's `src/hooks`.
4. Install/verify: shared install clean (no duplicate react-native); customer/rider typecheck + Metro + admin build all pass; **68/68 shared tests pass**.
5. No screens touched; backend untouched.

## 3. Files created / modified / deleted (path — why)

**Created — shared (24)**
- `apps/shared/src/domain/{types.ts,stateMachine.ts,fare.ts,index.ts,ambient.d.ts}` — typed domain, transition table, cancellation rules, fare engine, minimal ambient timers/process.
- `apps/shared/src/data/http.ts` — `HttpClient` port + `NotSupportedByBackendError`/`ConflictError`/`NotFoundError`/`ValidationError`.
- `apps/shared/src/data/ports/index.ts` — all 11 ports (60 methods).
- `apps/shared/src/data/mock/{config.ts,transport.ts,store.ts,scenarios.ts,index.ts}` — `mockConfig.latencyMs`, the single timer, in-memory store + lifecycle engine, 8 scenarios, adapter factory.
- `apps/shared/src/data/api/index.ts` — api adapters over real routes.
- `apps/shared/src/data/createDataLayer.ts`, `apps/shared/src/data/index.ts` — composition root + barrel.
- `apps/shared/src/mocks/fixtures.ts` — Amina Bello + 4 addresses, 24 deliveries, 8 riders, 12 notifications, 6 issues, Abuja distance table, pricing fixture.
- `apps/shared/src/validation/index.ts`, `apps/shared/src/formatters/index.ts`.
- `apps/shared/src/__tests__/{stateMachine,fare,validation,formatters,scenarios}.test.ts` — 68 tests.

**Created — apps (6)**
- `apps/customer/src/data/{httpClient.ts,DataContext.tsx}`, `apps/customer/src/hooks/index.ts`.
- `apps/rider/src/data/{httpClient.ts,DataContext.tsx}`, `apps/rider/src/hooks/index.ts`.

**Created — config (2)**
- `apps/shared/tsconfig.logic.json` (types: [], logic dirs only), `apps/shared/package-lock.json` (from install).

**Modified (10, existing files)**
- `apps/shared/package.json` — drop `@types/react`, TS ~6.0.3, add `vitest`, `test` script, `peerDependenciesMeta` optional, `typecheck`→logic tsconfig.
- `apps/shared/tsconfig.json` — moduleResolution bundler.
- `apps/shared/src/index.ts` — export domain/data/validation/formatters.
- `apps/customer/App.tsx`, `apps/rider/App.tsx` — QueryClientProvider + DataProvider (only).
- `apps/customer/package.json`, `apps/rider/package.json` — `@tanstack/react-query`.
- `apps/customer/package-lock.json`, `apps/rider/package-lock.json` — lockfile updates.
- `docs/frontend/CONTRACT_LEDGER.md` — §F adapter gaps.

**Deleted:** none. **Counts:** created 32, modified 10, deleted 0.

## 4. Dependencies added

- `@tanstack/react-query@^5.104.1` — **Customer** and **Rider** (approved, D1/D2).
- `vitest@^2.1.9` — **devDependency of `apps/shared` only** (approved, D2/D12).
- (typescript aligned to `~6.0.3` in shared; `@types/react` removed.)
No other packages. No `react-native-svg`/maps/state libs.

## 5. Commands run with real output

**Shared install (after fixing peer auto-install)**
```
added 45 packages, and audited 46 packages in 11s   # no react-native in apps/shared/node_modules
> node_modules\.bin\tsc --version  →  Version 6.0.3
> node_modules\.bin\vitest --version  →  vitest/2.1.9 win32-x64 node-v24.19.0
```

**Shared typecheck** — `apps/shared$ npm run typecheck` → `tsc --noEmit -p tsconfig.logic.json` (no output; exit 0)

**Shared tests** — `apps/shared$ npm test`
```
✓ src/__tests__/validation.test.ts (13 tests)
✓ src/__tests__/stateMachine.test.ts (20 tests)
✓ src/__tests__/scenarios.test.ts (17 tests)
✓ src/__tests__/fare.test.ts (10 tests)
✓ src/__tests__/formatters.test.ts (8 tests)
Test Files  5 passed (5)
     Tests  68 passed (68)
```

**Customer typecheck** → `tsc --noEmit` (no output; exit 0)
**Rider typecheck** → `tsc --noEmit` (no output; exit 0)

**Customer Metro bundle**
```
Android Bundled 15548ms index.ts (1486 modules)
Exported: <scratchpad>\cust-p1c
```
**Rider Metro bundle**
```
Android Bundled 14764ms index.ts (1490 modules)
Exported: <scratchpad>\rider-p1c
```

**Admin build** → `✓ 135 modules transformed. ✓ built in 767ms`
**Admin lint** → `Found 2 warnings and 0 errors.` (oxlint ran this session; note: previously blocked by an OS policy — see §7)

**Timer grep** (`setTimeout|new Promise`, excl. node_modules)
```
apps/shared/src/domain/ambient.d.ts:2:declare function setTimeout(...)
apps/shared/src/data/mock/transport.ts:6:  return new Promise((resolve) => setTimeout(resolve, ms));
```
No timers in screens or hooks.

**Git** — branch `fe-phase-1-data-boundary`; status/diff pasted in chat.

## 6. Acceptance checklist

| Criterion | ✓/✗ | Evidence |
|---|---|---|
| Branch is `fe-phase-1-data-boundary` | ✓ | `git branch --show-current` |
| Every port method has mock AND api adapters | ✓ | §"Ports × adapters" table (60/60 mock; 59/60 api, 1 throws by design) |
| Illegal transitions throw Conflict | ✓ | `ConflictError` in store `transition`/`pickup`; test "rejects illegal transition" |
| All 8 scenarios run | ✓ | `it.each(SCENARIOS)` 8 cases + 9 lifecycle tests |
| Tests pass with itemised counts | ✓ | 68 passed / 5 files (§5) |
| Ledger rows added | ✓ | `CONTRACT_LEDGER.md` §F |
| Metro bundles still pass after shared install | ✓ | 1486 / 1490 modules, no duplicate-RN warning |
| Typechecks still pass after shared install | ✓ | customer/rider + shared |

## 7. Deviations and why

1. **Shared install / duplicate react-native.** Plain `npm install` auto-installed `peerDependencies` (react, react-native) into `apps/shared/node_modules` → Metro resolved a duplicate `react-native` (bundle 1422→1906 modules + warning). Instead of reverting the whole install (which would drop vitest/tsc), I added `peerDependenciesMeta {react,react-native: optional}` so npm does not install them; reinstalled clean (**no react-native in shared**, back to 1422 modules). Re-verified no regression.
2. **`NODE_ENV=production` (global) prunes devDependencies.** `npx expo install @tanstack/react-query` failed (`ERESOLVE`, pre-existing `expo-modules-core`↔`react-native-worklets` peer conflict) and a follow-up install pruned the apps' devDeps (TypeScript). Fixed with `npm install --include=dev --legacy-peer-deps` in customer and rider (pre-existing peer conflict, unrelated to this phase). tsc restored to 6.0.3.
3. **react-query installed via `npm install --legacy-peer-deps`** (not `npx expo install`) because of that pre-existing conflict. `expo install` is not applicable to non-Expo packages anyway.
4. **Created `src/hooks` and `src/data` in the apps** though "DO NOT TOUCH" says only App.tsx/package.json — task 9 explicitly requires base hooks + providers; the constraint's intent is "don't touch screens", which I did not.
5. **Admin lint ran and passed this session** (2 warnings, 0 errors); in Phase 0B it was blocked by an OS policy. Recorded honestly.
6. **tsconfig resolution** switched to `bundler` (TS 6 deprecates `node10`).

## 8. Ledger rows added / "Needs decision"

- Added **§F Phase 1 — adapter gaps**: `delivery.deleteAddress` (no backend route) throws `NotSupportedByBackendError`; missing admin/login/settings/history/earnings routes covered by **SC-14**.
- Open "Needs decision" (unchanged from 0B): **SC-2** (cancellation tiers), **SC-5** (OTP 5 vs 10 min), **SC-8** (distance source), **SC-16** (payment amount units — api adapter converts naira→kobo at the boundary, pending), **SC-17** (role-guard gap), admin login.

## 9. Scaffolds still present

**None.** No temporary scaffolds were added; components are real (domain/ports/adapters/fixtures). `SCAFFOLD_REGISTER.md` not required.

## 10. Known issues, risks, open questions

- **Mock only today:** the apps are wired to `EXPO_PUBLIC_DATA_SOURCE` (default `mock`); no screen consumes the hooks yet (screens are Phase 3+).
- **Session not implemented:** the api adapter sends no token (D19/SessionProvider is a later phase); against the real API, `GET /deliveries` would 401.
- **`recipientOtp`** in mock is a fixture code; the backend does not issue/prove one (ledger §E).
- **`NODE_ENV=production` global** keeps making npm prune devDeps — any future install must use `--include=dev`.
- **Pre-existing peer conflict** (`expo-modules-core` ↔ `react-native-worklets 0.12.2`) means installs need `--legacy-peer-deps`.
- **`payment.amount` units** unresolved (SC-16).

## 11. How a human verifies this phase manually

1. `cd apps/shared && npm run typecheck && npm test` → expect no TS output and `68 passed`.
2. `cd apps/customer && npm run typecheck` and same for `apps/rider` → no output.
3. `cd apps/customer && npx expo export --platform android` (and rider) → `Android Bundled … modules` with **no** `react-native` duplicate warning.
4. `cd apps/admin && npm run build` → `✓ built`.
5. Grep `setTimeout|new Promise` under `apps/` → only `mock/transport.ts` (+ its ambient declaration).
6. Inspect the ports × adapters table in this report against `apps/shared/src/data/{ports,api,mock}`.

## 12. Ports × adapters coverage

| Port | Methods | Mock adapter | Api adapter |
|---|---|---|---|
| Auth | 6 | ✓ | ✓ |
| Delivery | 12 | ✓ | ✓ (except `deleteAddress` → `NotSupportedByBackendError`) |
| Pricing | 4 | ✓ | ✓ |
| Payment | 4 | ✓ | ✓ |
| Notification | 1 | ✓ | ✓ |
| Issue | 4 | ✓ | ✓ |
| Kyc | 3 | ✓ | ✓ |
| RiderProfile | 5 | ✓ | ✓ |
| Dispatch | 6 | ✓ | ✓ |
| Execution | 5 | ✓ | ✓ |
| Admin | 10 | ✓ | ✓ |
| **Total** | **60** | **60/60** | **59/60** (1 intentionally throws) |

## 13. Proposed commit message and file list

```
feat(frontend): phase 1 data boundary — typed domain, ports, mock + api adapters

- add shared domain (types, state machine, fare) and ports (60 methods)
- add mock adapter with lifecycle engine, fixtures and 8 scenarios
- add api adapters over real routes (deleteAddress → NotSupportedByBackendError)
- add createDataLayer composition root (EXPO_PUBLIC_DATA_SOURCE / VITE_DATA_SOURCE)
- add validation + formatters (naira, no Intl) and vitest suite (68 tests)
- add react-query + DataProvider/base hooks in customer and rider (App.tsx only)
```
**Files to stage (exact):**
```
apps/shared/package.json
apps/shared/package-lock.json
apps/shared/tsconfig.json
apps/shared/tsconfig.logic.json
apps/shared/src/index.ts
apps/shared/src/domain/       (types.ts, stateMachine.ts, fare.ts, index.ts, ambient.d.ts)
apps/shared/src/data/         (http.ts, ports/, api/, mock/, createDataLayer.ts, index.ts)
apps/shared/src/mocks/fixtures.ts
apps/shared/src/validation/index.ts
apps/shared/src/formatters/index.ts
apps/shared/src/__tests__/    (5 test files)
apps/customer/App.tsx
apps/customer/package.json
apps/customer/package-lock.json
apps/customer/src/data/       (httpClient.ts, DataContext.tsx)
apps/customer/src/hooks/index.ts
apps/rider/App.tsx
apps/rider/package.json
apps/rider/package-lock.json
apps/rider/src/data/          (httpClient.ts, DataContext.tsx)
apps/rider/src/hooks/index.ts
docs/frontend/CONTRACT_LEDGER.md
```
Do **not** stage `.commandcode/settings.json` (tool config, not part of this phase).

STOPPED. Awaiting approval for the next phase.
