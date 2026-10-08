# Phase 6 — Create delivery (request flow up to Review)

Branch: `fe-phase-6-create-delivery`
Scope: FR-C04 (create delivery request), FR-C07 (package details). Fare comes after Review (Phase 7).

---

## 1. Inspection findings (before changes)

- `apps/customer/src/screens/NewDeliveryScreen.tsx` **does not exist** — it was deleted as a dead legacy screen in Phase 4. The prompt's "single hardcoded form" is stale; the real current state is 5 `makePlaceholder` screens (`Pickup`, `Dropoff`, `Package`, `Sender`, `Review`) registered as `NewDeliveryStack` routes in `AppNavigator.tsx`.
- `NewDeliveryStackParamList` already exists with `Pickup → Dropoff → Package → Sender → Review → Fare → PaySummary → Processing → Result`; the modal presentation and `NewDelivery` root route + linking (`new/pickup`) are configured.
- Phase 5 gave us `SavedAddressesScreen` + `AddressFormScreen` (address CRUD over `delivery.*Address` ports) with **duplicated field markup** (label/street/landmark/area-chips/city/state) — the prompt asks to extract it.
- Ports available and sufficient: `delivery.create(input: CreateDeliveryInput)`, `delivery.list/createAddress/updateAddress/...`, `auth.getProfile`. `CONTRACT_SNAPSHOT.md §2` fixes the payload: 17 `CreateDeliveryDto` fields (13 required-ish + 4 lat/lng).
- Shared already exposes `Input`, `TextArea`, `PhoneInput`, `SegmentedControl`, `Chip`, `ListItem`, `Card`, `Banner`, `Dialog`, `EmptyState`, `ErrorState`, `Skeleton`, `Row/Column`, `toCanonicalPhone`, `isValidNigerianPhone`, `SERVICE_AREAS`/`ABUJA_AREAS`, `DEFAULT_PRICING` weight tiers 1/5/10/25 kg. No step indicator existed.
- Mock `createDelivery` requires a session, rejects `senderPhone === recipientPhone` (`ValidationError`), assigns `TLK-2026-###` and computes fare from `pickupArea → dropoffArea` distance. Fixtures contain both `document` and `parcel` deliveries. **No out-of-area concept existed** — `distance()` silently falls back to 5 km for unknown areas.
- No new dependencies were needed.

## 2. Summary (≤5 lines)

- The 5 request steps are now real screens on a scoped `useReducer` draft that survives Back; the draft's pure model, validation and DTO assembly live in shared and are unit-tested.
- Address entry is extracted once (`AddressFields` + `AddressPicker`) and `AddressFormScreen` now reuses it; the label (Home/Office…) is settable and shown in the picker.
- Document/Parcel + weight chips (≤1/≤5/≤10/≤25, upper bound sent; Document defaults ≤1, Parcel ≤5) + description; sender prefilled from the profile.
- Out-of-area, discard-confirm and offline-on-submit states are implemented; every Continue validates inline.
- 94 shared tests pass (12 new); customer/rider typecheck + bundle clean; admin build clean.

## 3. Files created / modified / deleted

**Created (15)**
| Path | Why |
|---|---|
| `apps/shared/src/domain/newDelivery.ts` | Pure draft model: steps, `WEIGHT_OPTIONS`, `isServiceableArea`, `validateStep`, `toCreateDeliveryInput`, `draftReducer` |
| `apps/shared/src/components/StepIndicator.tsx` | Design-system step progress indicator |
| `apps/shared/src/__tests__/newDelivery.test.ts` | 11 tests: assembly == DTO keys, weight defaults, serviceability, validation, dirty/reset |
| `apps/shared/src/__tests__/createDelivery.test.ts` | 2 tests: mock accepts assembled Document + Parcel payloads; recipient==sender rejected |
| `apps/customer/src/components/AddressFields.tsx` | Extracted shared address fields (label/street/landmark/area chips/city/state) |
| `apps/customer/src/components/AddressPicker.tsx` | Saved-address picker + inline new-address form; shows the address label and out-of-area badge |
| `apps/customer/src/screens/newdelivery/DraftContext.tsx` | Scoped draft reducer provider (persists across steps) + sender prefill |
| `apps/customer/src/screens/newdelivery/DraftExitGuard.tsx` | `beforeRemove` guard → discard confirmation |
| `apps/customer/src/screens/newdelivery/StepScreen.tsx` | Shared step chrome (TopBar + StepIndicator + scroll body + pinned footer) |
| `apps/customer/src/screens/newdelivery/PickupScreen.tsx` | Step 1 |
| `apps/customer/src/screens/newdelivery/DropoffScreen.tsx` | Step 2 (address + recipient) |
| `apps/customer/src/screens/newdelivery/PackageScreen.tsx` | Step 3 (type/weight/description) |
| `apps/customer/src/screens/newdelivery/SenderScreen.tsx` | Step 4 (sender contact) |
| `apps/customer/src/screens/newdelivery/ReviewScreen.tsx` | Step 5 (summary + offline + dev payload) |
| `docs/frontend/reports/PHASE-6-REPORT.md` | This report |

