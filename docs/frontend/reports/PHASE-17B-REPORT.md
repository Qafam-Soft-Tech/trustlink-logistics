# Phase 17B — Demo honesty and rider-status fix

Branch: `fe-phase-17b-demo-fixes` (from `fe-phase-17-polish-investor-qa`)
Scope: fix-up after review. Backend untouched; no new dependencies.

---

## 1. Inspection findings (before changes)

- **The Phase 17 demo script claimed cross-app data that does not exist.** It told the presenter to create a delivery in the customer app and then “the new delivery under **Unassigned**” in the console, and that the customer’s timeline “follows in real time” from the rider’s steps. In reality **each app owns a separate in-memory mock** (customer/rider share `createDataLayer`, but each process builds its own store; the console has its own copy entirely), so none of that can happen.
- **The mock left riders stuck `on_trip`.** `MockStore.complete`, `reportFailure` and `cancel` never returned the rider to `online`, so a rider who finished one job could not be assigned again and `PUT /dispatch/status` / `/rider/profile/status` would reject them. Phase 17 worked around this in the script with “assign another online rider”, which hid the real gap (and matches a genuine backend defect).
- **The data source silently defaulted to mock**: `resolveDataSource()` returned `'mock'` for anything that was not `'api'`, including an unset variable — so a production build could ship as a demo without saying so. Nothing in the UI indicated mock data (only the auth screens’ demo-OTP chip hinted at it).
- **SC-16 was still open** although the adapter converts naira→kobo exactly once and the backend DTO documents kobo (Paystack consumes kobo; Flutterwave divides by 100 in its service). `HANDOFF.md` also lacked a dependency list (it did not reflect `expo-print`/`expo-sharing`).
- **Fixtures contain riders with several active jobs** — which matters for the release rule and for the automated script (see §7).
- Everything else from Phase 17 (test suite, contrast, bundles, admin build) was green.

## 2. Summary (≤5 lines)

- `DEMO.md` §8 is now **three independent chapters** (Customer / Rider / Admin), each from its own seeded world, with an explicit “the apps do not share live data” callout, no cross-app claims, matching seed tracking numbers and a 5-minute cut-down.
- Riders are **freed on job end** in the shared mock *and* the admin's copy (`on_trip → online`, unless they still have another active delivery), with **three new tests** (the count reconciliation is in §7); the script no longer needs a second-rider workaround.
- Added **SC-43** (high-priority backend bug) to the ledger and to `HANDOFF.md` §1/§3, closed **SC-16** as verified kobo, and added the hand-off's dependency list.
- Added a visible gold **Demo data** strip on every screen in all three apps while the source is mock, and made the data source **required** in non-development builds with **no `NODE_ENV` check**: mobile decides development with React Native's **`__DEV__`** (passed into `createDataLayer` from each app's `DataContext`), the console with Vite's **`import.meta.env.PROD`**.
- **151** shared tests pass (4 new in `dataSource.test.ts`: unset+dev → mock, unset+non-dev → throws, unknown → throws); contrast passes; customer/rider typecheck + bundles clean; admin build clean, lint 5 warnings / 0 errors.

## 3. Files created / modified / deleted

**Created (4)**
| Path | Why |
|---|---|
| `apps/shared/src/components/DemoModeBanner.tsx` | App-wide “Demo data” indicator (mock source only) |
| `apps/shared/src/__tests__/dataSource.test.ts` | Proves the data-source rule: unset + dev → mock, unset + non-dev → throws, unknown value → throws |
| `apps/admin/src/data/dataSource.ts` | Console data-source guard (explicit `VITE_DATA_SOURCE`, development = `import.meta.env.PROD`) |
| `docs/frontend/reports/PHASE-17B-REPORT.md` | This report |

