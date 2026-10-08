# Phase 7 — Fare and payment

Branch: `fe-phase-7-fare-payment`
Scope: FR-C05 (quote before creating), FR-C06 (pay before assignment). Flow: **quote → accept → create → pay → confirmation**.

---

## 1. Inspection findings (before changes)

- **No fare/payment UI existed.** `NewDelivery → Fare / PaySummary` were `makePlaceholder` screens and `Processing`/`Result` were inline scaffolds in `AppNavigator.tsx` (with a "Simulate result" button). All four are replaced in this phase.
- Ports were already sufficient except for distance: `PricingPort.calculate({distanceKm, weightKg, packageType})`, `PaymentPort.initialize({deliveryId, amountNaira, email?, phone?, provider})`, `getByReference`, `getByDelivery`, `verify(reference)`. `api/index.ts` already converts naira→kobo at the boundary (SC-16).
- **Mock (store) already matched the intended rules**: `initializePayment` requires the delivery in `REQUESTED` and creates a `processing` payment; `verifyPayment` success flips the delivery `requested → searching` and writes `paymentReference`; failure marks the payment `failed` and leaves the delivery `REQUESTED`; `paymentFails` scenario exists. Gaps found: **no double-pay guard**, and no way to reach a **timeout**.
- **Distance source (SC-8) was unresolved**: `/pricing/calculate` needs `distanceKm`, and `distanceBetween` lived in `mocks/fixtures` — which screens/adapters may not import. `Address` carries lat/lng but the request draft does not.
- `apps/customer/src/hooks/useCountdown.ts` exists (Phase 4) — reusable for quote expiry. Shared `FareBreakdownCard`, `RouteSummaryCard`, `CheckoutSheet` (Card/Bank-transfer tabs, test-mode banner), `Dialog`, `Banner`, `ErrorState` already existed and are reused.
- React Native core still ships `Clipboard` (deprecated) → "copy" needs **no new dependency**.
- `System` dep list unchanged: **no new packages** in this phase.

## 2. Summary (≤5 lines)

- Fare quote (distance estimate → `pricing.calculate`) with breakdown, ETA, loading/error/expired; Accept creates the delivery (REQUESTED) and moves to payment.
- PaySummary reuses the shared `CheckoutSheet` (Card / Bank transfer, test mode) → `payment.initialize` → Processing (Back blocked) verifies + polls → Success / Failed / Timeout / Cancelled.
- Success shows "Request confirmed" with tracking number + Copy, and `replace`s the modal with Tracking; failures offer retry with the delivery still `REQUESTED`.
- Mock hardened: no double-pay (a `success` payment or a non-REQUESTED delivery blocks initialize), plus a `paymentPending` scenario for the timeout path.
- 105 shared tests pass (12 new); customer/rider typecheck + bundle clean; admin build clean.

## 3. Files created / modified / deleted

**Created (9)**
| Path | Why |
|---|---|
| `apps/shared/src/domain/serviceArea.ts` | Domain-owned launch-area coordinates, `estimateDistanceKm`, `estimateEtaMinutes`, `isServiceArea` |
| `apps/shared/src/__tests__/pricingPayment.test.ts` | 12 tests: formula (4 km/2 kg → ₦1,400), distance/ETA, quote over ports, success/decline/double-pay/retry/timeout/guard |
| `apps/customer/src/hooks/usePaymentConfirmation.ts` | Dedicated hook: verify once, then bounded polling (3×2 s) → `verifying/pending/success/failed/timeout` |
| `apps/customer/src/utils/clipboard.ts` | Copy helper (RN core `Clipboard`) |
| `apps/customer/src/screens/payment/FareScreen.tsx` | Quote + breakdown + ETA + expiry + Accept → create |
| `apps/customer/src/screens/payment/PaySummaryScreen.tsx` | Summary + `CheckoutSheet` → initialize |
| `apps/customer/src/screens/payment/ProcessingScreen.tsx` | Blocking confirmation screen (Back blocked) |
| `apps/customer/src/screens/payment/ResultScreen.tsx` | Confirmed / failed / timeout / cancelled outcomes + Copy + Track |
| `docs/frontend/reports/PHASE-7-REPORT.md` | This report |

