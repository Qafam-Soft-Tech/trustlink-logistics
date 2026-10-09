# Phase 12 — Rider A: shell, KYC, home

Branch: `fe-phase-12-rider-shell-kyc-home`
Scope: FR-R01–R05. Earnings is out of scope (D7). Customer and Admin untouched.

---

## 1. Inspection findings (before changes)

- **The rider app was entirely legacy.** Every screen was hardcoded and talked to axios directly (`api.get('/rider/profile')`, `api.get('/rider/earnings')`, `api.post('/jobs/:id/accept')`, `api.post('/rider/kyc')`), used `theme` (not `useTheme()`), hardcoded "Mike Johnson", and carried dead handlers (`onPress={() => {}}`) for Navigation, Mark Picked Up/Delivered, call, View Receipt, View Certificate, Payment Details, Settings, Help, logout.
- **No session at all**: `App.tsx` had `QueryClientProvider + DataProvider + ThemeProvider` but **no `SessionProvider`**, and the navigator rendered `Auth` *and* `Main` in the same stack (no gating). Auth screens called `api.post('/auth/*')` directly and `navigation.replace('Main')`.
- **Wrong backend routes** in the rider UI: `POST /rider/kyc`, `POST /jobs/:id/accept`, `POST /jobs/:id/pickup`, `GET /rider/earnings`, `POST /rider/earnings/withdraw`. The real routes are `POST /kyc/submit` and the `rider/profile*` / `delivery` / `dispatch` controllers.
- **KYC had a local `Image` stub** (`function Image({...}) { return <Box style={style} /> }`) so previews never rendered, and the status was local `useState` (`'not_started' | 'pending' | ...`) — it never read the contract status.
- **Dead navigation**: `JobsScreen` called `navigation.navigate('Maps', …)` — no such route exists.
- **Tabs were Home · Jobs · Earnings · Profile**; `EarningsScreen` is explicitly out of scope (D7) and had to go with its API calls.
- **Missing plumbing**: no rider `types.ts`, no session/storage module, and `expo-secure-store` was **not installed** in the rider app (the customer app had it).
- **Reusable assets**: the shared design system, `dispatch.myQueue` / `rider.*` / `kyc.*` ports, `expo-image-picker` (already installed), rider fixtures covering all KYC states (rider‑1 approved, rider‑5 pending, rider‑7 rejected).
- **Mock gap**: `kycStatus()` always returned `submittedAt: null`, so "not started" was indistinguishable from "under review"; the rejected rider had no `kycRejectionReason`; and there were no rider-bound notifications.

## 2. Summary (≤5 lines)

- Rider shell rebuilt on a real `SessionProvider` (SecureStore) with a gated navigator and the tabs **Home · Jobs · Alerts · Profile**; `EarningsScreen`, its tab and its API calls are deleted.
- KYC is a full flow over `GET /kyc/status` + `POST /kyc/submit`: intro → NIN → ID front/back → selfie → vehicle (type + plate) → review → submit, with working `expo-image-picker` previews, then Under review / Approved / Rejected-with-reason-and-resubmit.
- Home has the online/offline toggle with a confirm dialog, a KYC gate that blocks going online until approved, the active-job card (status, route, fare, recipient, call) and the queue count.
- Jobs lists `GET /dispatch/my-queue` (read-only this phase) and Alerts lists rider notifications with SMS-fallback copy.
- 128 shared tests pass; rider and customer typecheck + bundle clean; admin build + lint clean.

## 3. Files created / modified / deleted

