# PHASE 3 REPORT — Customer navigation and shell

Branch: `fe-phase-3-customer-navigation` (confirmed at start; only tool-managed files were dirty).

---

## 1. Inspection findings (before changes)

- Existing nav: `AppNavigator.tsx` — root stack (`Auth` | `Main`) with `MainTabs` = **5 single-screen tabs** (Home, New Delivery, Tracking, History, Profile); `AuthNavigator` = PhoneEntry → OtpVerification → ProfileSetup. **No auth gate**, **no linking**, **no onboarding**, **no demo menu**.
- `HomeScreen` navigates to `'NewDelivery'`, `'Tracking'`, `'History'` — `'History'` would break once tabs become Deliveries.
- Auth screens call `utils/api.ts` (axios) directly and `navigation.replace('Main')`; **not touched** per instructions.
- Phase 2 delivered `useTheme`/roles, 38 component exports (incl. `ScreenContainer`, `TopBar`, `TabBar`, `Banner`, `BottomSheet`, `StatusBadge`), a `__DEV__` DesignGalleryScreen, and a deprecated light-only `theme`.
- Data layer (Phase 1) exposed ports but **no demo controls**; `createDataLayer` hid the mock store.
- Confirmed from the contract: payment success → delivery `SEARCHING`; terminal statuses = delivered/failed/returned/cancelled.

## 2. Summary (≤5 lines)

1. Added typed param lists for the full Part 8 tree and rebuilt `AppNavigator` as Root → Onboarding / Auth / MainTabs (Home · Deliveries · Alerts · Account) / NewDelivery (modal) / Tracking, plus global overlays.
2. Added a session-driven gate (temporary mock session) and deep-link config (`trustlink://track/:trackingNumber`, `trustlink://delivery/:id`).
3. Added a Demo menu (all builds) opened by long-pressing the version text, plus a Design Gallery link (dev only); unbuilt screens use a branded `ScreenScaffold`.
4. Added a custom `MainTabBar` built on the design-system `TabBar`; all new code uses `useTheme()` roles.
5. Validated: shared typecheck + 68 tests, customer/rider typecheck, both Android bundles, admin build+lint — all pass.

## 3. Files created / modified / deleted (path — why)

**Created — customer (11)**
- `src/navigation/types.ts` — typed param lists.
- `src/navigation/AppNavigator.tsx` — *(rewritten, see Modified)*.
- `src/session/SessionContext.tsx` — session gate + temporary mock session.
- `src/demo/DemoMenuContext.tsx` — Demo menu provider + overlay (scenario/advance/reset/theme/recipient codes/gallery link).
- `src/components/ScreenScaffold.tsx`, `src/components/PlaceholderScreen.tsx` — branded placeholders.
- `src/screens/onboarding/OnboardingSlidesScreen.tsx`, `src/screens/onboarding/WelcomeScreen.tsx`.
- `src/screens/DeliveriesScreen.tsx`, `src/screens/AlertsScreen.tsx`, `src/screens/AccountScreen.tsx`, `src/screens/TrackByNumberScreen.tsx`.

**Created — docs (1)**
- `docs/frontend/SCAFFOLD_REGISTER.md`.

**Modified — customer (4)**
- `apps/customer/App.tsx` — added `linking`, `SessionProvider`, `DemoMenuProvider`.
- `apps/customer/src/navigation/AppNavigator.tsx` — rebuilt into the full root navigator (typed stacks + custom tab bar + gate + linking).
- `apps/customer/src/hooks/index.ts` — added `useTrackDelivery`, `useNotifications`, `useCancelDelivery`.
- `apps/customer/src/screens/HomeScreen.tsx` — `'History'` → `'Deliveries'` (one line).

**Modified — shared (3)**
- `apps/shared/src/data/mock/store.ts` — `advanceDelivery`, `activeRecipientCodes`.
- `apps/shared/src/data/mock/index.ts` — `createMockAdaptersFromStore`, `createMockLayer`, `DemoControls`.
- `apps/shared/src/data/createDataLayer.ts` — attaches `demo` for the mock source.

**Deleted:** none. **Counts:** created 12, modified 7, deleted 0.

## 4. Dependencies added

**None.** (No installs this phase.)

## 5. Commands run with real output

- Shared `npm run typecheck` → clean; `npm test` → `Test Files 5 passed (5)` · `Tests 68 passed (68)`.
- Customer `npm run typecheck` → clean.
- Rider `npm run typecheck` → clean.
- Customer bundle → `Android Bundled 29932ms index.ts (1528 modules)`; Rider → `Android Bundled 28506ms index.ts (1525 modules)` — no duplicate-react-native warning.
- Admin `npm run build` → `✓ built in 1.78s`; `npm run lint` → `Found 2 warnings and 0 errors`.
- Hex grep `apps/customer/src` → no matches.

## 6. Acceptance checklist

