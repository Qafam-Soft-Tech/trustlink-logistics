# Phase 9 — Terminal states, history, details, receipts

Branch: `fe-phase-9-terminal-history`
Scope: every ending of a delivery plus its history. D15: redelivery is admin-only — the customer has no redelivery action.

---

## 1. Inspection findings (before changes)

- **`HistoryScreen.tsx` does not exist** — deleted in Phase 4 with the other dead legacy screens. History was already served by `DeliveriesScreen` (a plain Active/Completed list, no search). The prompt's "hardcoded" is stale; the list was rewritten here with the required sections + search.
- **Four tracking routes were placeholders** (`Timeline`, `POD`, `Failed`, `Returned`); `Timeline` had **no inbound navigation anywhere** (dead route). `DeliveriesScreen` and `AlertsScreen` both sent every terminal state to `POD`.
- **POD data was never seeded**: `podByDelivery` started empty and only got an entry when a delivery was completed in-session, so the delivered fixtures had no proof. Seeded deterministic PODs for delivered fixtures (mock data).
- **Ports/hooks**: `delivery.list` (client-side filtering is required because there is **no `/deliveries/history` route** — SC-14/SC-24), `delivery.get`, `delivery.proof(id)` (no hook yet → added `useDeliveryProof`). `cancel`/`cancelPreview` are Phase 8.
- **Shared UI reused**: `StatusBadge`, `StatusTimeline`, `PodCard` (photo placeholder + recipient + timestamp), `RouteSummaryCard`, `Card`, `Banner`, `EmptyState`, `ErrorState`, `Skeleton`. `statusLabel` was duplicated in `components/domain.tsx` → moved to the domain and re-used.
- **`RN Share`** is built in → receipt sharing needs no dependency. **No customer redelivery**: `scheduleRedelivery` is admin-only and is not exposed by any customer hook.
- New shared-test surface: `draftFromDelivery` / `weightOptionFor` round-trip into the `CreateDeliveryDto`.

## 2. Summary (≤5 lines)

- Delivered + POD, Delivery unsuccessful (calm copy + "TrustLink will arrange one redelivery"), Returned, and a generic Details screen — all sharing one `DeliveryScreen` shell with loading/empty/error.
- The Deliveries list is rebuilt: **Active / Completed / Cancelled & failed** with **search**, all filtered client-side from `GET /deliveries` (no history route).
- Receipts are generated client-side and shared as text; POD comes from `GET /deliveries/:id/proof`.
- "Send again" prefills the request modal from a past delivery (round-trips to the DTO); the customer can never trigger redelivery.
- Terminal notifications now open **Details**; 118 shared tests pass (8 new); all builds green.

## 3. Files created / modified / deleted

**Created (14)**
| Path | Why |
|---|---|
| `apps/shared/src/domain/receipt.ts` | `receiptText()` — receipt as shareable text |
| `apps/shared/src/__tests__/terminalStates.test.ts` | 8 tests: failure copy, redelivery detection, terminal routing, receipt, send-again round-trip, seeded PODs |
| `apps/customer/src/components/delivery/DeliveryScreen.tsx` | Shared chrome + loading/empty/error gate for terminal/detail screens |
| `apps/customer/src/components/delivery/HeroStatus.tsx` | Large status headline (largest element) with tone |
| `apps/customer/src/components/delivery/DeliveryMetaCard.tsx` | Route/distance/ETA + package/people/fare rows |
| `apps/customer/src/components/delivery/DeliveryReceiptCard.tsx` | Receipt rows + Share action |
| `apps/customer/src/components/delivery/TrackingProgressCard.tsx` | Progress card wrapping `StatusTimeline` |
| `apps/customer/src/components/delivery/SendAgainButton.tsx` | Prefill a new request from a past delivery |
| `apps/customer/src/screens/newdelivery/prefill.ts` | One-shot prefill handoff into the modal |
| `apps/customer/src/screens/tracking/PodScreen.tsx` | Delivered + POD (photo, timestamp, recipient) |
| `apps/customer/src/screens/tracking/FailedScreen.tsx` | Unsuccessful + "one redelivery" notice (no action) |
| `apps/customer/src/screens/tracking/ReturnedScreen.tsx` | Returned-to-sender |
| `apps/customer/src/screens/tracking/DetailsScreen.tsx` | Generic details (cancelled + terminal notifications) |
| `docs/frontend/reports/PHASE-9-REPORT.md` | This report |

