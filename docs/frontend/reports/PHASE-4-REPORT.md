# PHASE 4 REPORT — Splash, onboarding, auth, session

Branch: `fe-phase-4-splash-auth-session` (created this phase from `3030200`; only tool-managed files were dirty).

---

## 1. Inspection findings (before changes)

- `PhoneEntryScreen`, `OtpVerificationScreen`, `ProfileSetupScreen` called `axios` **directly** (`utils/api.ts`), passed the customer/rider **role toggle**, used the deprecated `theme` with literal colours, and **stored no token**. `OtpVerificationScreen` had a hardcoded 60s resend `setInterval` **inside the screen**, no 300s expiry, no lock state.
- `utils/api.ts` had **no request interceptor** (no `Authorization` header) and only logged errors.
- `SessionContext` (Phase 3) was a **temporary in-memory mock session** seeded from the mock auth port; no persistence, `onboardingSeen` not persisted.
- Navigation: Phase 3 `RootStack` started at `Onboarding`; no Splash; Auth stack had PhoneEntry/Otp/ProfileSetup; no AccountReady.
- `toCanonicalPhone`/`isValidNigerianPhone`/`isEmail`/`formatPhone`/`PhoneInput`/`OtpInput` already exist in shared. No `OTP_EXPIRY_SECONDS` constant.
- Deps: AsyncStorage + Inter installed; `expo-secure-store` **not** installed. `apps/customer` has **no `babel.config.js`** (Expo default preset — reanimated plugin is provided by `babel-preset-expo`).
- Legacy screens `TrackingScreen/ProfileScreen/HistoryScreen/NewDeliveryScreen` were **defined but imported nowhere** (dead since Phase 3).

## 2. Summary (≤5 lines)

1. Added a Reanimated brand **Splash** that routes on session + persisted onboarding.
2. Rewired auth to the **data-layer ports** (no axios in screens): PhoneEntry (no role toggle, +234, consent links), OTP (300s countdown, resend, wrong-code/expiry/lock), ProfileSetup → AccountReady.
3. Added a **secure-store** `SessionProvider` (token + user persisted; survives restart) with `signOut` clearing the token and query cache, plus an axios **Authorization interceptor** and a global **SessionExpired** sheet.
4. Removed the dead legacy customer screens per the master rule.
5. Validated: shared typecheck + 68 tests, customer/rider typecheck, both bundles, admin build+lint — all pass.

## 3. Files created / modified / deleted (path — why)

**Created (7)**
- `apps/shared/src/domain/constants.ts` — `OTP_LENGTH`, `OTP_EXPIRY_SECONDS=300`, `DEMO_OTP`, `MAX_OTP_ATTEMPTS`.
- `apps/customer/src/storage/authStorage.ts` — SecureStore (token/user) + AsyncStorage (onboarding) + 401 handler.
- `apps/customer/src/hooks/useAuth.ts` — `useRequestOtp/useVerifyOtp/useResendOtp/useSetupProfile` over ports.
- `apps/customer/src/hooks/useCountdown.ts` — OTP countdown (timer kept out of screens).
- `apps/customer/src/screens/splash/SplashScreen.tsx` — Reanimated brand animation + routing.
- `apps/customer/src/screens/auth/AccountReadyScreen.tsx`.
- `apps/customer/src/screens/auth/SessionExpiredSheet.tsx`.

**Modified (13)**
- `apps/shared/src/domain/index.ts` — export constants.
- `apps/customer/src/utils/api.ts` — request interceptor (Bearer) + 401 → session-expired.
- `apps/customer/src/session/SessionContext.tsx` — rewritten: secure-store persistence, `signOut` clears query cache, `sessionExpired`.
- `apps/customer/src/screens/auth/{PhoneEntryScreen,OtpVerificationScreen,ProfileSetupScreen}.tsx` — port-based, restyled, no role toggle (customer fixed).
- `apps/customer/src/screens/onboarding/WelcomeScreen.tsx` — "Get started" → Auth.
- `apps/customer/src/navigation/{types.ts,AuthNavigator.tsx,AppNavigator.tsx}` — add `Splash`, `AccountReady`; initial route `Splash`; mount SessionExpired sheet.
- `apps/customer/package.json`, `package-lock.json`, `app.json` — `expo-secure-store`.

