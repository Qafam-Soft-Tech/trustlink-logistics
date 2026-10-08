# Phase 8 — Status tracking and cancellation

Branch: `fe-phase-8-status-tracking`
Scope: R1 status-based tracking (SC-1) with manual dispatch, plus the cancellation flow.

---

## 1. Inspection findings (before changes)

- **`TrackingScreen.tsx` does not exist** — deleted in Phase 4 as a dead legacy screen. The prompt's "hardcoded and crashes on empty data" is stale. Current state: **6 `makePlaceholder` routes** (`TrackingHome`, `Timeline`, `POD`, `Failed`, `Returned`, `CancelFlow`); the two in this phase's scope (`TrackingHome`, `CancelFlow`) are replaced.
- **Existing navigation already lands here**: `HomeScreen.openDelivery` and `DeliveriesScreen` navigate to `Tracking → TrackingHome`; **`AlertsScreen` already routes notification taps** (active → `TrackingHome`, terminal → `POD`). Deep links `trustlink://delivery/:deliveryId` are configured (Phase 4B/5). No navigation changes were needed for taps/deep links.
- **`TrackByNumberScreen` had a dead hop**: the successful-lookup card navigated to `HomeFeed` instead of the delivery, and the idle state showed an `ErrorState`. Fixed here (tracking scope).
- **Ports/hooks sufficient**: `delivery.get` (polled by `useDelivery` at `refetchInterval: 10000` — within the ≤10 s requirement), `cancelPreview(id)` → `{canCancel, fee, refundAmount, reason}`, `cancel(id)` → `{cancelled, fee, refundAmount}`. Fee maths lives in `domain/stateMachine.computeCancellation` (matches the SC-2/D14 fee table: 0 / 0 / 50% / 75% / full).
- **Shared UI already available**: `StatusBadge`, `StatusTimeline`, `RouteSummaryCard`, `Avatar`, `Card`, `Button`, `Badge`, `Dialog`, `Banner`, `TextArea`, `Skeleton`, `EmptyState`, `ErrorState`, `SuccessState`. `estimateDistanceKm`/`estimateEtaMinutes` (Phase 7) supply distance/ETA.
- **Contract gap found**: the rider card needs the rider's **vehicle type**, but `Delivery` embeds only the rider `User` (`RiderProfile` holds the vehicle) → demo-only `Delivery.riderVehicleType` + ledger **SC-22**.
- **Mock already exposes what the demo needs**: `advanceDelivery` (Demo menu "Advance"), the `assigningDelayed` scenario, and fixture SEARCHING deliveries dated in the past (so the delayed state is visible). No scenario changes needed.
- **Cancellation reason** has no contract field (`POST /notifications/cancel/:deliveryId` takes no body) → ledger **SC-23**.
- No new dependencies.

## 2. Summary (≤5 lines)

- TrackingHome is now the real hero screen: status headline as the largest element, status badge, timeline from DeliveryEvents, route summary (areas + distance + ETA), fare, and a ≤10 s refresh with a "last updated" stale indicator.
- Variant handling for requested / searching / searching-delayed / assigned / picked_up / in_transit, plus rider card (name, avatar, vehicle type, call), reassignment notice, recipient-code note, and share (tracking number as text only — no link).
- Cancel flow: preview-driven fee/refund, optional reason, confirm dialog, success, and a not-cancellable state; fees come straight from the published table.
- Empty/not-found/offline data never crashes; `TrackByNumber` now opens the delivery's tracking screen.
- 110 shared tests pass (5 new); customer/rider typecheck + bundle clean; admin build clean.

## 3. Files created / modified / deleted