**Modified (13)**
| Path | Why |
|---|---|
| `docs/frontend/DEMO.md` | §8 rewritten as three chapters + cut-down + “no shared data”; §11 limits updated (shared-data and rider-release caveats) |
| `apps/shared/src/data/mock/store.ts` | `releaseRiderById` + calls from complete / reportFailure / cancel / scheduleRedelivery |
| `apps/admin/src/data/AdminDataContext.tsx` | Mirrored `releaseRider` in the console's copy (schedule redelivery frees the previous rider) |
| `apps/shared/src/__tests__/demoScript.test.ts` | Single-process note; second-rider workaround removed; rider-release tests added |
| `apps/shared/src/data/createDataLayer.ts` | `resolveDataSource(explicit, isDev)`: no `NODE_ENV` check, throws when unset outside development, rejects unknown values |
| `apps/customer/src/data/DataContext.tsx`, `apps/rider/src/data/DataContext.tsx` | Pass `isDev: __DEV__` into `createDataLayer` (React Native's dev flag, never `NODE_ENV`) |
| `apps/shared/src/components/index.ts` | Export `DemoModeBanner` |
| `apps/customer/App.tsx`, `apps/rider/App.tsx` | Render `<DemoModeBanner source={source} />` above the navigator |
| `apps/admin/src/components/AdminLayout.tsx` | `DemoBanner` strip above the console header |
| `docs/frontend/CONTRACT_LEDGER.md` | **SC-43** added; **SC-16** closed (verified kobo); §D list updated |
| `docs/frontend/HANDOFF.md` | SC-43 in §1/§3; SC-16 removed from the open list; dependency list (§6) + data-source rule (§7) added |

**Deleted (0)**

**Total: 17 (4 created, 13 modified)** — the required post-review fix added three files to the original 14: `apps/shared/src/__tests__/dataSource.test.ts` and the two mobile `DataContext.tsx` files.

## 4. Dependencies added

none.

## 5. Commands run with real output

```
apps/shared$  npm run typecheck       → clean
apps/shared$  npm test                → Test Files 15 passed (15) · Tests 151 passed (151)
                                        (demoScript: 6 · dataSource: 4)
apps/shared$  node scripts/contrast-check.mjs → ALL CHECKS PASSED
apps/customer$ npx tsc --noEmit -p .  → clean
apps/customer$ npx expo export --platform android → Bundled 13186ms (1566 modules) · Exported
apps/rider$    npx tsc --noEmit -p .  → clean
apps/rider$    npx expo export --platform android → Bundled 12332ms (1510 modules) · Exported
apps/admin$    npm run build          → ✓ 88 modules transformed · built in 532ms
apps/admin$    npm run lint           → Found 5 warnings and 0 errors.
```

## 6. Acceptance checklist

| Criterion | ✓ | Evidence |
|---|---|---|
| DEMO.md §8 is three independent chapters from each app's own seed | ✓ | §8 Chapter A/B/C tables; each chapter states its own seeded start |
| No cross-app claims remain | ✓ | “follows in real time”, “the new delivery under Unassigned” and similar lines are gone; a callout states the apps do not share live data; §11 repeats it |
| Customer chapter uses the Demo menu **Advance** | ✓ | Chapter A step 5 |
| Rider chapter uses seeded assigned/in-transit jobs | ✓ | Chapter B start: `TLK-2026-005` assigned, `TLK-2026-008` picked up |
| Admin chapter uses seeded unassigned/failed deliveries | ✓ | Chapter C start: `TLK-2026-003` searching, `TLK-2026-011` failed |
| 5-minute cut-down added | ✓ | §8 “5-minute cut-down (one screen per app)” |
| Consistent seed names across apps | ✓ | `TLK-2026-003/005/008/011` referenced in all three chapters |
| Riders freed in the shared mock on delivered/failed/returned (and cancelled) | ✓ | `releaseRiderById` + calls; tests “frees the rider when their delivery is completed” / “…when a job fails” |
| …and in the admin's copy | ✓ | `releaseRider` in `AdminDataContext` (schedule redelivery frees the previous rider) |
| Script no longer needs a second-rider workaround | ✓ | `demoScript.test.ts` reassigns `rider-1` after the failure; the tests pass |
| Tests added + single-process disclaimer | ✓ | 6 tests in `demoScript.test.ts`; header comment: “runs in a single process … does NOT prove cross-app data sharing” |
| SC-43 added to the ledger, §1 and §3 of HANDOFF | ✓ | Ledger row + §D item 22; `HANDOFF.md` §1 (first row) and §3 item 11 |
| SC-16 closed as verified kobo | ✓ | Ledger row + §D item 4 + `HANDOFF.md` §5 item 2 |
| HANDOFF dependency list updated (expo-print, expo-sharing included) | ✓ | `HANDOFF.md` §6 |
| Visible “Demo data” indicator when the source is mock | ✓ | `DemoModeBanner` in both mobile Roots + console `DemoBanner`; a11y role `alert` |
| Data source required (no silent default) for non-dev builds | ✓ | `resolveDataSource(explicit, isDev)` throws when unset and `isDev` is false; `readAdminDataSource` throws when `import.meta.env.PROD`; covered by `dataSource.test.ts` (4 tests) |
| Development decided by `__DEV__` / `import.meta.env.PROD` — never `NODE_ENV` | ✓ | `createDataLayer({ …, isDev: __DEV__ })` in both mobile `DataContext`s; the console uses `import.meta.env.PROD`. Shared contains **no** `process.env.NODE_ENV` check, so `npx expo start` cannot throw on this machine (global `NODE_ENV=production`) |
| No backend changes, no new dependencies | ✓ | Diff touches only frontend apps + docs |

## 7. Deviations and why

### Required post-review fix — which expression decides “development”

| Where | Expression that decides “development” | Why |
|---|---|---|
| Mobile (shared) | `DataLayerOptions.isDev`, supplied by the app as React Native's **`__DEV__`** → `createDataLayer({ source, httpClient, isDev: __DEV__ })` in `apps/customer/src/data/DataContext.tsx` and `apps/rider/src/data/DataContext.tsx` | `__DEV__` is `true` in Expo Go and `false` in a release build. Shared stays pure TS: it no longer reads any global or `process.env`. |
| Mobile (shared, default) | `resolveDataSource(explicit, isDev = false)` — an omitted `isDev` is treated as **non-development** | Fail-fast: a caller that forgets to wire the flag cannot silently ship a mock build. |
| Admin (Vite) | `import.meta.env.PROD` in `apps/admin/src/data/dataSource.ts` | Vite's own build flag; `npm run dev` sets `PROD=false`, a build sets `PROD=true`. |
| **Removed** | ~~`process.env.NODE_ENV !== 'production'`~~ | This machine exports `NODE_ENV=production` globally, so that check would have made `npx expo start` throw in Expo Go. There is **no `NODE_ENV` reference left anywhere in the data-source path**. |

The production fail-fast is unchanged: with the flag non-dev and no explicit source, both guards throw a clear message naming `EXPO_PUBLIC_DATA_SOURCE` / `VITE_DATA_SOURCE`; unknown values throw in any mode (`dataSource.test.ts`, 4 tests).

### Test-count reconciliation (“five new tests” vs +3 in the total)

- Phase 17 shipped **144** tests; `demoScript.test.ts` held **3**.
- The first draft of this fix-up added **five** rider-release tests (completed / failed / cancelled / two “still busy” variants). Three of them failed *correctly*: the fixture world gives `rider-1` and `rider-2` **other active jobs**, so the release rule must not free them, and one test read the rider profile from the customer's session.
- The final suite deliberately keeps **three** release tests (freed on completion + can be reassigned, freed on failure, and kept on a trip while another job is active) → `demoScript.test.ts` = 3 + 3 = **6**, i.e. **+3** on the previous total.
- `dataSource.test.ts` adds **4** more, so the suite went 144 → **151** (15 files).

### Other deviations

- **The release rule is conditional by design.** A rider stays `on_trip` while another of their deliveries is active. The tests now use the `emptyAccount` scenario for the “freed” cases (no interference) and a fixture rider for the “still busy” case.
- **Mock-side fix only** — the backend still needs SC-43; the frontend cannot change backend behaviour, so it is documented and prioritised first.
- **No cross-app sync added** — the prompt asked for honesty, not shared state.
- **Console source is mock-only**: `VITE_DATA_SOURCE=api` throws because no admin API client exists yet.

## 8. Ledger rows added / "Needs decision"

- **SC-43 (Needs decision, high priority)** — the backend must free a rider (`ON_TRIP → ONLINE`) when their delivery becomes delivered/failed/returned; until then a rider is unusable after one job. Mock + console copy implement the intended behaviour; `HANDOFF.md` §1/§3 list it first.
- **SC-16 (Resolved — verified kobo)** — the adapter converts naira→kobo exactly once at the api boundary; the backend DTO documents kobo, Paystack consumes kobo and Flutterwave divides by 100 in its service.

## 9. Scaffolds still present

Unchanged: onboarding “Slides” copy, Demo menu, `__DEV__` Design Gallery — all justified in `SCAFFOLD_REGISTER.md`.

## 10. Known issues, risks, open questions

- **The demo is three demos.** A presenter must switch apps (and reset each) rather than watching one delivery travel across them; this is inherent to the mock-only build and now stated plainly.
- **Rider release exists only in the mock** (SC-43) — a real rider would get stuck after their first job.
- **The console has no API mode**; `VITE_DATA_SOURCE=api` throws by design.
- **Production builds now fail fast without a data-source flag** — intentional, but any deploy script must set `EXPO_PUBLIC_DATA_SOURCE` / `VITE_DATA_SOURCE`.
- Open decisions: SC-43, SC-41, SC-17, SC-19, SC-2, SC-5, SC-8/SC-20, SC-22, SC-26, SC-27, SC-30, SC-31, SC-33, SC-34, SC-35, SC-37, SC-39, SC-42.

## 11. How a human verifies this phase manually

1. `cd apps/shared && npm test` → 147 tests; `demoScript.test.ts` (6) covers the script and the rider-release rule.
2. Start any app and confirm the gold **Demo data** strip is visible on every screen; set `EXPO_PUBLIC_DATA_SOURCE=api` and confirm the strip disappears (and the app attempts the API).
3. Unset the variable in a **production** run (`NODE_ENV=production npx expo export`) → startup throws “Data source is required in production builds…”. The console behaves the same for `VITE_DATA_SOURCE`.
4. Walk `DEMO.md` §8 chapters A, B and C (or the 5-minute cut-down) and confirm each stays inside its own app.
5. In the rider app, complete `TLK-2026-005` and confirm the rider returns to **Online** and can be assigned again (reset, then repeat without the second-rider trick).
6. In the console, **Schedule redelivery** on `TLK-2026-011` and watch its rider leave `on_trip`.
7. Re-run the full regression (shared tests/contrast; customer + rider typecheck/export; admin build/lint).

## 12. Proposed commit message and file list

```
fix(frontend): phase 17b demo honesty and rider release

- demo: DEMO.md §8 rewritten as three independent chapters (customer / rider / admin) from each
  app's own seed, with a "the apps do not share live data" callout, no cross-app claims, matching
  seed tracking numbers and a 5-minute cut-down; §11 limits updated
- mock: free the rider (on_trip → online) when a delivery is delivered/failed/returned/cancelled,
  unless they still have an active job — applied in the shared mock and the admin's copy, with tests
  (the script no longer needs a second-rider workaround)
- data source: required in non-development builds (EXPO_PUBLIC_DATA_SOURCE / VITE_DATA_SOURCE, no
  silent default) and a visible "Demo data" strip while the source is mock, in all three apps
- ledger/handoff: SC-43 (backend never frees the rider — high priority) added to the ledger,
  HANDOFF §1 and §3; SC-16 closed as verified kobo; dependency list + data-source rule documented
```

Files to stage (17 — 4 created, 13 modified): as listed in §3 (the required fix added `dataSource.test.ts` and the two mobile `DataContext.tsx` files to the original 14).

STOPPED. Awaiting approval for the next phase.
