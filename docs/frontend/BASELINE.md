# TrustLink — Frontend Baseline

Phase 0 deliverable. Condensed from `docs/frontend/reports/PHASE-0-REPORT.md`. Evidence is cited by file path (and line where useful). Backend is frozen; this document is documentation only.

---

## 1. Baseline summary

- **Stack:** Customer + Rider = Expo ~57 / React Native 0.86.3 / React 19.2.3 / TypeScript ~6. Admin = React 19 + Vite 8 + react-router 7 + TanStack Query (installed, unused) + `oxlint`.
- **No workspace:** each app is an independent npm project; `@trustlink/shared` via `file:../shared` (raw TS, transpiled by Metro).
- **Shared design system:** `apps/shared/src/theme/index.ts` (tokens), `components/primitives.tsx` (Box/Text/Button/Input/Card/Avatar/Badge), `components/layout.tsx` (Screen/ScrollableScreen/Header/TabBar/Divider/Row/Column/Center). No tsconfig (added now), no theme provider, light-only.
- **Navigation:** Customer root stack `Auth | Main`; Main = 5 tabs each single-screen stack. Rider same, 4 tabs + Profile stack holds Kyc. Admin router with `/login` + protected layout.
- **State/data:** only local `useState`; no context on mobile; admin has `AuthContext` (localStorage). No services/types layer anywhere.
- **Mock-heavy:** Customer Home/Profile; Rider Home/Jobs/Earnings/Kyc; **all** Admin pages are hardcoded fixtures (§8 of the Phase 0 report).
- **Auth model:** mobile stores no token and sends no `Authorization` header (`apps/customer/src/utils/api.ts`, `apps/rider/src/utils/api.ts`); admin sends `Bearer admin_token` but `/auth/admin/login` does not exist.
- **Build/run (verified Phase 0B):** customer/rider `tsc --noEmit` **pass**; customer/rider **Metro bundle pass**; admin `build` **pass**; admin `lint` **cannot run on this machine** (oxlint native binding blocked); shared `typecheck` **fails** (no `node_modules`).
- **Base URL (fixed now):** env-driven — `EXPO_PUBLIC_API_URL` (customer/rider), `VITE_API_URL` (admin); fallback `http://localhost:3000/api`.

---

## 2. Required verification questions (with evidence)

### (a) Exact phone format the auth screens send
The screens format input for display as `080 1234 5678`, then **strip spaces and send the raw 11-digit local number** (leading `0`, no `+234`). The backend does not normalise; only the Termii client converts to `234…` for SMS.
- `apps/customer/src/screens/auth/PhoneEntryScreen.tsx` — `const cleanedPhone = phone.replace(/\s/g, '')` then `api.post('/auth/login', { phone: cleanedPhone })` / `api.post('/auth/signup', { phone: cleanedPhone, role })`.
- `apps/rider/src/screens/auth/PhoneEntryScreen.tsx` — same (`role: 'rider'`).
- Canonical form for `toCanonicalPhone()` (D17) = **`08012345678`** (11 digits, no spaces, no country code). Display form = `0803 123 4567`.
- Evidence of no backend normalisation: `backend/src/modules/auth/auth.service.ts` looks up users by `where: { phone: dto.phone }` verbatim.

### (b) Payloads + token field returned by verify-otp
- **Request sent by the screens** (`OtpVerificationScreen.tsx`): `POST /auth/verify-otp` with `{ phone, code, purpose }` (`purpose` is `'signup'` or `'login'`).
  - **Note:** the backend DTO `VerifyOtpDto` is `{ phone, code }` only — `purpose` is ignored there and instead selected by the *route* (`verify-otp` uses `'signup'`, `verify-login-otp` uses `'login'`).
- **Response** (`backend/src/modules/auth/auth.service.ts` `verifyOtp` / `verifyLoginOtp`): `{ user: <sanitised User>, token: <JWT> }`. `sanitizeUser` removes `passwordHash`. JWT payload = `{ sub: userId, phone, role }`.
- **Login OTP** uses `POST /auth/verify-login-otp` with `{ phone, code }` → same `{ user, token }` shape.
- `POST /auth/profile/setup` also returns `{ user, token }`.

### (c) Does `GET /deliveries` require a token?
**Yes.** `backend/src/modules/deliveries/delivery.controller.ts:45` applies `@UseGuards(JwtAuthGuard)` at the **class** level, so every route in it (including `GET /deliveries`) requires a valid `Authorization: Bearer <jwt>`. Without it → 401. The JWT strategy (`jwt.strategy.ts`) also rejects users whose `isActive` is false.
- Same for `GET /deliveries/track/:trackingNumber` — despite the Swagger summary saying "public", the class guard means **it is NOT public** (see Contract Snapshot).

### (d) Customer/Rider role toggle in PhoneEntry
- **Customer app:** `PhoneEntryScreen.tsx` has a **Customer/Rider toggle** (`selectedRole: 'customer' | 'rider'`) shown only when signing up, and sends it: `api.post('/auth/signup', { phone, role: selectedRole })`. Login mode sends no role.
- **Rider app:** **no toggle** — `PhoneEntryScreen.tsx` hardcodes `role: 'rider'` for both signup and login navigation params.

### (e) OTP length
**6 digits.** `backend/src/modules/auth/services/otp.service.ts` `generateOtp()` = `crypto.randomInt(100000, 999999)` (always 6 digits); both OTP screens render 6 single-character inputs and require `code.length === 6`. Max 3 wrong attempts (`MAX_ATTEMPTS = 3`), expiry 10 minutes in code (spec says 5 — see `CONTRACT_LEDGER.md` SC-5).

---

## 3. Frontend Baseline facts relevant to Phase 1+

- **No data boundary:** screens call `api` (axios) or fixtures directly; there is no `services/`, `types/`, `mocks/`, or hooks layer.
- **No session:** no token storage (`@react-native-async-storage`/`expo-secure-store` not installed), no request interceptor on mobile.
- **Theme is static/light-only**; screens import `theme.colors.*` directly.
- **Typecheck scripts** now exist for customer/rider/shared (`npm run typecheck`); shared will only pass once its dependencies are installed.
- **Env-driven base URL** now in place with `.env.example` per app.

## 4. File-path index (key evidence)
- Auth screens: `apps/customer/src/screens/auth/*`, `apps/rider/src/screens/auth/*`
- Navigation: `apps/{customer,rider}/src/navigation/*`
- Shared: `apps/shared/src/{theme/index.ts,components/primitives.tsx,components/layout.tsx}`
- API clients: `apps/{customer,rider,admin}/src/utils/api.ts`
- Admin shell: `apps/admin/src/{App.tsx,main.tsx,components/AdminLayout.tsx,context/AuthContext.tsx,pages/*,styles/theme.css}`
- Backend contract: `backend/src/modules/**`