**Modified (7)**
| Path | Why |
|---|---|
| `apps/shared/src/domain/constants.ts` | Added `SERVICE_AREAS` (+ `ServiceArea`) as the single source of truth |
| `apps/shared/src/domain/index.ts` | Re-export `newDelivery` |
| `apps/shared/src/components/index.ts` | Re-export `StepIndicator` |
| `apps/shared/src/mocks/fixtures.ts` | `ABUJA_AREAS` now aliases `SERVICE_AREAS`; added one out-of-area saved address (`Kano office`) for the out-of-area state |
| `apps/customer/src/navigation/AppNavigator.tsx` | Replaced the 5 placeholders with real screens; wrapped the stack in `NewDeliveryDraftProvider` |
| `apps/customer/src/screens/AddressFormScreen.tsx` | Rebuilt on `AddressFields` (removed duplicated markup); now scrollable |
| `docs/frontend/SCAFFOLD_REGISTER.md` | Removed the "New Delivery steps" row (replaced in this phase) |

**Deleted (0)** — no legacy screen remained to remove.

## 4. Dependencies added

none (no new packages; all four rules — no map/location — respected).

## 5. Commands run with real output

```
apps/shared$ npm run typecheck        → tsc --noEmit -p tsconfig.logic.json   (clean)
apps/shared$ npm test                 → Test Files 8 passed (8) · Tests 94 passed (94)
apps/shared$ node scripts/contrast-check.mjs → ALL CHECKS PASSED
hex-literal scan (new files)          → (no matches)
apps/customer$ npm run typecheck      → tsc --noEmit   (clean)
apps/customer$ npx expo export --platform android
                                      → Android Bundled 76068ms index.ts (1519 modules) · Exported
apps/rider$    npm run typecheck      → tsc --noEmit   (clean)
apps/rider$    npx expo export --platform android
                                      → Android Bundled 47918ms index.ts (1487 modules) · Exported
apps/admin$    npm run build          → ✓ 135 modules transformed · ✓ built in 1.61s
apps/admin$    npm run lint           → lint unavailable (OS policy): oxlint native binding blocked
                                        (Application Control policy) — not worked around
```
No `duplicate-react-native` warning in any bundle.

## 6. Acceptance checklist

| Criterion | ✓ | Evidence |
|---|---|---|
| Modal flow Pickup → Drop-off+recipient → Package → Sender → Review | ✓ | `AppNavigator.tsx` `NewDeliveryNavigator`; 5 real screens |
| Draft in a scoped `useReducer`; **Back preserves draft** | ✓ | `DraftContext.tsx` provider sits above the stack; `StepScreen` only calls `goBack()` — state untouched (`draftReducer`) |
| Shared address fields/validation extracted (no duplication) | ✓ | `AddressFields.tsx` used by `AddressPicker` **and** `AddressFormScreen` |
| Address label (Home/Office…) settable and shown in picker | ✓ | `AddressFields` "Label" input; `AddressPicker` `ListItem title={a.label}` |
| Package: Document/Parcel, weight chips ≤1/≤5/≤10/≤25 (upper bound), Document ≤1 / Parcel ≤5 | ✓ | `PackageScreen` + `WEIGHT_OPTIONS`/`DEFAULT_WEIGHT`; test "resets the weight to the tier default" |
| Sender prefilled from profile and editable | ✓ | `DraftContext` `patchSender` effect + `SenderScreen` inputs |
| Payload matches `CreateDeliveryDto` exactly | ✓ | test "assembles exactly the CreateDeliveryDto fields" (`Object.keys(input).sort()` == DTO set) + §below |
| Out-of-area state | ✓ | `Pickup`/`DropoffScreen` blocking banner + disabled Continue; `Kano office` fixture |
| Discard dialog | ✓ | `DraftExitGuard` + `Dialog` |
| Offline-on-submit with draft kept | ✓ | `ReviewScreen` reads `useDeliveries().error.name === 'OfflineError'`; shows offline banner and does not navigate |
| Step indicator / one decision per screen / inline validation | ✓ | `StepIndicator`; one concern per screen; `validateStep` → `Input error`/`Banner` |
| Every error state present | ✓ | loading/empty/error in `AddressPicker`; field errors; offline; out-of-area |
| No dead handlers | ✓ | All `onPress` wired (no `() => {}`) |
| No new deps / no map / no location | ✓ | dependency list unchanged |
| Fare/payment untouched | ✓ | `Fare`/`PaySummary`/`Processing`/`Result` still placeholders |