**Created (6)**
| Path | Why |
|---|---|
| `apps/shared/src/domain/tracking.ts` | Pure tracking model: headlines, `isAssigningDelayed`, `wasReassigned`, `trackingShareText`, `lastStatusChangeAt`, `RECIPIENT_CODE_NOTE` |
| `apps/shared/src/__tests__/tracking.test.ts` | 5 tests: headlines, delay window, reassignment, share text (no URL), mock rider decoration |
| `apps/customer/src/hooks/useLastUpdated.ts` | Dedicated 1 s ticking hook for the stale indicator |
| `apps/customer/src/screens/tracking/TrackingHomeScreen.tsx` | The status hero screen (all variants) |
| `apps/customer/src/screens/tracking/CancelFlowScreen.tsx` | Cancel preview → reason → confirm → success / not-cancellable |
| `docs/frontend/reports/PHASE-8-REPORT.md` | This report |

**Modified (7)**
| Path | Why |
|---|---|
| `apps/shared/src/domain/types.ts` | Demo-only `Delivery.riderVehicleType` (SC-22) |
| `apps/shared/src/domain/index.ts` | Export `tracking` |
| `apps/shared/src/data/mock/store.ts` | `withRider()` decorates deliveries on read with the rider's vehicle type |
| `apps/customer/src/navigation/AppNavigator.tsx` | Wire `TrackingHomeScreen` + `CancelFlowScreen`; drop both placeholders |
| `apps/customer/src/screens/TrackByNumberScreen.tsx` | Result card opens Tracking; idle state is a hint, not an error |
| `docs/frontend/SCAFFOLD_REGISTER.md` | Tracking row now lists only the Phase 9 terminal screens; Track-by-number row removed |
| `docs/frontend/CONTRACT_LEDGER.md` | SC-22, SC-23 (+ Needs-decision list) |

**Deleted (0)** — no legacy tracking screen remained.

## 4. Dependencies added

none.

## 5. Commands run with real output

```
apps/shared$ npm run typecheck             → tsc --noEmit -p tsconfig.logic.json  (clean)
apps/shared$ npm test                      → Test Files 10 passed (10) · Tests 110 passed (110)
apps/shared$ node scripts/contrast-check.mjs → ALL CHECKS PASSED
hex-literal scan (new files)               → (no matches)
apps/customer$ npm run typecheck           → tsc --noEmit  (clean)
apps/customer$ npx expo export --platform android
                                           → Android Bundled 22202ms index.ts (1530 modules) · Exported
apps/rider$    npm run typecheck           → tsc --noEmit  (clean)
apps/rider$    npx expo export --platform android
                                           → Android Bundled 23240ms index.ts (1489 modules) · Exported
apps/admin$    npm run build               → ✓ 135 modules transformed · ✓ built in 914ms
apps/admin$    npm run lint                → lint unavailable (OS policy): oxlint native binding blocked — not worked around
```
No `duplicate-react-native` warning.

## 6. Acceptance checklist

| Criterion | ✓ | Evidence |
|---|---|---|
| Variants for REQUESTED / SEARCHING / ASSIGNED / PICKED_UP / IN_TRANSIT | ✓ | `trackingHeadline()` + the per-status matrix below |
| Status headline is the largest element | ✓ | `Text variant="h1"` headline at the top of the scroll body |
| StatusTimeline from DeliveryEvents | ✓ | `StatusTimeline events={data.events}` (+ empty fallback) |
| RouteSummaryCard (areas, distance, ETA) | ✓ | `estimateDistanceKm` + `estimateEtaMinutes` |
| Rider card from ASSIGNED (name, photo, vehicle type) | ✓ | `Avatar` initials + name + `Badge` vehicle type (SC-22) |
| Call rider | ✓ | `Linking.openURL('tel:…')`, disabled without a phone |
| Share tracking (text only, no link) | ✓ | `Share.share({ message: trackingShareText(d) })`; test asserts no `http` |
| Recipient-code note | ✓ | code card + `RECIPIENT_CODE_NOTE` |
| Assigning-delayed state | ✓ | `isAssigningDelayed` (5 min) → warning banner + free-cancel path |
| Rider-reassigned notice | ✓ | `wasReassigned` (2nd `assigned` event) → info banner |
| Polling ≤10 s + "last updated" stale indicator | ✓ | `useDelivery` `refetchInterval: 10000`; `useLastUpdated` + warning colour past 30 s |
| Cancel preview drives the UI | ✓ | `useCancelPreview` → fee/refund/reason/canCancel |
| Optional reason, confirm, success, not-cancellable | ✓ | `TextArea` + `Dialog` + `SuccessState` + `EmptyState` (reason) |
| No crash on empty / not-found data | ✓ | no `deliveryId` → EmptyState; `NotFoundError` → EmptyState; else `ErrorState` |
| Both themes | ✓ | tokens only (hex scan clean), `useTheme()` |
| No map / SVG / location; no timers in screens | ✓ | polling via react-query, clock via `useLastUpdated` |
| Demo menu advances status; scenarios happy/assigningDelayed | ✓ | `advanceDelivery` unchanged; fixtures + scenario exercise both |
| Terminal-state screens untouched | ✓ | `Timeline`/`POD`/`Failed`/`Returned` still placeholders (Phase 9) |