**Created (10)**
| Path | Why |
|---|---|
| `apps/rider/src/storage/authStorage.ts` | Rider token/user in SecureStore (+ 401 hook) |
| `apps/rider/src/session/SessionContext.tsx` | Session provider: restore, hydrate, signIn/signOut, expiry |
| `apps/rider/src/hooks/useAuth.ts` | Rider auth mutations (role `rider`) |
| `apps/rider/src/hooks/useCountdown.ts` | OTP countdown (dedicated hook, no timers in screens) |
| `apps/rider/src/navigation/types.ts` | Rider route params (auth/home/jobs/alerts/profile stacks) |
| `apps/rider/src/screens/AlertsScreen.tsx` | Rider notifications + in-app/SMS copy |
| `apps/rider/src/screens/kyc/KycOverviewScreen.tsx` | Status-aware KYC (intro / under review / approved / rejected + reason) |
| `apps/rider/src/screens/kyc/KycFormScreen.tsx` | 5-step KYC form with image previews, review and submit |
| `apps/rider/src/screens/account/EditVehicleScreen.tsx` | Vehicle type/plate/model/colour/zone edit over the rider port |
| `docs/frontend/reports/PHASE-12-REPORT.md` | This report |

**Modified (17)**
| Path | Why |
|---|---|
| `apps/rider/App.tsx` | Wrapped in `SessionProvider` |
| `apps/rider/{package.json,package-lock.json,app.json}` | Added `expo-secure-store` (approved dep) |
| `apps/rider/src/hooks/index.ts` | Queue/profile/KYC/notification hooks over the ports |
| `apps/rider/src/navigation/AppNavigator.tsx` | Rebuilt: session-gated root, 4 tabs, KYC + vehicle stacks |
| `apps/rider/src/screens/HomeScreen.tsx` | Rebuilt over ports: toggle + confirm, KYC gate, active job, queue |
| `apps/rider/src/screens/JobsScreen.tsx` | Rebuilt: real queue list, no dead handlers |
| `apps/rider/src/screens/ProfileScreen.tsx` | Rebuilt over ports: verification, vehicle, account, sign-out confirm |
| `apps/rider/src/screens/auth/{PhoneEntry,OtpVerification,ProfileSetup}Screen.tsx` | Rebuilt on ports + `signIn`, rider copy, real OTP screen |
| `apps/shared/src/data/mock/store.ts` | `kycSubmittedAt` so "not started" ≠ "under review" |
| `apps/shared/src/data/mock/scenarios.ts` | Seed rider notifications + `kycSubmittedAt` |
| `apps/shared/src/mocks/fixtures.ts` | `kycRejectionReason` for the rejected rider; `DEMO_RIDER_NOTIFICATIONS` |
| `docs/frontend/SCAFFOLD_REGISTER.md` | Note: no rider scaffolds remain |
| `docs/frontend/CONTRACT_LEDGER.md` | SC-35 (uploads), SC-36 (jobs read-only) |

**Deleted (3)**
| Path | Why |
|---|---|
| `apps/rider/src/screens/EarningsScreen.tsx` | D7 — earnings out of scope (with its `/rider/earnings*` calls) |
| `apps/rider/src/screens/KycScreen.tsx` | Replaced by the new KYC flow (had the `Image` stub + wrong route) |
| `apps/rider/src/navigation/AuthNavigator.tsx` | Superseded by the auth stack inside `AppNavigator` |

## 4. Dependencies added

- `expo-secure-store` (rider app) — **already on the approved list** (used by the customer app). Installed with `npx expo install expo-secure-store -- --legacy-peer-deps`; `expo install --check` → "Dependencies are up to date"; bundle shows no duplicate-react-native warning.
- No others (`expo-image-picker` was already present).

## 5. Commands run with real output

```
apps/shared$ npm run typecheck             → tsc --noEmit -p tsconfig.logic.json  (clean)
apps/shared$ npm test                      → Test Files 12 passed (12) · Tests 128 passed (128)
apps/shared$ node scripts/contrast-check.mjs → ALL CHECKS PASSED
hex-literal scan (new rider files)         → (no matches)
apps/rider$    npm run typecheck           → tsc --noEmit  (clean)
apps/rider$    npx expo install --check    → Dependencies are up to date
apps/rider$    npx expo export --platform android
                                           → Android Bundled 32545ms index.ts (1499 modules) · Exported
apps/customer$ npm run typecheck           → tsc --noEmit  (clean)
apps/customer$ npx expo export --platform android
                                           → Android Bundled 31341ms index.ts (1563 modules) · Exported
apps/admin$    npm run build               → ✓ 135 modules transformed · ✓ built in 1.11s
apps/admin$    npm run lint                → Found 2 warnings and 0 errors. (policy block not hit this run)
```