### Payload → DTO comparison (`toCreateDeliveryInput` vs `CONTRACT_SNAPSHOT.md §2`)

| DTO field | Source | Emitted |
|---|---|---|
| `pickupStreet` | `draft.pickup.street.trim()` | ✓ |
| `pickupLandmark?` | `draft.pickup.landmark` (omitted when blank) | ✓ |
| `pickupArea?` | `draft.pickup.area` | ✓ |
| `pickupLatitude?` | — | **omitted (no maps, R1)** |
| `pickupLongitude?` | — | **omitted (no maps, R1)** |
| `dropoffStreet` | `draft.dropoff.street.trim()` | ✓ |
| `dropoffLandmark?` | `draft.dropoff.landmark` (omitted when blank) | ✓ |
| `dropoffArea?` | `draft.dropoff.area` | ✓ |
| `dropoffLatitude?` | — | **omitted (no maps, R1)** |
| `dropoffLongitude?` | — | **omitted (no maps, R1)** |
| `packageType` | `'document' \| 'parcel'` | ✓ |
| `packageWeight` | chip upper bound (1/5/10/25) | ✓ |
| `packageDescription?` | free text (omitted when blank) | ✓ |
| `senderName` | trimmed | ✓ |
| `senderPhone` | `toCanonicalPhone()` → `080…` | ✓ |
| `recipientName` | trimmed | ✓ |
| `recipientPhone` | `toCanonicalPhone()` → `080…` | ✓ |

13 of 17 DTO fields emitted; the 4 lat/lng fields are intentionally absent (R1 has no maps — SC-1/D6). No extra/uncontracted keys (asserted in the test).

## 7. Deviations and why

- **`NewDeliveryScreen.tsx` removed in Phase 4** → nothing to delete this phase; built the flow fresh on the existing routes instead of modifying a "hardcoded form".
- **`ABUJA_AREAS` re-pointed at a new `SERVICE_AREAS`** in `domain/constants.ts` so the flow and fixtures share one list (fixtures must not be a domain dependency). `ABUJA_AREAS` remains exported, so existing imports are unchanged.
- **One out-of-area fixture address added** (`Kano office`) so the required out-of-area state is actually reachable in a demo (there is no geocoding to detect it otherwise).
- **Review's primary action navigates to the existing `Fare` placeholder** rather than creating the delivery: `CreateDeliveryDto` is assembled and validated here, but the quote→accept→create→pay sequence (SC-8) puts `delivery.create` in Phase 7. Explicitly out of scope ("DO NOT TOUCH fare/payment screens").
- **Sender prefill is not treated as "dirty"** so the discard dialog doesn't fire on an otherwise untouched draft.

## 8. Ledger rows added / "Needs decision"

- No new **Needs decision** rows. SC-6 (weight chips → numeric kg) and SC-8 (fare after Review; distance source) are the rows this phase operates under and both remain as recorded.
- No new ledger rows added (no new endpoint or contract field was needed).

## 9. Scaffolds still present

- `NewDelivery → Fare / PaySummary` — `PlaceholderScreen` (Phase 7).
- `NewDelivery → Processing / Result` — inline in `AppNavigator.tsx` (Phase 7).
- `Tracking → *` (6 routes) — `PlaceholderScreen` (Phases 8–9).
- `ScreenScaffold` component (still used by the tracking placeholders).
- Onboarding "Slides" copy (Phase 17); Deliveries/Alerts/Account/TrackByNumber real shells (Phases 8–11); consent links (Phase 11).
- The **New Delivery step** scaffold row has been removed from `SCAFFOLD_REGISTER.md`.

