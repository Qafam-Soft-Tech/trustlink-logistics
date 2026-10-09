# Phase 17 — Polish and investor QA (final freeze)

Branch: `fe-phase-17-polish-investor-qa`
Scope: final polish, the scripted demo, documentation and the integration hand-off. Backend untouched.

---

## 1. Inspection findings (before changes)

- **The demo had no script and no single reset story.** `DEMO.md` covered the customer app, deep links, the demo menu, the rider demo and the admin console — but there was **no end-to-end script** (customer → dispatch → rider → POD → failure → redelivery), no "real vs mocked" table and no reset table.
- **Resets were partial**: the customer Demo menu had **Reset data** and **Reset session & onboarding**, but the **admin console had no reset** (its `resetData()` action existed in the data context with no UI), and the rider app resets only by relaunching.
- **Nothing proved the script runs.** The Phase 15 sweep proves each screen survives a scenario, but no test walked the *business sequence* (request → pay → dispatch → execute → POD → failure → redelivery).
- **Running that script uncovered two real inconsistencies** (see §7/§8): a mock route admitting assignment of a `REQUESTED` delivery that its state machine then rejects **(SC-42)**, and — from Phase 13 — a failed rider staying `on_trip`, so dispatch must reassign a different online rider.
- **Developer text**: grepped all three apps for `TODO`/`FIXME`/`coming soon`/`arrives in Phase`/`John Doe`/`lorem` — **none**.
- **Undocumented hand-off**: the ledger carried twenty "Needs decision"/open rows with no consolidated, prioritised hand-off document.
- **"Investor definition of done (v1 Part 18)" is not present in the repo** — `docs/frontend/plan/01_PLAN_AMENDMENTS_v2.md` has a phase table only, and `docs/REQUIREMENTS.md` runs §1–§10. The checklist in §6 is therefore **reconstructed from REQUIREMENTS §2–§5 plus this track's phase acceptance criteria**, and that gap is flagged rather than invented.

## 2. Summary (≤5 lines)

- Wrote and **ran** the scripted demo: an automated end-to-end test (`demoScript.test.ts`) executes the exact presenter sequence — request → pay → dispatch → acknowledge → pickup → in-transit → POD (wrong code rejected, correct code accepted) → failure → admin redelivery → delivered, plus the two-failure "returned" ending.
- Fixed the demo blockers the script exposed (pay-then-dispatch ordering, reassigning another online rider) and logged the underlying contract question as **SC-42**.
- Added the missing **one-tap reset** for the console (avatar menu → Reset demo data) and documented resets for all three apps.
- `DEMO.md` now carries the 14-step script, credentials, scenario switches, one-tap resets, real-vs-mocked and known limits; new **`HANDOFF.md`** lists the open decisions first, then the backend gaps.
- Final regression green: 144 shared tests, contrast script, all three apps typecheck/build/bundle — with the Part 18 checklist below (reconstructed, and labelled as such).

## 3. Files created / modified / deleted

**Created (4)**
| Path | Why |
|---|---|
| `apps/shared/src/__tests__/demoScript.test.ts` | The scripted demo as an executable test: happy path, failure → redelivery → delivered, two failures → returned |
| `apps/shared/src/__tests__/demoConstants.ts` | Shared demo value (recipient code) for the script |
| `docs/frontend/HANDOFF.md` | Integration hand-off: open decisions first, real-vs-mocked map, backend gaps, demo prerequisites, next steps |
| `docs/frontend/reports/PHASE-17-REPORT.md` | This report |

**Modified (3)**
| Path | Why |
|---|---|
| `docs/frontend/DEMO.md` | §8 scripted demo (14 steps), §9 real vs mocked, §10 one-tap resets, §11 known limits, §12 hand-off link |
| `apps/admin/src/components/AdminLayout.tsx` | Avatar menu → **Reset demo data** (one-tap reset to the seeded console world) |
| `docs/frontend/CONTRACT_LEDGER.md` | SC-42 (assignment of a `REQUESTED` delivery) |