**Modified (14)**
| Path | Why |
|---|---|
| `apps/shared/src/domain/tracking.ts` | `DELIVERY_STATUS_LABELS`, `failureReasonCopy`, `REDELIVERY_NOTICE`, `isRedeliveryScheduled`, `terminalScreenFor` |
| `apps/shared/src/domain/newDelivery.ts` | `draftFromDelivery`, `weightOptionFor`, `hydrate` reducer action |
| `apps/shared/src/domain/index.ts` | Export `receipt` |
| `apps/shared/src/components/domain.tsx` | `statusLabel` now delegates to the domain (removed duplicate label map) |
| `apps/shared/src/data/mock/scenarios.ts` | Seed deterministic PODs for delivered fixtures |
| `apps/customer/src/hooks/index.ts` | `useDeliveryProof` |
| `apps/customer/src/navigation/types.ts` | Tracking stack: `Pod`/`Failed`/`Returned`/`Details`; dropped dead `Timeline` |
| `apps/customer/src/navigation/AppNavigator.tsx` | Wire the 4 screens; removed the last placeholders + `makePlaceholder` import |
| `apps/customer/src/screens/DeliveriesScreen.tsx` | Rebuilt: sections + search + per-status routing |
| `apps/customer/src/screens/AlertsScreen.tsx` | Terminal notifications → `Details` |
| `apps/customer/src/screens/newdelivery/DraftContext.tsx` | Seed the draft from a "Send again" prefill |
| `apps/customer/src/screens/tracking/TrackingHomeScreen.tsx` | Added the redelivery-scheduled banner (searching + attempt 2) |
| `docs/frontend/SCAFFOLD_REGISTER.md` | Removed the completed rows; the register is now tiny |
| `docs/frontend/CONTRACT_LEDGER.md` | SC-24 (history) + SC-25 (receipt/POD) |

**Deleted (2)**
| Path | Why |
|---|---|
| `apps/customer/src/components/PlaceholderScreen.tsx` | `makePlaceholder` unreferenced after the last placeholder was replaced |
| `apps/customer/src/components/ScreenScaffold.tsx` | Only used by the placeholder factory |

## 4. Dependencies added

none (RN built-in `Share`).

## 5. Commands run with real output

```
apps/shared$ npm run typecheck             → tsc --noEmit -p tsconfig.logic.json  (clean)
apps/shared$ npm test                      → Test Files 11 passed (11) · Tests 118 passed (118)
apps/shared$ node scripts/contrast-check.mjs → ALL CHECKS PASSED
hex-literal scan (new files)               → (no matches)
apps/customer$ npm run typecheck           → tsc --noEmit  (clean)
apps/customer$ npx expo export --platform android
                                           → Android Bundled 26013ms index.ts (1540 modules) · Exported
apps/rider$    npm run typecheck           → tsc --noEmit  (clean)
apps/rider$    npx expo export --platform android
                                           → Android Bundled 26349ms index.ts (1490 modules) · Exported
apps/admin$    npm run build               → ✓ 135 modules transformed · ✓ built in 1.48s
apps/admin$    npm run lint                → lint unavailable (OS policy): oxlint native binding blocked — not worked around
```
No `duplicate-react-native` warning.

## 6. Acceptance checklist