| Criterion | ✓/✗ | Evidence |
|---|---|---|
| Every route reachable with an entry and exit | ✓ | Route table (§Route table); every placeholder has TopBar/back or a button exit |
| Deep links configured | ✓ | `linking` in `AppNavigator.tsx` (`trustlink://track/:trackingNumber`, `trustlink://delivery/:id`) |
| Demo menu works (all builds) | ✓ | `DemoMenuContext.tsx`, opened via long-press on version text / Account button |
| Scaffolds registered | ✓ | `docs/frontend/SCAFFOLD_REGISTER.md` |
| 4 tabs (D20) | ✓ | `MainTabs` = Home · Deliveries · Alerts · Account |
| Typed params, no untyped navigate | ✓ (new code) | typed `RootStackParamList`/`NavigatorScreenParams`; `getParent<NativeStackNavigationProp<RootStackParamList>>()`; existing `HomeScreen` still `navigation: any` (pre-existing, §7) |
| Block Back on Processing | ✓ | `beforeRemove` prevent + `gestureEnabled:false` |
| Replace→Tracking after success | ✓ | `PayResultScreen` success → `root.navigate('Tracking', { screen:'TrackingHome', … })` |
| Terminal→Details, active→Tracking | ✓ | `AlertsScreen` routes terminal→`POD`, active→`TrackingHome` |
| Design Gallery stays `__DEV__`, linked from Demo menu | ✓ | route gated by `__DEV__`; "Open Design Gallery" button in Demo menu |
| Rider & Admin untouched | ✓ | no rider/admin source edits |

## 7. Deviations and why