### Status × UI-element matrix

| UI element | requested | searching | searching (delayed) | assigned | picked_up | in_transit |
|---|---|---|---|---|---|---|
| Headline (h1) | "Request received" | "Assigning your rider" | "Assigning your rider" | "Rider on the way" | "Package picked up" | "In transit" |
| Status badge | Requested | Searching | Searching | Assigned | Picked up | In transit |
| Stale indicator | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Delayed banner | — | — | **✓** (warning, free cancel) | — | — | — |
| Reassigned banner | — | — | if 2nd assign | ✓ if reassigned | ✓ if reassigned | ✓ if reassigned |
| Rider card | — | — | — | **✓** | **✓** | **✓** |
| Call rider | — | — | — | ✓ | ✓ | ✓ |
| Recipient code | — | — | — | ✓ | ✓ | ✓ |
| Route + distance + ETA | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Timeline | ✓ (1) | ✓ (2) | ✓ | ✓ | ✓ | ✓ |
| Fare | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Share | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cancel button (fee) | ✓ free (₦0, full refund) | ✓ free (₦0, full refund) | ✓ free | ✓ 50 % of fare | ✓ 75 % of fare | ✓ full fare (no refund) |

Terminal statuses (`delivered`, `failed`, `returned`, `cancelled`) render headline + timeline and the not-cancellable state; their dedicated screens are Phase 9.

### Cancel-fee verification (fee table = `domain/stateMachine`, SC-2/D14)

| Status | canCancel | fee | refund |
|---|---|---|---|
| requested / searching | true | 0 | full fare |
| assigned | true | 50 % of fare | 50 % |
| picked_up | true | 75 % of fare | 25 % |
| in_transit | true | full fare | 0 |
| delivered / failed / returned / cancelled | false | 0 | 0 (reason shown) |

## 7. Deviations and why

- **`Delivery.riderVehicleType` is a demo-only field** (like the existing `recipientCode`) because the contract has no vehicle on the delivery; the api adapter never sets it, and the card hides the badge when absent → **SC-22**.
- **Cancellation reason is collected but not sent** — the backend route accepts no body → **SC-23**.
- **Share is text-only by design** (the tracking endpoint requires a JWT, SC-15), so no recipient-openable link is generated.
- **Assigning-delayed is time-based** (5 min since the last status change): fixture SEARCHING deliveries are dated in the past so the state is visible; a freshly-paid delivery shows the normal "Assigning your rider" state.
- **Fixed `TrackByNumberScreen`** (dead hop to HomeFeed, idle ErrorState) since it is part of "taps land here" for this phase.

## 8. Ledger rows added / "Needs decision"

- **SC-22 (Needs decision)** — rider vehicle type is not on the delivery payload (demo-only field).
- **SC-23 (Needs decision)** — cancellation reason is collected but the API accepts no body.
- The status-based tracking decision (SC-1 / D6, no map) is already recorded and unchanged.

## 9. Scaffolds still present