**Modified (14)**
| Path | Why |
|---|---|
| `apps/shared/src/domain/constants.ts` | `QUOTE_TTL_SECONDS = 300` |
| `apps/shared/src/domain/index.ts` | Export `serviceArea` |
| `apps/shared/src/mocks/fixtures.ts` | `AREA_COORDS`/`distanceBetween` now delegate to the domain (single source) |
| `apps/shared/src/data/ports/index.ts` | `PricingPort.estimateDistance` (SC-20) |
| `apps/shared/src/data/mock/store.ts` | `estimateDistance`; double-pay guard; `paymentShouldHang` (pending) branch |
| `apps/shared/src/data/mock/index.ts` | Wire `pricing.estimateDistance` |
| `apps/shared/src/data/mock/scenarios.ts` | New `paymentPending` scenario + state flag |
| `apps/shared/src/data/api/index.ts` | `pricing.estimateDistance` client-side estimate (no backend route) |
| `apps/customer/src/hooks/index.ts` | `useDistanceEstimate`, `useFareQuote`, `useInitializePayment`, `useVerifyPayment`, `usePayment` |
| `apps/customer/src/screens/newdelivery/DraftContext.tsx` | Track `created` delivery + `paymentReference`; `reset` clears them |
| `apps/customer/src/navigation/types.ts` | `Processing`/`Result` params |
| `apps/customer/src/navigation/AppNavigator.tsx` | Wire the 4 real screens; delete the inline Processing/Result scaffolds |
| `docs/frontend/SCAFFOLD_REGISTER.md` | Removed the Fare/PaySummary + Processing/Result rows |
| `docs/frontend/CONTRACT_LEDGER.md` | SC-19/SC-20/SC-21 + F-row for `estimateDistance` |

**Deleted (0)** — the inline scaffolds were replaced inside `AppNavigator.tsx` (no orphan files).

## 4. Dependencies added

none (reused `Clipboard` from RN core; no new packages).

## 5. Commands run with real output

```
apps/shared$ npm run typecheck             → tsc --noEmit -p tsconfig.logic.json  (clean)
apps/shared$ npm test                      → Test Files 9 passed (9) · Tests 105 passed (105)
apps/shared$ node scripts/contrast-check.mjs → ALL CHECKS PASSED
hex-literal scan (new files)               → (no matches)
apps/customer$ npm run typecheck           → tsc --noEmit  (clean)
apps/customer$ npx expo export --platform android
                                           → Android Bundled 18963ms index.ts (1526 modules) · Exported
apps/rider$    npm run typecheck           → tsc --noEmit  (clean)
apps/rider$    npx expo export --platform android
                                           → Android Bundled 20037ms index.ts (1488 modules) · Exported
apps/admin$    npm run build               → ✓ 135 modules transformed · ✓ built in 1.02s
apps/admin$    npm run lint                → lint unavailable (OS policy): oxlint native binding blocked — not worked around
```
No `duplicate-react-native` warning in any bundle.

## 6. Acceptance checklist

| Criterion | ✓ | Evidence |
|---|---|---|
| Quote before creating | ✓ | `FareScreen` only calls `pricing.*`; `delivery.create` runs on Accept |
| Fare breakdown (base, distance, weight, minimum) + ETA text | ✓ | `FareBreakdownCard` + `RouteSummaryCard` (`estimateEtaMinutes`) |
| Fare loading / error / expired | ✓ | skeletons / `ErrorState`+retry / `expired` banner with Refresh (`useCountdown`, `QUOTE_TTL_SECONDS`) |
| Accept → create (REQUESTED) → PaySummary | ✓ | `FareScreen.accept` → `useCreateDelivery` → `setCreated` → `navigate('PaySummary')` |
| CheckoutSheet test mode, Card / Bank transfer, original design | ✓ | reused shared `CheckoutSheet` (paystack/flutterwave) |
| Processing → Success / Failed (retry) / Cancelled (+Timeout) | ✓ | `ProcessingScreen` → `ResultScreen` with 4 designed outcomes |
| Request confirmed: tracking number + copy | ✓ | `ResultScreen` success card + `copyToClipboard` |
| Pay disabled while processing | ✓ | `CheckoutSheet busy` + Pay button `disabled={initialize.isPending}` |
| MOCK DATA: fares from the real formula | ✓ | test "4 km & 2 kg → ₦1,400"; quote via `estimateDistance → calculate` |
| `paymentFails` scenario works | ✓ | test + demo scenario; delivery stays `REQUESTED` |
| NAV: replace to Tracking on success | ✓ | `ResultScreen.track()` → `root.replace('Tracking', …)` |
| NAV: Back blocked on Processing | ✓ | `beforeRemove` preventDefault + `gestureEnabled:false` |
| No double-pay path | ✓ | Pay disabled while processing; Processing blocks Back; mock blocks a 2nd init once a payment is `success` or the delivery left `REQUESTED` |
| Failed payment leaves no chargeable delivery | ✓ | test: after decline the delivery is still `requested`, `paymentReference` null, payment `failed` |
| All states designed (success, decline, cancel, timeout) | ✓ | 4 outcomes + Cancel closes CheckoutSheet → `Result cancelled` |
| PricingPort / PaymentPort only | ✓ | no other port is called for money |
| No new deps / no map / no location | ✓ | dep list unchanged |
| Phase 6 screens untouched (except Review→Fare handoff) | ✓ | only `DraftContext` extended; the handoff already called `navigate('Fare')` |