| Criterion | ✓ | Evidence |
|---|---|---|
| Delivered + POD (photo, timestamp, recipient name) | ✓ | `PodScreen` + shared `PodCard` (photo block, recipient, delivered date) |
| Delivery unsuccessful (reason; "TrustLink will arrange one redelivery") | ✓ | `FailedScreen`: `failureReasonCopy(reason)` + `REDELIVERY_NOTICE` |
| Redelivery scheduled (SEARCHING, attempt-2 banner) | ✓ | `isRedeliveryScheduled` banner in `TrackingHomeScreen` and `DetailsScreen` |
| Returned | ✓ | `ReturnedScreen` |
| Deliveries list: Active / Completed / Cancelled & Failed + search | ✓ | `DeliveriesScreen` sections + `Input` search |
| Listen from `GET /deliveries`, client-side filtering | ✓ | `useDeliveries()` + `useMemo` filter (ledger SC-24: no `/history` route) |
| Delivery details | ✓ | `DetailsScreen` (cancelled + notification landing) |
| Receipt (share) shows paid fare, route and POD | ✓ | `receiptText` test asserts fare `₦1,400`, route and POD recipient |
| "Send again" prefill | ✓ | `SendAgainButton` → `draftFromDelivery` → `prefill` → modal draft (DTO round-trip test) |
| Skeleton / empty / error everywhere | ✓ | `DeliveryScreen` gate; list has loading/empty/no-match/error/offline |
| No customer redelivery action | ✓ | No UI path calls `scheduleRedelivery`; failure copy states TrustLink arranges it |
| Terminal notifications route to Details | ✓ | `AlertsScreen` → `Details` for terminal statuses |
| Failure copy calm, explains next steps | ✓ | See the copy table below |
| Phase 8 screens untouched except terminal routing | ✓ | Only the redelivery banner was added to `TrackingHomeScreen` |
| No dead files left behind | ✓ | `PlaceholderScreen`/`ScreenScaffold` deleted; dead `Timeline` route removed |
| Both themes | ✓ | tokens only (hex scan clean), `useTheme()` |

### Terminal-state copy

| Screen | Headline | Body |
|---|---|---|
| Delivered (`Pod`) | "Delivered" | "This package was delivered successfully." + proof card |
| Unsuccessful (`Failed`) | "Delivery unsuccessful" | reason copy + **"TrustLink will arrange one redelivery at no extra cost. You'll get an alert as soon as a rider is found."** + "You don't need to do anything — redelivery is arranged by TrustLink." |
| Returned | "Returned to sender" | "We couldn't complete this delivery, so the package is on its way back to you." + support follow-up note |
| Redelivery scheduled | "Assigning your rider" | + "Redelivery scheduled" banner (`REDELIVERY_NOTICE`) |
| Cancelled (`Details`) | "Cancelled" | "This delivery was cancelled." |

## 7. Deviations and why

- **Seeded PODs for delivered fixtures** — the mock previously had none, so the POD/receipt screens had no data (mock-data scope).
- **Dropped the dead `Timeline` route** and replaced it with `Details`; also **deleted `PlaceholderScreen.tsx`/`ScreenScaffold.tsx`** since nothing referenced them after the last placeholder was replaced (master rule: no unreferenced files).
- **`statusLabel` de-duplicated** (moved into the domain), which also removed a duplicated label map in the design system.
- **Details is the terminal-notification landing screen**, per the prompt ("terminal notifications route to Details"), while the list routes delivered/failed/returned to their specific screens.
- **List rows show the fare** (not required, but useful context for history).

## 8. Ledger rows added / "Needs decision"

- **SC-24 (Resolved)** — no `/deliveries/history` route → history is client-side filtering of `GET /deliveries`.
- **SC-25 (Resolved)** — no receipt endpoint and recipient OTP is never issued by the backend → receipt generated client-side and shared as text; POD read from `GET /deliveries/:id/proof`.
- No new "Needs decision" rows; SC-22/SC-23 (Phase 8) remain open.

## 9. Scaffolds still present