- `Tracking → Timeline / POD / Failed / Returned` — `PlaceholderScreen` (Phase 9).
- `ScreenScaffold` component (used by those placeholders).
- Onboarding "Slides" copy (Phase 17); Deliveries/Alerts/Account real shells (Phases 9–11); consent links (Phase 11).
- `TrackingHome` / `CancelFlow` and the Track-by-number rows were removed from `SCAFFOLD_REGISTER.md`.

## 10. Known issues, risks, open questions

- **Manual dispatch can stall**: the delayed state informs rather than progressing; a rider only appears when dispatch assigns (SC-12).
- **Polling is 10 s** — the stale indicator turns amber past 30 s but there is no push fallback (SC-13).
- **Cancel is available through IN_TRANSIT** per the fee table (SC-2) even though `FR-C11` wording differs — pending the founder decision.
- **Cancellation frees the delivery but the refund is accounting-only** in the mock (no payment refund flow).
- **Reassignment detection relies on duplicate `assigned` events**; if the backend ever coalesces events this notice stops firing (SC-4 area).
- SC-2 / SC-5 / SC-8 / SC-16 / SC-17 / SC-19 / SC-20 / SC-21 / SC-22 / SC-23 remain open.

## 11. How a human verifies this phase manually

1. `cd apps/customer && npx expo start -c`, Expo Go, sign in (`08031234567` / `482913`).
2. **Deliveries** → open a *Searching* delivery → "Assigning your rider", timeline, delayed banner (fixture is old), **Cancel delivery** → fee ₦0 / full refund → confirm → success.
3. Demo menu → **Advance** on a delivery (REQUESTED → SEARCHING → ASSIGNED …) and reopen tracking after each step; note the headline changes and the rider card appears at *Assigned* (name, vehicle, **Call rider**).
4. On an *Assigned* delivery, open **Cancel delivery** → fee = 50 % of fare, refund = 50 %; *Picked up* → 75 %; *In transit* → full fare, ₦0 refund.
5. On a *Delivered*/terminal delivery, tracking shows the headline + timeline and **no cancel button**.
6. Open a delivery that was never assigned and press **Share** → shares only the tracking number text (no link).
7. **Alerts** tab → tap a notification → lands on tracking; deep link `trustlink://delivery/del-005` (dev build) → same screen.
8. Kill/reopen the app offline (Demo menu → **offline**) → tracking shows the offline banner and last known status, no crash.

## 12. Proposed commit message and file list

```
feat(customer): phase 8 status tracking and cancellation

- shared: domain tracking model (headlines, assigning-delayed, reassignment, share
  text, recipient-code note) + demo-only Delivery.riderVehicleType; 5 vitest tests
- shared mock: decorate deliveries with the rider's vehicle type on read
- customer: TrackingHomeScreen — status variants, timeline, route/ETA, rider card with
  call, recipient code, share (text only), delayed + reassigned states, ≤10s polling
  with a last-updated stale indicator, cancel entry point
- customer: CancelFlowScreen — preview-driven fee/refund, optional reason, confirm,
  success and not-cancellable states
- customer: fix TrackByNumber result to open Tracking (was a dead hop)
- docs: ledger SC-22/SC-23, scaffold register updated
```

Files to stage (13):
```
apps/shared/src/domain/tracking.ts
apps/shared/src/domain/types.ts
apps/shared/src/domain/index.ts
apps/shared/src/data/mock/store.ts
apps/shared/src/__tests__/tracking.test.ts
apps/customer/src/hooks/useLastUpdated.ts
apps/customer/src/screens/tracking/TrackingHomeScreen.tsx
apps/customer/src/screens/tracking/CancelFlowScreen.tsx
apps/customer/src/screens/TrackByNumberScreen.tsx
apps/customer/src/navigation/AppNavigator.tsx
docs/frontend/SCAFFOLD_REGISTER.md
docs/frontend/CONTRACT_LEDGER.md
docs/frontend/reports/PHASE-8-REPORT.md
```

STOPPED. Awaiting approval for the next phase.