## 7. Deviations and why

- **`pricing.estimateDistance` is a new port method** with no backend route (SC-20). The distance function moved from `mocks/fixtures` into `domain/serviceArea.ts` so the **api adapter** can use it too (adapters must not import fixtures). Mock and api now share one estimator; fixtures delegate.
- **`paymentPending` scenario added** so the required **timeout** state is reachable and testable (verify returns `pending`; the hook polls 3× then times out). `paymentFails` remains the decline path.
- **Retry after decline/cancel/timeout is allowed** while the backend §12 rule would block on a `PROCESSING` payment → logged as **SC-19 Needs decision** and the prompt's retry behaviour followed.
- **Copy uses RN core `Clipboard`** (deprecated) rather than adding `expo-clipboard` (not on the approved list) → **SC-21** (approve a clipboard dep later). The tracking number is also `selectable`.
- **Payment "cancelled"** is a UI outcome (closing the CheckoutSheet) — no backend cancel route exists; the mock leaves that payment `processing`, which does not block a retry (see SC-19).
- **Fare screen has no step indicator** (the 5-step indicator belongs to Phase 6's steps); it is the quote screen after Review.

## 8. Ledger rows added / "Needs decision"

- **SC-19 (Needs decision)** — retry after a declined/cancelled/timed-out payment (backend §12 would block on `PROCESSING`).
- **SC-20 (Needs decision)** — client-side `distanceKm` estimate via `pricing.estimateDistance` (restates SC-8).
- **SC-21 (Resolved)** — RN core `Clipboard` used for "copy"; swap when a clipboard dep is approved.
- **F. adapter gap** — `pricing.estimateDistance` (no backend route).

## 9. Scaffolds still present

- `Tracking → TrackingHome / Timeline / POD / Failed / Returned / CancelFlow` — `PlaceholderScreen` (Phases 8–9).
- `ScreenScaffold` component (still used by the tracking placeholders).
- Onboarding "Slides" copy (Phase 17); Deliveries/Alerts/Account/TrackByNumber real shells (Phases 8–11); consent links (Phase 11).
- The **Fare / PaySummary / Processing / Result** rows were removed from `SCAFFOLD_REGISTER.md`.

## 10. Known issues, risks, open questions

- **Abandoned checkout**: backing out of PaySummary after Accept leaves a `REQUESTED` delivery with a `processing` payment in the mock. Retry works; a cleanup/cancel route is a backend gap (see SC-19, SC-2).
- **Offline during payment** is surfaced as the failed state (`usePaymentConfirmation` maps `OfflineError` → `failed`).
- **Quote expiry** is client-side only (`QUOTE_TTL_SECONDS`); the mock has no server-side quote TTL.
- **`estimateDistanceKm` is a coordinate-table estimate**, not routing — acceptable for R1 (SC-20).
- **Timeout polling** is 3 × 2 s = ~6 s before the timeout state (bounded, in a dedicated hook).
- SC-2 / SC-5 / SC-8 / SC-16 / SC-17 remain open (unchanged).

### Port-call sequences

**Happy path**
```
FareScreen:    pricing.estimateDistance({pickupArea, dropoffArea}) → distanceKm
               pricing.calculate({distanceKm, weightKg, packageType}) → FareBreakdown
Accept:        delivery.create(toCreateDeliveryInput(draft)) → Delivery { status: 'requested', trackingNumber, fare }
PaySummary:    payment.initialize({deliveryId, amountNaira: fare, provider, email, phone})
                 → { reference, status: 'processing' }
Processing:    payment.verify(reference) → { status: 'success' }
                 (mock: payment SUCCESS; delivery requested → SEARCHING; paymentReference set)
               → Result(success) → root.replace('Tracking', { TrackingHome, deliveryId })
               (invalidation: ['deliveries'], ['payment'])
```

**Failure path (decline)**
```
Fare/Accept/PaySummary/initialize:  identical to happy path
Processing:    payment.verify(reference) → { status: 'failed' }
                 (mock: payment FAILED 'Card declined (test)'; delivery stays REQUESTED; paymentReference null)
               → Result(failed) → "Try again" → replace('PaySummary')
Retry:         payment.initialize(same deliveryId) → new reference (allowed: delivery still REQUESTED,
                 no successful payment exists) → verify → success → REQUESTED → SEARCHING
```
**Timeout** — `paymentPending`: `verify` → `pending`; hook polls `payment.getByReference` 3× → `timeout` → Result(timeout) → "Check again" → `replace('Processing', …)`.
**Cancel** — CheckoutSheet `onClose` → `Result(cancelled)`; no `verify` call; delivery stays REQUESTED; retry allowed.

## 11. How a human verifies manually

1. `cd apps/customer && npx expo start -c`, Expo Go, sign in (`08031234567` / `482913`).
2. Home → **Send a package** → complete Pickup/Drop-off/Package/Sender → Review → **Confirm & see fare**.
3. Fare: check the breakdown (base ₦500, distance, weight, minimum ₦1,000) and the ETA; note the quote countdown.
4. **Accept fare** → PaySummary (tracking number + breakdown) → **Pay** → CheckoutSheet → pick **Card**/**Bank transfer** → **Pay**.
5. Processing blocks Back; then **Request confirmed** with the tracking number → **Copy tracking number** → **Track this delivery** (replaces the modal with Tracking) or **Done**.
6. Decline: Demo menu → scenario **paymentFails** → repeat 2–4 → **Payment failed** → **Try again** → set scenario **happy** → pay again → success. Confirm the delivery was never in *Searching* before payment.
7. Timeout: scenario **paymentPending** → pay → Processing polls ~6 s → **We couldn't confirm your payment** → **Check again**.
8. Cancel: at the CheckoutSheet tap outside/backdrop → **Payment cancelled**.
9. Demo menu → **Reset data** to clear.

## 12. Proposed commit message and file list

```
feat(customer): phase 7 fare quote and payment flow

- shared: domain serviceArea (coordinate estimate + ETA), QUOTE_TTL_SECONDS,
  PricingPort.estimateDistance (SC-20); fixtures delegate to the domain
- shared mock: no double-pay guard, paymentPending scenario; 12 vitest tests
- customer: FareScreen (quote/breakdown/ETA/expiry) → create delivery (REQUESTED)
- customer: PaySummaryScreen with shared CheckoutSheet (Card/Bank transfer, test mode)
- customer: ProcessingScreen (Back blocked) + usePaymentConfirmation polling hook
- customer: ResultScreen success/failed/timeout/cancelled, tracking number + copy, replace to Tracking
- docs: ledger SC-19/20/21, scaffold register updated
```

Files to stage (23):
```
apps/shared/src/domain/serviceArea.ts
apps/shared/src/domain/constants.ts
apps/shared/src/domain/index.ts
apps/shared/src/mocks/fixtures.ts
apps/shared/src/data/ports/index.ts
apps/shared/src/data/mock/store.ts
apps/shared/src/data/mock/index.ts
apps/shared/src/data/mock/scenarios.ts
apps/shared/src/data/api/index.ts
apps/shared/src/__tests__/pricingPayment.test.ts
apps/customer/src/hooks/index.ts
apps/customer/src/hooks/usePaymentConfirmation.ts
apps/customer/src/utils/clipboard.ts
apps/customer/src/screens/newdelivery/DraftContext.tsx
apps/customer/src/screens/payment/FareScreen.tsx
apps/customer/src/screens/payment/PaySummaryScreen.tsx
apps/customer/src/screens/payment/ProcessingScreen.tsx
apps/customer/src/screens/payment/ResultScreen.tsx
apps/customer/src/navigation/types.ts
apps/customer/src/navigation/AppNavigator.tsx
docs/frontend/SCAFFOLD_REGISTER.md
docs/frontend/CONTRACT_LEDGER.md
docs/frontend/reports/PHASE-7-REPORT.md
```

STOPPED. Awaiting approval for the next phase.