- Onboarding "Slides" copy (Phase 17); Alerts list (Phase 10); Account (Phase 11); consent links (Phase 11); the permanent `__DEV__` Design Gallery and the Demo menu.
- **All `PlaceholderScreen` scaffolds and the `ScreenScaffold` factory are gone.**

## 10. Known issues, risks, open questions

- **POD photo capture** is still a later phase (no capture/upload endpoint); display is now real (SC-29).
- **History volume**: all deliveries are fetched and filtered client-side; the UI renders incrementally, but server-side pagination is still needed at scale (SC-26).
- **Refunds/returns accounting** has no endpoint — founder decision: keep copy-only (SC-27).
- **Email receipt** opens the device mail client (`mailto:`) — the app itself does not send mail (no email service).
- SC-2 / SC-5 / SC-8 / SC-16 / SC-17 / SC-19 / SC-20 / SC-21 / SC-22 / SC-23 / SC-26 / SC-27 remain open.
- Resolved in the fix-up: PDF/email receipts (SC-28), POD photo display (SC-29), cancelled dedicated screen, frontend pagination.

## 11. How a human verifies this phase manually

1. `cd apps/customer && npx expo start -c`, Expo Go, sign in (`08031234567` / `482913`).
2. **Deliveries** → all three sections render; type `TLK` then an area name in **Search** → the list filters; clear it. With more than 8 rows a **Show more (n)** button appears.
3. Open a **Completed** delivery → Delivered screen with POD card (photo/placeholder, recipient, delivered date), meta, receipt → **Share**, **Email receipt** (opens the mail client prefilled) and **Get PDF receipt** (share sheet with a generated PDF) → **Send again** opens the request modal prefilled → walk it to Review.
4. Open a **failed** delivery → "Delivery unsuccessful", the specific reason, and "TrustLink will arrange one redelivery" — and confirm there is **no** button to request a redelivery.
5. Open a **returned** delivery → "Returned to sender".
6. Open a **cancelled** delivery → dedicated **Cancelled** screen (headline, refund note, meta, receipt, progress).
7. Demo menu → **Advance** a delivery to FAILED, then advance again (redelivery) → tracking shows the **Redelivery scheduled** banner.
8. **Alerts** → tap a terminal notification → lands on **Details**.
9. Demo menu → **offline** → the list shows the offline banner without crashing.

## 12. Proposed commit message and file list

```
feat(customer): phase 9 terminal states, history, details and receipts

- shared: receipt text/email/HTML, failure + redelivery copy, status labels moved to the
  domain, draftFromDelivery + hydrate for "Send again"; seed PODs for delivered fixtures
- customer: Pod / Failed / Returned / Cancelled / Details screens on a shared DeliveryScreen
  shell (hero headline, meta, progress, receipt) — no customer redelivery action
- customer: Deliveries list rebuilt with Active / Completed / Cancelled & failed, search and
  incremental "Show more" rendering
- customer: receipt can be shared as text, emailed via mailto:, or exported as a PDF
  (expo-print + expo-sharing, approved) ; POD renders real photo URLs
- customer: terminal notifications open Details; redelivery-scheduled banner in tracking
- customer: remove the last placeholder screens (PlaceholderScreen, ScreenScaffold)
- docs: ledger SC-24…SC-29, scaffold register trimmed
```