**Deleted (0)**

## 4. Dependencies added

none.

## 5. Commands run with real output

```
apps/shared$  npm run typecheck       → clean
apps/shared$  npm test                → Test Files 14 passed (14) · Tests 144 passed (144)   (incl. demoScript: 3)
apps/shared$  node scripts/contrast-check.mjs → ALL CHECKS PASSED
apps/customer$ npm run typecheck      → clean
apps/customer$ npx expo export --platform android → Bundled 12419ms (1565 modules) · Exported
apps/rider$    npm run typecheck      → clean
apps/rider$    npx expo export --platform android → Bundled 11982ms (1509 modules) · Exported
apps/admin$    npm run build          → ✓ 87 modules transformed · built in 777ms
apps/admin$    npm run lint           → Found 5 warnings and 0 errors.
audit: developer text (TODO/FIXME/coming soon/arrives in Phase/John Doe/lorem) → no matches
audit (Phase 15–16, re-verified): dead handlers, console.log, hex/rgb literals, dead nav targets → none
```

## 6. Investor definition of done — Part 18 checklist

> The literal "v1 Part 18" text is **not in this repo** (see §1). This checklist is reconstructed from `docs/REQUIREMENTS.md` §2–§5 plus the acceptance criteria the phases were held to; each line cites its evidence.

| # | Definition of done | ✓ | Evidence |
|---|---|---|---|
| 1 | Customer can onboard, request, pay, track and get support | ✓ | `demoScript.test.ts` happy path + Phases 4–11 screens |
| 2 | Rider can onboard, verify KYC, go online, execute a job and prove delivery | ✓ | KYC flow (P12), execution + POD (P13), `demoScript.test.ts` |
| 3 | Failed delivery → admin redelivery → delivered | ✓ | `demoScript.test.ts` failure path; console Dispatch redelivery (P14) |
| 4 | Second failure returns the package | ✓ | `demoScript.test.ts` "two failures return the package to the sender" |
| 5 | Admin can dispatch, reassign, review KYC, manage users/issues, edit pricing, report | ✓ | Console pages (P14) + §11 walk-throughs |
| 6 | R1 scope only (parcels/documents; no food/groceries) | ✓ | Package type is `document|parcel` throughout; no grocery UI |
| 7 | Status-based tracking — no maps, GPS or push | ✓ | No map/GPS/push dependency; "Navigate" opens the device maps app by URL |
| 8 | Money in naira from the real pricing formula | ✓ | `DEFAULT_PRICING` (₦500 base + ₦150/km + ₦100/kg, ₦1,000 minimum); 4 km & 2 kg → ₦1,400 test |
| 9 | Every screen has loading, empty, error and offline states | ✓ | Phase 15 matrix (all scenarios) + Phase 15 report §6 |
| 10 | Dark mode, accessibility and Reduce Motion | ✓ | Phase 16 report: contrast passes, labels/roles in the design system, 1.3× cap, motion honours Reduce Motion |
| 11 | No dead ends, no dead handlers, no developer text | ✓ | Phase 15 audits re-run: no `() => {}`, no `console.log`, no dev copy; every route resolves |
| 12 | Demo is documented and resettable in one tap | ✓ | `DEMO.md` §8–§11; customer Demo menu, console avatar menu, rider relaunch |
| 13 | Full regression is green | ✓ | §5 above |
| 14 | Honest limits and the integration hand-off are written down | ✓ | `DEMO.md` §9/§11, `HANDOFF.md`, ledger SC-2…SC-42 |
| 15 | Physical-device Expo Go run | **pending hardware** | All checks are automated/static here; the device pass is the last human step (steps in `DEMO.md` §8) |

## 7. Script run notes (what running it changed)

