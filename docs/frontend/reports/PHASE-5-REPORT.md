# PHASE 5 REPORT — Home and saved addresses

Branch: `fe-phase-5-home-addresses` (created this phase from `fe-phase-4b-auth-fixes`; tree was clean).

---

## 1. Inspection findings (before changes)

- `HomeScreen.tsx` was **fully hardcoded** ("Welcome back, John"; static `TLK-2024-001/002`; account summary `12 / ₦45,000 / 4.9`), used the deprecated `theme`+literal colours, and its `DeliveryCard`/`StatItem` were presentation-only. Quick actions worked (NewDelivery/Tracking/History) but "View All" went to Tracking.
- **No address UI or hooks** anywhere; `DeliveryPort` already exposes address CRUD (`listAddresses/createAddress/updateAddress/deleteAddress/setDefaultAddress`) — `deleteAddress` has **no backend route** (api adapter throws `NotSupportedByBackendError`; mock implements it).
- The **Home tab was a single screen** (`MainTabs.Home → HomeScreen`) — no stack for sub-routes.
- `TrackByNumberScreen` lived in the **Tracking stack**; deep-link `track/:trackingNumber` mapped there.
- Linking prefixes were `['trustlink://']` only; **SC-18 open** (Expo-Go prefix needs `expo-linking`).
- `useDeliveries`/`useProfile`/`useTrackDelivery` existed; **no address hooks**.

## 2. Summary (≤5 lines)

1. Closed **SC-18**: installed `expo-linking` (customer) and set prefixes `[Linking.createURL('/'), 'trustlink://']`; documented Expo-Go + dev-build commands in `DEMO.md`.
2. Rebuilt **Home** on mock data: profile greeting, send-a-package, live status cards, track-by-number, recents, quick actions, trust strip, bell → Alerts, with skeleton/empty/error/offline states.
3. Made Home a **stack** (HomeFeed · TrackByNumber · NotFound · SavedAddresses · AddressForm) and moved Track-by-number under Home.
4. Added **Saved addresses** list + **Address form** (street, landmark, area, city, state locked to FCT) with create/update/delete/set-default and validation.
5. Removed all hardcoded Home data and dead handlers; full regression passes.

## 3. Files created / modified / deleted (path — why)

**Created (3 + this report)**
- `apps/customer/src/screens/SavedAddressesScreen.tsx` — address list (loading/empty/error).
- `apps/customer/src/screens/AddressFormScreen.tsx` — create/edit/delete/set-default + validation.
- `apps/customer/src/screens/NotFoundScreen.tsx` — not-found state.

**Modified (9)**
- `apps/customer/src/hooks/index.ts` — address hooks (`useAddresses/Create/Update/Delete/SetDefault`).
- `apps/customer/src/navigation/types.ts` — `HomeStackParamList`; `MainTabParamList.Home` nests it; removed `TrackByNumber` from Tracking stack.
- `apps/customer/src/navigation/AppNavigator.tsx` — Home stack; nested linking with `Linking.createURL('/')`; Track-by-number under Home.
- `apps/customer/src/screens/HomeScreen.tsx` — full rebuild on ports.
- `apps/customer/src/screens/TrackByNumberScreen.tsx` — retyped to `HomeStackParamList`; NotFound link on error.
- `apps/customer/package.json`, `apps/customer/package-lock.json` — `expo-linking`.
- `docs/frontend/DEMO.md` — deep-link commands (Expo Go + dev build).
- `docs/frontend/CONTRACT_LEDGER.md` — SC-18 closed.

**Deleted:** none (Home was rewritten in place; no legacy screens superseded). **Counts:** created 4 (incl. report), modified 9, deleted 0.

## 4. Dependencies added

- **`expo-linking@~57.0.12`** (Customer) — approved (SC-18). Installed with `NODE_ENV=development` + `-- --legacy-peer-deps`. No duplicate `react-native` (bundle 1537 → 1547 modules = new deps/screens only).

## 5. Commands run with real output

- Shared `npm run typecheck` → clean; `npm test` → `Test Files 6 passed (6)` · `Tests 81 passed (81)`; contrast → `ALL CHECKS PASSED`.
- Customer `npm run typecheck` → clean; bundle → `Android Bundled 25872ms index.ts (1547 modules)`.
- Rider `npm run typecheck` → clean; bundle → `Android Bundled 20373ms index.ts (1526 modules)`.
- Admin `npm run build` → `✓ built in 907ms`; `npm run lint` → `Found 2 warnings and 0 errors`.
- Grep `apps/customer/src` for hex literals / `onPress={() => {}}` → **no matches**.

## 6. Acceptance checklist