Files to stage (35 — 16 created, 17 modified, 2 deleted):
```
apps/shared/src/domain/receipt.ts                            (created)
apps/shared/src/domain/tracking.ts                           (modified)
apps/shared/src/domain/newDelivery.ts                        (modified)
apps/shared/src/domain/index.ts                              (modified)
apps/shared/src/components/domain.tsx                        (modified)
apps/shared/src/data/mock/scenarios.ts                       (modified)
apps/shared/src/__tests__/terminalStates.test.ts             (created)
apps/customer/src/components/delivery/DeliveryScreen.tsx     (created)
apps/customer/src/components/delivery/HeroStatus.tsx         (created)
apps/customer/src/components/delivery/DeliveryMetaCard.tsx   (created)
apps/customer/src/components/delivery/DeliveryReceiptCard.tsx (created)
apps/customer/src/components/delivery/TrackingProgressCard.tsx (created)
apps/customer/src/components/delivery/SendAgainButton.tsx    (created)
apps/customer/src/components/PlaceholderScreen.tsx           (deleted)
apps/customer/src/components/ScreenScaffold.tsx              (deleted)
apps/customer/src/hooks/index.ts                             (modified)
apps/customer/src/utils/receiptPdf.ts                        (created)
apps/customer/src/navigation/types.ts                        (modified)
apps/customer/src/navigation/AppNavigator.tsx                (modified)
apps/customer/src/screens/DeliveriesScreen.tsx               (modified)
apps/customer/src/screens/AlertsScreen.tsx                   (modified)
apps/customer/src/screens/newdelivery/prefill.ts             (created)
apps/customer/src/screens/newdelivery/DraftContext.tsx       (modified)
apps/customer/src/screens/tracking/TrackingHomeScreen.tsx    (modified)
apps/customer/src/screens/tracking/PodScreen.tsx             (created)
apps/customer/src/screens/tracking/FailedScreen.tsx          (created)
apps/customer/src/screens/tracking/ReturnedScreen.tsx        (created)
apps/customer/src/screens/tracking/CancelledScreen.tsx       (created)
apps/customer/src/screens/tracking/DetailsScreen.tsx         (created)
apps/customer/package.json                                   (modified — expo-print, expo-sharing)
apps/customer/package-lock.json                              (modified)
apps/customer/app.json                                       (modified — expo-sharing plugin)
docs/frontend/SCAFFOLD_REGISTER.md                           (modified)
docs/frontend/CONTRACT_LEDGER.md                             (modified)
docs/frontend/reports/PHASE-9-REPORT.md                      (created)
```

## 13. Post-review fix-up (founder-approved)

| Ask | Outcome |
|---|---|
| Receipt: PDF **and** email | **Both.** Email = `mailto:` handoff prefilled from the profile (`receiptMailto`); PDF = `expo-print` + `expo-sharing` (approved + installed) rendering `receiptHtml()` with theme colours → "Get PDF receipt" opens the share sheet. |
| POD photo placeholder | **Fixed.** `PodCard` renders any loadable `photoUrl` (`http/https/file/data/content`) with an `onError` fallback; the PDF embeds the photo only for `https:`/`data:` URLs. Capture is still a later phase (SC-29). |
| History not paginated | **Frontend pagination shipped** (8 rows + "Show more", reset on search). True server-side pagination needs a route on the frozen backend → SC-26 stays open. |
| Refunds/returns copy-only | **Founder decision: keep copy-only** (no endpoint exists); SC-27 tracked as Needs decision. |
| Cancelled → Details | **Dedicated `CancelledScreen`** (route `Cancelled`); the list routes cancelled deliveries there and Details links to it. |

Fix-up validation:
```
apps/shared$ npm test                     → Test Files 11 passed (11) · Tests 120 passed (120)
apps/shared$ node scripts/contrast-check.mjs → ALL CHECKS PASSED
hex-literal scan (new/changed files)      → (no matches)
apps/customer$ npm run typecheck          → tsc --noEmit  (clean)
apps/customer$ npx expo install --check   → Dependencies are up to date
apps/customer$ npx expo export --platform android → Android Bundled 28894ms index.ts (1548 modules) · Exported
apps/rider$    npx expo export --platform android → Android Bundled 26594ms index.ts (1490 modules) · Exported
apps/admin$    npm run build              → ✓ 135 modules transformed · ✓ built in 945ms
apps/admin$    npm run lint               → lint unavailable (OS policy)
```

STOPPED. Awaiting approval for the next phase.