## 10. Known issues, risks, open questions

- **Offline detection on Review** derives from the `useDeliveries()` query error (`name === 'OfflineError'`). It's a heuristic; a dedicated connectivity signal would be cleaner but would need a new port/state.
- **Out-of-area** is area-string based (`SERVICE_AREAS`); when real geocoding arrives the rule must move to coordinates.
- **`delivery.create` is still not called from the UI** (by design, Phase 7). The store's `ValidationError` for recipient==sender is enforced in the mock and in `validateStep`.
- **Address management list** (`SavedAddressesScreen`) keeps its own list rows; only the *fields/validation* and the *picker* are extracted. A future phase could share a list row component too.
- **SC-8 / SC-2 / SC-5 / SC-16 / SC-17** remain open ledger decisions (unchanged by this phase).

## 11. How a human verifies manually

1. `cd apps/customer && npx expo start -c`, open in Expo Go, sign in (phone `08031234567`, OTP `482913`).
2. Home → **Send a package** (modal opens).
3. Pickup: choose **Home** → Continue. Then choose **Kano office** → see the *Out of area* banner and Continue disabled; choose a served area to proceed.
4. Drop-off: pick **Office**, enter a recipient name + phone (try the sender's own number → inline error), Continue.
5. Package: switch **Document/Parcel** (weight resets to ≤1 / ≤5), pick another chip, add a description, Continue.
6. Sender: confirm prefilled from profile; clear the name → inline error; fix, Continue.
7. Review: check the summary; press **Edit** on any card to jump back (draft intact — go forward again, values kept). In dev, read the `CreateDeliveryDto (dev)` card and compare with §6 above.
8. Press **Confirm & see fare** → lands on the Fare placeholder (Phase 7).
9. Reopen the flow, type a pickup street, then press the system Back → **Discard request?** dialog; choose *Keep editing* (draft intact) then *Discard* (draft cleared).
10. Demo menu (long-press the version text) → scenario **offline** → open Review → **Confirm** shows the offline banner and stays.

## 12. Proposed commit message and file list

Message:
```
feat(customer): phase 6 create-delivery request flow up to Review

- shared: pure newDelivery draft model (steps, weight tiers, serviceability,
  validateStep, toCreateDeliveryInput) + SERVICE_AREAS single source; 13 vitest tests
- shared: StepIndicator component; out-of-area fixture address
- customer: extract AddressFields + AddressPicker; AddressFormScreen reuses them
- customer: NewDelivery modal steps (Pickup/Dropoff/Package/Sender/Review) on a scoped
  useReducer draft that survives Back, with discard guard, out-of-area and offline states
- customer: replace the 5 New Delivery placeholders in AppNavigator; update SCAFFOLD_REGISTER
```

Files to stage (22):
```
apps/shared/src/domain/newDelivery.ts
apps/shared/src/domain/constants.ts
apps/shared/src/domain/index.ts
apps/shared/src/components/StepIndicator.tsx
apps/shared/src/components/index.ts
apps/shared/src/mocks/fixtures.ts
apps/shared/src/__tests__/newDelivery.test.ts
apps/shared/src/__tests__/createDelivery.test.ts
apps/customer/src/components/AddressFields.tsx
apps/customer/src/components/AddressPicker.tsx
apps/customer/src/screens/newdelivery/DraftContext.tsx
apps/customer/src/screens/newdelivery/DraftExitGuard.tsx
apps/customer/src/screens/newdelivery/StepScreen.tsx
apps/customer/src/screens/newdelivery/PickupScreen.tsx
apps/customer/src/screens/newdelivery/DropoffScreen.tsx
apps/customer/src/screens/newdelivery/PackageScreen.tsx
apps/customer/src/screens/newdelivery/SenderScreen.tsx
apps/customer/src/screens/newdelivery/ReviewScreen.tsx
apps/customer/src/navigation/AppNavigator.tsx
apps/customer/src/screens/AddressFormScreen.tsx
docs/frontend/SCAFFOLD_REGISTER.md
docs/frontend/reports/PHASE-6-REPORT.md
```

STOPPED. Awaiting approval for the next phase.