| Step | What the script proved / fixed |
|---|---|
| 1–4 | Request → pay → SEARCHING works; the fare uses the real formula and the delivery gets a `TLK-2026-xxx` number |
| 5 | Dispatch assignment only works once the delivery is **SEARCHING** — a `REQUESTED` assignment is rejected by the transition map even though the route admits it → **SC-42** logged; the demo pays first |
| 6–8 | Acknowledge does not change status (SC-4); pickup/in-transit follow the engine; **a wrong POD code is rejected** and the right one completes the delivery |
| 10–11 | First failure → `failed` with one attempt; **admin redelivery** → `searching` with the rider cleared |
| 11–12 | The failed rider stays `on_trip` in the mock, so dispatch reassigns **another online rider** — faithful to manual dispatch, and now written into the script and the demo docs |
| 13 | KYC approve/reject changes the console badges and makes a rider assignable |

## 8. Ledger rows added / "Needs decision"

- **SC-42 (Needs decision)** — can dispatch assign an unpaid `REQUESTED` delivery? The mock route allows it, the state machine forbids it, and the console's own mock allows it. Frontend follows the state machine (pay → SEARCHING → assign).
- Open rows are now consolidated and prioritised in `docs/frontend/HANDOFF.md` §1 (SC-41, SC-17, SC-16, SC-19, SC-2, SC-5, SC-8/SC-20, SC-27, SC-26, SC-30, SC-31, SC-33, SC-35, SC-37, SC-39, SC-22, SC-34, plus SC-42).

## 9. Scaffolds still present

Three, all justified in `SCAFFOLD_REGISTER.md`: the onboarding "Slides" copy (art deferred), the Demo menu (permanent demo tool) and the `__DEV__` Design Gallery (dev tool). No placeholder screens remain in any app.

## 10. Known issues, risks, open questions

- **No physical-device run** was possible in this environment — the script, scenarios, contrast and builds are verified here; the Expo Go pass (`DEMO.md` §8) is the remaining human step.
- **Demo-day caveats**: the ₦ glyph in Inter should be eyeballed on the device (₦ fallback path exists — P16); a failed rider stays `on_trip` until reset, so demo the redelivery with a second rider; the console's data lives only until the page reloads.
- **Open decisions** (SC-41/SC-17 first) must be closed before anything but a demo; see `HANDOFF.md`.
- **The Part 18 text is absent from the repo** — the checklist above is a reconstruction; if v1 Part 18 exists elsewhere it should be reconciled against §6.

## 11. How a human verifies this phase manually

1. `cd apps/shared && npm test` → 144 tests, including the 3-step `demoScript.test.ts` that mirrors the presenter sequence.
2. `cd apps/customer && npx expo start -c`; run the 14-step script in `DEMO.md` §8 on a physical device in Expo Go (customer → admin dispatch → rider execution → POD → failure → redelivery → delivered).
3. Demo the resets: customer Demo menu → **Reset data** / **Reset session & onboarding**; admin avatar menu → **Reset demo data**; relaunch the rider app.
4. Try the optional beats: wrong POD code, a second failure (Returned), the `emptyAccount` and `offline` scenarios.
5. Read `DEMO.md` §11 aloud — those are the limits to disclose, and `HANDOFF.md` for the decisions the team must close.
6. Re-run the full regression (`shared` typecheck/tests/contrast; customer + rider typecheck/export; admin build/lint).

## 12. Proposed commit message and file list

```
chore(frontend): phase 17 polish, scripted demo and hand-off

- shared: demoScript test executes the presenter sequence end to end (request → pay → dispatch →
  acknowledge → pickup → in-transit → POD with wrong-code rejection → failure → redelivery →
  delivered) plus the two-failure "returned" ending
- admin: one-tap "Reset demo data" in the avatar menu (restores the seeded console world)
- docs: DEMO.md script (14 steps), real-vs-mocked, resets and known limits; new HANDOFF.md with the
  open decisions first, then the backend gaps; ledger SC-42 (assignment of a REQUESTED delivery)
- docs: phase report with the reconstructed Part 18 definition-of-done checklist
```

Files to stage (7 — 4 created, 3 modified): as listed in §3.

STOPPED. Awaiting approval for the next phase.