## 6. Acceptance checklist

| Criterion | ✓ | Evidence |
|---|---|---|
| Rider shell + navigation (Home · Jobs · Alerts · Profile) | ✓ | `AppNavigator` tabs; custom `TabBar` from the design system |
| Auth flow reused with rider copy + SessionProvider | ✓ | `SessionProvider` + rebuilt Phone/OTP/ProfileSetup; gated root renders Auth *or* Main |
| `EarningsScreen.tsx`, its tab and API calls deleted | ✓ | File deleted, tab removed, no `/rider/earnings*` reference remains (grep clean) |
| KYC: intro, NIN, ID front, ID back, selfie, vehicle registration + type | ✓ | `KycOverviewScreen` + `KycFormScreen` (5 steps + review) |
| Working image preview | ✓ | `expo-image-picker` (gallery/camera) with `<Image>` previews (the old stub is gone) |
| Review / submit | ✓ | Review card → `POST /kyc/submit` via `kyc.submit` |
| Pending / Approved / Rejected + reason + resubmit | ✓ | Status-aware overview; rejected rider shows the fixture reason and a Resubmit action |
| Home: online/offline toggle with confirm | ✓ | `Dialog` confirm → `rider.setStatus` |
| Home: blocked until approved (KYC gate) | ✓ | Without approval the toggle is replaced by "Complete KYC verification" + warning banner |
| Home: active-job card + queue count | ✓ | First queue item (status/route/fare/recipient/call) + count badge |
| Alerts + Profile | ✓ | `AlertsScreen` (notifications) and `ProfileScreen` (verification/vehicle/account/sign-out) |
| No location and no push primers | ✓ | No `expo-location`/`expo-notifications` anywhere; banner explains push is off |
| Dead handlers replaced/removed | ✓ | No `onPress={() => {}}` in the rider screens (grep clean); `navigate('Maps')` removed |
| Api adapter uses real routes | ✓ | Screens call ports only: `POST /kyc/submit`, `GET/PUT /rider/profile*`, `GET /dispatch/my-queue` |
| Mock: riders in all KYC states | ✓ | rider‑1 approved, rider‑5 pending (not started), rider‑7 rejected (+ reason) |
| No earnings/money UI anywhere | ✓ | Grep for `earnings|withdraw|₦` in rider screens returns nothing; fares shown are delivery prices, not rider earnings |
| Every state designed | ✓ | Loading/empty/error/offline on Home, Jobs, Alerts, Profile, KYC |
| Design system only, both themes | ✓ | Shared components + `useTheme()`; the legacy `theme` import is gone; hex scan clean |

## 7. Deviations and why

- **Deleted three files rather than leaving them**: `EarningsScreen` (D7), the legacy `KycScreen` (replaced, contained the `Image` stub and the wrong `/rider/kyc` route) and the legacy `AuthNavigator` (superseded by the auth stack in `AppNavigator`).
- **`kycSubmittedAt` added to the mock state** so the UI can distinguish "not started" from "under review" using the contract's existing `submittedAt` field (no new domain field).
- **The vehicle plate is collected in the KYC vehicle step** because `SubmitKycDto` requires `vehiclePlate` (the prompt listed only vehicle type).
- **Rider notifications added to the mock** (`DEMO_RIDER_NOTIFICATIONS`) so the Alerts tab has real, rider-scoped data; the customer's 12 notifications are unchanged and still filtered per user.
- **Jobs is read-only in this phase** (queue list only, no accept/execute) — execution belongs to Phase 13 (SC‑36).
- **`expo-secure-store` installed for the rider app** (approved dependency; needed for the session).

## 8. Ledger rows added / "Needs decision"