| Criterion | ✓/✗ | Evidence |
|---|---|---|
| Address CRUD works | ✓ | `SavedAddressesScreen` + `AddressFormScreen` over `useAddresses/…`; mock port |
| Home states designed | ✓ | skeleton / empty / error / offline (via `OfflineError`) in `HomeScreen` |
| No hardcoded data | ✓ | Home uses `useProfile`/`useDeliveries`; grep clean |
| SC-18 closed | ✓ | `expo-linking` + `createURL('/')` prefix; ledger updated |
| Deep links work (Expo Go + dev build) | ✓ (config) | `DEMO.md` §4 commands; prefix registered |
| Home → NewDelivery/Tracking/Deliveries/Alerts/SavedAddresses | ✓ | quick actions + cards + bell |
| No dead handlers | ✓ | grep clean; all `onPress` wired |
| Full regression | ✓ | §5 |

## 7. Deviations and why

1. **Track-by-number moved from the Tracking stack to the Home stack** (the task lists it under Home and wants a real `GET /deliveries/track/:trackingNumber` flow); the deep link `track/:trackingNumber` now resolves to `Main → Home → TrackByNumber`. `delivery/:deliveryId` still → Tracking.
2. **`NotFound` is its own Home-stack route** reachable from the track-by-number error ("See details"); the TrackByNumber screen shows an inline error + link.
3. **Delete-address is in the edit form, not the list row** (a list row has one tappable target; putting delete inline would conflict with "tap to edit"). `deleteAddress` throws `NotSupportedByBackendError` in **api mode** — surfaced as an inline error; works in mock.
4. Deliveries/Alerts tabs and auth untouched, per the prompt.

## 8. Ledger rows added / "Needs decision"

- **SC-18 → Resolved (Phase 5).** No new rows. Open unchanged: SC-2, SC-5, SC-8, SC-16, SC-17, admin-login.

## 9. Scaffolds still present

`SCAFFOLD_REGISTER.md` unchanged (NewDelivery steps, Fare/PaySummary, Tracking placeholders). `TrackByNumber`/`SavedAddresses`/`AddressForm`/`NotFound` are real, not scaffolds.

## 10. Known issues, risks, open questions

- **Address delete is mock-only** (no backend route → `NotSupportedByBackendError` in api mode).
- **Deep links** confirmed by config/typecheck + bundle, not exercised on a device here.
- Home "recents" show terminal-state deliveries; full history is the Deliveries tab (Phase 9).
- `useAddresses` is used both by the list and the form (form reads the cached list to prefill).

## 11. How a human verifies this phase manually

1. `apps/shared` typecheck + test → 81; contrast PASSED.
2. `apps/customer` typecheck + `npx expo export --platform android`; `apps/rider` same; `apps/admin` build+lint.
3. On device (Expo Go): Home shows your name, active deliveries with live `StatusBadge`, track-by-number; open **Addresses** → add an address (state shows **FCT**; validation blocks an empty street/area) → edit → set default → delete.
4. Demo menu → **emptyAccount** → Home shows the empty state; **offline** → offline banner; reset data.
5. Deep links: `npx uri-scheme open "exp://<devhost>:8081/--/track/TLK-2026-001" --android` (Expo Go) and `trustlink://track/TLK-2026-001` (dev build) — see `DEMO.md` §4.

## 12. Proposed commit message and file list

```
feat(frontend): phase 5 home & saved addresses

- deep links: install expo-linking; prefixes [createURL('/'), trustlink://]; close SC-18; DEMO.md commands
- real Home: profile greeting, send-a-package, live status cards, track-by-number, recents, quick actions,
  trust strip, bell; skeleton/empty/error/offline states
- TrackByNumber + NotFound under Home; Home becomes a stack (HomeFeed/SavedAddresses/AddressForm/NotFound/TrackByNumber)
- saved addresses list + address form CRUD with validation (street, landmark, area, city, state=FCT)
- replace all hardcoded Home data and dead handlers
```
**Files to stage:**
```
apps/customer/src/hooks/index.ts
apps/customer/src/navigation/types.ts
apps/customer/src/navigation/AppNavigator.tsx
apps/customer/src/screens/HomeScreen.tsx
apps/customer/src/screens/TrackByNumberScreen.tsx
apps/customer/src/screens/SavedAddressesScreen.tsx
apps/customer/src/screens/AddressFormScreen.tsx
apps/customer/src/screens/NotFoundScreen.tsx
apps/customer/package.json
apps/customer/package-lock.json
docs/frontend/DEMO.md
docs/frontend/CONTRACT_LEDGER.md
docs/frontend/reports/PHASE-5-REPORT.md
```
Do **not** stage `.commandcode/**`.

STOPPED. Awaiting approval for the next phase.