**Deleted (4)**
- `apps/customer/src/screens/{TrackingScreen,ProfileScreen,HistoryScreen,NewDeliveryScreen}.tsx` — unreferenced legacy screens (superseded by Phase 3's Tracking/Deliveries/Account/NewDelivery modal). Removed per the "no unreferenced legacy screens" rule.

**Counts:** created 7, modified 13, deleted 4.

## 4. Dependencies added

- **`expo-secure-store@~57.0.4`** (Customer) — approved (D2). Installed via `npx expo install … -- --legacy-peer-deps` with `NODE_ENV=development`; added the config plugin to `app.json`. No duplicate `react-native` (bundle module count 1528 → 1537 = only the new files).

## 5. Commands run with real output

- Shared `npm run typecheck` → clean; `npm test` → `Test Files 5 passed (5)` · `Tests 68 passed (68)`.
- Customer `npm run typecheck` → clean; `npx expo export --platform android` → `Android Bundled 18847ms index.ts (1537 modules)` (no duplicate-RN warning; Reanimated bundled).
- Rider `npm run typecheck` → clean; bundle → `Android Bundled 26466ms index.ts (1526 modules)`.
- Admin `npm run build` → `✓ built in 869ms`; `npm run lint` → `Found 2 warnings and 0 errors`.
- Grep `apps/customer/src` for hex literals / `setTimeout` / `new Promise` → **no matches** (countdown uses `setInterval` inside a hook).

## 6. Acceptance checklist

| Criterion | ✓/✗ | Evidence |
|---|---|---|
| All auth states present | ✓ | OTP: counting (`useCountdown`), resend, wrong-code with attempts left, expired, locked; **SessionExpired** sheet; AccountReady |
| Session survives restart | ✓ (code) | `authStorage` restores token+user from SecureStore on cold start (device verification pending) |
| Back works | ✓ | Auth is a native stack; result screens use replace; Processing blocks back |
| No timers in screens | ✓ | `setInterval` lives in `hooks/useCountdown.ts` |
| +234 input, OTP cells, inline errors | ✓ | `PhoneInput`, `OtpInput`, inline `Banner`/`Input error` |
| Both themes | ✓ | all new code uses `useTheme()` roles |
| Role toggle removed (customer) | ✓ | PhoneEntry sends `role: 'customer'`; no toggle UI |
| Consent line + Terms/Privacy links | ✓ | PhoneEntry (`Linking.openURL`) |
| Screens use ports, not axios | ✓ | auth screens call hooks over `data.auth` |
| Demo OTP hint (demo mode only) | ✓ | `Chip` shown when `data.source === 'mock'` |
| No dead legacy screens | ✓ | 4 deleted |

## 7. Deviations and why

1. **OTP countdown is a `setInterval` in a hook** (`useCountdown`). The data rule forbids `setTimeout`/`new Promise` *delays* in screens/hooks; a countdown needs a ticker, and the acceptance criterion is "no timers **in screens**" — so the ticker is isolated in a hook, never a fake network delay.
2. **Reanimated** used for the Splash animation (per prompt). It bundles cleanly via `babel-preset-expo` (no custom `babel.config.js`).
3. **API mode not exercised** — the backend is frozen and not running in this environment; validation is mock-mode only (permitted: "if the backend is reachable…").
4. **Deleted 4 legacy screens that were actually superseded in Phase 3** — the same-phase rule was missed in Phase 3; I removed them now to satisfy "never leave unreferenced legacy screens behind".
5. Session-survives-restart is implemented but **not device-verified** (no emulator here).

## 8. Ledger rows added / "Needs decision"

- **No new rows.** SC-5 (OTP 5 min) is now implemented frontend-side (`OTP_EXPIRY_SECONDS = 300`). SC-16/SC-17 behaviours applied. Open items unchanged: SC-2, SC-8, SC-16, SC-17, admin-login.

## 9. Scaffolds still present

Unchanged from `docs/frontend/SCAFFOLD_REGISTER.md` (NewDelivery steps, Fare/PaySummary, Tracking placeholders). Splash/AccountReady/SessionExpired are real, not scaffolds.

## 10. Known issues, risks, open questions

- **API mode untested** (backend frozen/offline). The auth port shapes are unchanged, so choosing `EXPO_PUBLIC_DATA_SOURCE=api` should work against a running backend; needs a manual pass.
- **Cold-start onboarding**: Splash → Onboarding on first run; after finishing, onboarding is persisted so subsequent starts go to Auth (or Main if a session exists).
- **Mock OTP**: any 6-digit code is accepted by the mock; the demo chip shows `482913`.
- **Reanimated** worklets are unverified at runtime (bundles fine).
- No `babel.config.js` in the app; relies on Expo defaults.

## 11. How a human verifies this phase manually

1. `cd apps/shared && npm run typecheck && npm test` → clean / 68.
2. `cd apps/customer && npm run typecheck && npx expo export --platform android` (and rider); `cd apps/admin && npm run build && npm run lint`.
3. On device (Expo Go, mock mode): Splash → Onboarding (3 slides) → Welcome → **Get started** → PhoneEntry. Tap "Log in" toggle: sign up flow → enter `08031234567` → OTP screen (countdown from 5:00, demo chip `482913`) → enter `482913` → ProfileSetup (name/email) → AccountReady → **Get started** → Main tabs. Kill and reopen the app → returns to Main (session persisted). Account → **Sign out** → returns to Auth.
4. Wrong-code path: enter `000000` three times → lock message; Resend resets attempts + countdown.
5. If a backend is reachable: set `EXPO_PUBLIC_DATA_SOURCE=api` in `apps/customer/.env`, run the backend, and repeat signup/login.

## 12. Proposed commit message and file list

```
feat(frontend): phase 4 splash, onboarding, auth & session

- add Reanimated splash with session+onboarding routing; persist onboarding flag
- rewire auth screens to data ports (no role toggle; +234 input; OTP cells; inline errors;
  consent links); OTP 300s countdown, resend, wrong-code/expiry/lock; AccountReady
- add SecureStore-backed SessionProvider (token+user persist; signOut clears token+cache)
- add axios Authorization interceptor + global SessionExpired sheet
- add OTP constants; delete 4 unreferenced legacy customer screens
```
**Files to stage:**
```
apps/shared/src/domain/constants.ts
apps/shared/src/domain/index.ts
apps/customer/app.json
apps/customer/package.json
apps/customer/package-lock.json
apps/customer/src/utils/api.ts
apps/customer/src/storage/authStorage.ts
apps/customer/src/session/SessionContext.tsx
apps/customer/src/hooks/useAuth.ts
apps/customer/src/hooks/useCountdown.ts
apps/customer/src/screens/splash/SplashScreen.tsx
apps/customer/src/screens/auth/PhoneEntryScreen.tsx
apps/customer/src/screens/auth/OtpVerificationScreen.tsx
apps/customer/src/screens/auth/ProfileSetupScreen.tsx
apps/customer/src/screens/auth/AccountReadyScreen.tsx
apps/customer/src/screens/auth/SessionExpiredSheet.tsx
apps/customer/src/screens/onboarding/WelcomeScreen.tsx
apps/customer/src/navigation/types.ts
apps/customer/src/navigation/AuthNavigator.tsx
apps/customer/src/navigation/AppNavigator.tsx
apps/customer/src/screens/TrackingScreen.tsx      (deleted)
apps/customer/src/screens/ProfileScreen.tsx       (deleted)
apps/customer/src/screens/HistoryScreen.tsx       (deleted)
apps/customer/src/screens/NewDeliveryScreen.tsx   (deleted)
docs/frontend/reports/PHASE-4-REPORT.md
```
Do **not** stage `.commandcode/**`. (Note: `apps/customer/App.tsx` was **not** changed this phase — omit it.)

STOPPED. Awaiting approval for the next phase.