1. **Processing screen uses a "Simulate result" button, not a timer** — the data rules forbid `setTimeout`/`new Promise` in screens. Real payment state machine arrives in Phase 7.
2. **Temporary mock session** is seeded in mock mode by calling the mock Auth port (`verifyOtp`) so the tree is reachable without OTP; Phase 4 replaces this.
3. **Existing `HomeScreen` reused unchanged except the one navigate rename** — it still has `navigation: any` and literal colours (pre-existing, deprecated theme). Full retype/polish is Phase 5.
4. **`delivery/:id` deep link maps to `TrackingHome`** (placeholder) — the real tracking detail is Phase 8.
5. **Deliveries/Alerts/Account/TrackByNumber are "real shells over ports"** (they query the data layer with loading/empty/error states), not pure scaffolds; they are still registered in the scaffold list for completion in later phases.
6. **`linking as never` cast** at the `NavigationContainer` boundary (React Navigation's `LinkingOptions` typing is stricter than our param lists); the config itself is fully typed.
7. BottomSheet/Dialog remain RN `Modal` (Phase 2 decision), unchanged.

## 8. Ledger rows added / "Needs decision"

- **No new rows.** Master-rule behaviours applied: mock enforces the intended role rules (SC-17) and tracking-requires-session; naira everywhere; no maps/GPS.
- Open items unchanged: SC-2, SC-5, SC-8, SC-16 (closed frontend-side), SC-17, admin-login.

## 9. Scaffolds still present

See `docs/frontend/SCAFFOLD_REGISTER.md`. Summary: `ScreenScaffold` + 12 placeholder routes (NewDelivery Pickup/Dropoff/Package/Sender/Review/Fare/PaySummary; Tracking `Timeline`/`POD`/`Failed`/`Returned`/`CancelFlow`). The Design Gallery is a permanent `__DEV__` dev tool, not a scaffold.

## 10. Known issues, risks, open questions

- **Deep links not exercised on a device here** (no emulator); config type-checks and the app bundles. Manual test commands in §11.
- **Auth screens remain wired to axios**; in mock mode the real OTP flow won't succeed — this is why the temporary mock session exists (Phase 4 rewires auth to the port).
- **Onboarding is shown on every cold start** (`onboardingSeen` is in-memory, not persisted) until Phase 4 adds storage.
- **`TrackingHome`/`Timeline`/`POD` are placeholders**, so Alerts/Deliveries taps land on a branded placeholder (expected at this phase).
- Old screens `TrackingScreen.tsx`, `HistoryScreen.tsx`, `ProfileScreen.tsx`, `NewDeliveryScreen.tsx` are now **unreferenced** by the navigator (kept in the tree; Phase 6–11 replace them). No dead navigation, but unused files remain.

## 11. How a human verifies this phase manually

1. `cd apps/shared && npm run typecheck && npm test` → clean / 68 passed.
2. `cd apps/customer && npm run typecheck && npx expo export --platform android` (same for rider) → clean + bundle. `cd apps/admin && npm run build && npm run lint`.
3. On a device (Expo Go): first launch → **Onboarding slides** → **Welcome** → **Get started** → 4 tabs. Tap each tab; open Home's "New Delivery" (modal) and step through to Processing (back is blocked) → Result → "Track this delivery".
4. **Deep links:**
   - `npx uri-scheme open "trustlink://track/TLK-2026-001" --android` → Track-by-number result.
   - `npx uri-scheme open "trustlink://delivery/del-005" --android` → Tracking (placeholder).
   (iOS: `--ios`.)
5. Confirm every tab/stack screen shows with a way back.

## 12. Route table (route · params · entry points)

| Route (stack) | Params | Entry points |
|---|---|---|
| `Onboarding → Slides` | — | First cold launch (initial route) |
| `Onboarding → Welcome` | — | Slides "Skip"/"Get started"; version text (long-press → Demo menu) |
| `Auth → PhoneEntry` | — | Welcome "I already have an account"; Account "Sign out" |
| `Auth → OtpVerification` | `{ phone; role?; purpose }` | PhoneEntry (unchanged auth internals) |
| `Auth → ProfileSetup` | `{ phone; role }` | OtpVerification (unchanged) |
| `Main → Home` (tab) | — | Welcome "Get started"; Result "Done" |
| `Main → Deliveries` (tab) | — | Tab bar; Home "History" quick action |
| `Main → Alerts` (tab) | — | Tab bar |
| `Main → Account` (tab) | — | Tab bar |
| `NewDelivery → Pickup` (modal root) | — | Home "New Delivery"; Deliveries empty state |
| `NewDelivery → Dropoff/Package/Sender/Review` | — | sequential (scaffolds) |
| `NewDelivery → Fare / PaySummary` | — | sequential (scaffolds) |
| `NewDelivery → Processing` | — | PaySummary (back blocked) |
| `NewDelivery → Result` | `{ status; deliveryId? }` | Processing "Simulate result" |
| `Tracking → TrackingHome` | `{ deliveryId? }` | Home "Track Package"/"View All"; Deliveries item; Alerts (active); Result "Track this delivery"; deep link `delivery/:id` |
| `Tracking → TrackByNumber` | `{ trackingNumber }` | Deep link `track/:trackingNumber` |
| `Tracking → Timeline` | `{ deliveryId }` | placeholder entry (Phase 8) |
| `Tracking → POD` | `{ deliveryId }` | Alerts (terminal); Deliveries completed item |
| `Tracking → Failed / Returned / CancelFlow` | `{ deliveryId }` | placeholders (Phases 8–9) |
| `DesignGallery` (`__DEV__` only) | — | Demo menu → "Open Design Gallery" |

### How to open the Demo menu and Design Gallery on a phone (right now)

- **Demo menu (all builds, incl. Expo Go):**
  1. On **Welcome**: long-press the grey text **“Version 0.1.0 · demo build”**.
  2. On **Account** tab: tap **“Open demo menu”**, or long-press **“TrustLink Customer · Version 0.1.0”**.
  It opens a bottom sheet with: scenario chips, active-delivery rows (**Advance** + **recipient code**), Theme (System/Light/Dark), **Reset data**, and **Open Design Gallery** (dev only).
- **Design Gallery (dev/Expo Go only — `__DEV__`):** open the **Demo menu** → tap **“Open Design Gallery”**. (If the Demo menu is unreachable, temporarily add `initialRouteName="DesignGallery"` to the root `RootStack.Navigator` in `apps/customer/src/navigation/AppNavigator.tsx` and reload; revert after.)

## 13. Proposed commit message and file list

```
feat(frontend): phase 3 customer navigation & shell

- add typed navigation tree: Root, Onboarding, Auth, MainTabs (Home/Deliveries/Alerts/Account),
  NewDelivery modal stack, Tracking stack; deep links (track/:trackingNumber, delivery/:id)
- add session gate with temporary mock session; custom TabBar via design-system TabBar
- add Demo menu (all builds; long-press version text) with scenario/advance/reset/theme/recipient codes
- link Design Gallery from the Demo menu; add ScreenScaffold placeholders + SCAFFOLD_REGISTER
- add demo controls to the shared mock layer (advanceDelivery, recipientCodes, scenario swap)
```
**Files to stage:**
```
apps/customer/App.tsx
apps/customer/src/navigation/AppNavigator.tsx
apps/customer/src/navigation/types.ts
apps/customer/src/session/SessionContext.tsx
apps/customer/src/demo/DemoMenuContext.tsx
apps/customer/src/components/ScreenScaffold.tsx
apps/customer/src/components/PlaceholderScreen.tsx
apps/customer/src/hooks/index.ts
apps/customer/src/screens/HomeScreen.tsx
apps/customer/src/screens/DeliveriesScreen.tsx
apps/customer/src/screens/AlertsScreen.tsx
apps/customer/src/screens/AccountScreen.tsx
apps/customer/src/screens/TrackByNumberScreen.tsx
apps/customer/src/screens/onboarding/OnboardingSlidesScreen.tsx
apps/customer/src/screens/onboarding/WelcomeScreen.tsx
apps/shared/src/data/createDataLayer.ts
apps/shared/src/data/mock/index.ts
apps/shared/src/data/mock/store.ts
docs/frontend/SCAFFOLD_REGISTER.md
docs/frontend/reports/PHASE-3-REPORT.md
```
Do **not** stage `.commandcode/**`.

STOPPED. Awaiting approval for the next phase.