- **SC-35 (Needs decision)** — KYC needs a document upload endpoint; the rider app submits local image URIs from `expo-image-picker`.
- **SC-36 (Resolved, scoped)** — rider jobs/alerts are read-only in Phase 12; execution is Phase 13.
- No other ledger changes.

## 9. Scaffolds still present

- Customer: Onboarding "Slides" copy (Phase 17); permanent `__DEV__` Design Gallery; Demo menu.
- **Rider: none** — all legacy screens replaced or deleted (noted in `SCAFFOLD_REGISTER.md`).

## 10. Known issues, risks, open questions

- **KYC uploads are not real** (SC‑35): local file URIs are submitted; the mock accepts them and the API path would need a storage/upload endpoint.
- **Rider can't act on a job yet** (SC‑36): no accept/acknowledge/pickup/complete in the UI (Phase 13).
- **Rider Alerts are read-only** and have no unread state (SC‑30 pattern).
- **No demo menu in the rider app** — KYC states are demoed by signing in with a rider phone that is in that state (`08050000001` approved, `08050000005` pending, `08050000007` rejected).
- **Rider sessions share the customer device flow**: signing out of the rider app clears only rider storage (separate SecureStore keys).
- **`useCountdown` is duplicated** from the customer app (a tiny hook); a shared hooks package would remove it.
- SC-2 / SC-5 / SC-8 / SC-16 / SC-17 / SC-19 / SC-20 / SC-21 / SC-22 / SC-23 / SC-26 / SC-27 / SC-30 / SC-31 / SC-33 / SC-35 remain open.

## 11. How a human verifies this phase manually

1. `cd apps/rider && npx expo start -c`, open in Expo Go.
2. Sign in with a **pending** rider (`08050000005`, OTP `482913`) → Home shows the "Verification required" banner and **Complete KYC verification** instead of the toggle. Profile → KYC → **Start verification** → NIN `12345678901` → attach ID front/back/selfie/vehicle registration (gallery or camera) → vehicle type + plate → **Review** → **Submit for review** → the overview shows **Under review**.
3. Sign out; sign in with the **approved** rider (`08050000001`) → Profile shows Approved → Home → **Go online** → confirm dialog → status badge flips to Online; the toggle shows the confirm dialog for **Go offline** too.
4. Sign out; sign in with the **rejected** rider (`08050000007`) → Profile shows Rejected → KYC shows the rejection reason and **Resubmit documents** → resubmit → Under review.
5. **Jobs** tab → the queue for that rider renders (tracking, route, fare, recipient); pull to refresh. A rider with no queue sees the empty state.
6. **Alerts** tab → rider notifications (assignment/reminder/completion) with the SMS fallback line where the channel is SMS.
7. Confirm **no Earnings tab and no money screens** anywhere; Profile → **Sign out** → confirm → returns to the rider sign-in screen and Back cannot re-enter.

## 12. Proposed commit message and file list

```
feat(rider): phase 12 rider shell, KYC flow and home

- rider: SessionProvider (SecureStore) + session-gated navigator; tabs Home / Jobs / Alerts / Profile
- rider: delete EarningsScreen, its tab and its /rider/earnings calls (D7); delete the legacy
  KycScreen (Image stub, wrong route) and the legacy AuthNavigator
- rider: rebuilt auth flow on the ports with rider copy and sign-in (OTP screen with countdown,
  resend and expiry)
- rider: KYC — intro, NIN, ID front/back, selfie, vehicle (type + plate), review, submit via
  POST /kyc/submit, then pending / approved / rejected-with-reason and resubmit
- rider: Home — online/offline toggle with confirm, KYC gate, active-job card (call recipient),
  queue count; Jobs reads dispatch/my-queue; Alerts reads notifications; Profile + Edit vehicle
- shared mock: kycSubmittedAt, rider rejection reason and rider-bound notifications
- deps: expo-secure-store (rider, approved); docs: ledger SC-35/SC-36, scaffold register note
```

Files to stage (30 — 10 created, 17 modified, 3 deleted): as listed in §3.

STOPPED. Awaiting approval for the next phase.
