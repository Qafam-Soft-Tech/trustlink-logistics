# TrustLink — Contract Ledger

Phase 0 deliverable. This is the running register of spec/behaviour conflicts and the frontend↔backend endpoint classification. Rows marked **Needs decision** require founder input. Behaviour follows `docs/REQUIREMENTS.md` unless a row says otherwise (AGENTS rule 5). Backend is frozen.

---

## A. Spec Conflict Register (SC-1 … SC-15, from Amendment Pack v2 §4)

| ID | Conflict | UI behaviour chosen | Decision | Status |
|---|---|---|---|---|
| SC-1 | Roadmap mentions live tracking/map autocomplete; REQUIREMENTS §9 defers live GPS | Status-based tracking, static route card, no maps | D6 | Resolved (no maps in R1) |
| SC-2 | Cancellation: FR-C11 (partial ASSIGNED→PICKED_UP, full after) vs §6 (cancel only from REQUESTED/SEARCHING/ASSIGNED) vs notification fee table (through IN_TRANSIT; 50/75/full) | Follow the **preview endpoint / fee table** (50/75/full) | D14 | **Needs decision** (fee tiers differ from FR-C11) |
| SC-3 | Redelivery: spec FAILED→ASSIGNED "automatic"; code resets to SEARCHING, admin-only; transition map allows only FAILED→RETURNED | Follow code (admin schedules redelivery → SEARCHING) | D15 | Resolved (follow code) |
| SC-4 | FR-R07: ASSIGNED only after rider acknowledgement; code sets ASSIGNED on admin assign, acknowledge is a no-op | Follow code; mock stores `acknowledgedAt` | D15 | Resolved (follow code) |
| SC-5 | OTP expiry 5 min (spec) vs 10 min (code + SMS text) | UI uses **5 min** (`OTP_EXPIRY_SECONDS = 300`) | D4 | **Needs decision** (code change backend-side deferred) |
| SC-6 | Weight "bracket" (spec) vs numeric kg with tiers to 25 kg (code) | Chips ≤1/≤5/≤10/≤25 kg → send upper-bound numeric `packageWeight` | D16 | Resolved (chips → kg) |
| SC-7 | Phone not normalised on backend (raw-string lookup; only Termii converts to 234) | One `toCanonicalPhone()`; canonical = `080xxxxxxxx` (what screens send today) | D17 | Resolved |
| SC-8 | FR-C05 "no request until fare accepted" vs backend create-then-fare; fare needs `distanceKm` the client can't get without maps | Flow: quote → accept → create → pay; mock distance from a fixture table | — | **Needs decision** (distance source) |
| SC-9 | Address: spec lat/lng/landmark_note vs code street/area/city/state; no LGA | Use street, landmark, area, city, state (city/state fixed FCT/Abuja for R1) | — | Resolved (per §10) |
| SC-10 | Spec `/v1/...` vs code `/api/...` | Use `/api` | — | Resolved |
| SC-11 | Customer/Rider apps store no token and send no Authorization header | SessionProvider: token in `expo-secure-store` + axios request interceptor | D19 | Resolved (plan) |
| SC-12 | No rider decline endpoint; FR-A03 reassign on unacknowledged timeout | Rider can Acknowledge or "call dispatch"; admin reassigns | — | Resolved (follow code) |
| SC-13 | FR-C09 push/SMS on every transition; code only `console.log`s | In-app notifications only; SMS-fallback copy; push DEFERRED | — | Resolved (defer push) |
| SC-14 | Missing routes `/auth/admin/login`, `/admin/settings/*`, `/deliveries/history`, `/rider/earnings*`; wrong client routes `/jobs/*`, `/rider/kyc`, `/users/profile` | Api adapter uses real routes; missing ones throw `NotSupportedByBackendError` | — | Resolved (frontend adapter) |
| SC-15 | `GET /deliveries` reported "wired" but with no token likely 401 | **Verified:** requires JWT (class-level `JwtAuthGuard`, `delivery.controller.ts:45`) | D19 | Resolved |

### Additional rows observed in Phase 0 (new)

| ID | Conflict / observation | UI behaviour chosen | Status |
|---|---|---|---|
| SC-16 | `InitializePaymentDto.amount` documented "in kobo", but fares are **naira decimals** (`DEFAULT_PRICING_CONFIG`); payment entity comment also says kobo | Frontend sends **amount in kobo** (`ndaFare × 100`) pending backend confirmation — do **not** hardcode until decided | **Needs decision** |
| SC-17 | `@Roles(...)` is enforced only where `RolesGuard` is present (only `UsersController`). All other controllers use `JwtAuthGuard` alone, so declared roles (admin/rider/customer) are **not enforced** at the guard | Frontend still restricts by declared role; treat backend enforcement as untrusted for now | **Needs decision** (security) |

---

## B. Endpoint classification (frontend ↔ backend)

Classification: **WORKS** · **NEEDS FRONTEND FIX** · **NEEDS BACKEND FIX** · **DEFERRED** · **UNKNOWN**.

| Client surface | Backend route | Classification | Decision / SC |
|---|---|---|---|
| Auth screens (PhoneEntry/OTP/ProfileSetup) | `POST /auth/signup|login|verify-otp|verify-login-otp|resend-otp|profile/setup` | **WORKS** (data) — add token persistence | D19 / SC-11 |
| Customer Tracking | `GET /deliveries` | **NEEDS FRONTEND FIX** (shape, polling, null-safety; needs token) | D1 / SC-15 |
| Customer NewDelivery | `POST /deliveries` | **NEEDS FRONTEND FIX** (payload: `pickupStreet`, numeric `packageWeight`; missing fare+pay steps) | D16 / SC-6, SC-8 |
| Customer History | `GET /deliveries/history` | **NEEDS FRONTEND FIX** (use `GET /deliveries`) | SC-14 |
| Customer Profile | `PUT /users/profile` | **NEEDS FRONTEND FIX** (use `PUT /auth/profile`) | SC-14 |
| Rider Profile | `GET/PUT /rider/profile`, `PUT /rider/profile/status` | **WORKS** | — |
| Rider Jobs accept/start | `POST /jobs/:id/accept`, `/jobs/:id/pickup` | **NEEDS FRONTEND FIX** (use `POST /dispatch/:id/acknowledge`, `PUT /deliveries/:id/pickup`) | SC-14 |
| Rider KYC | `POST /rider/kyc` | **NEEDS FRONTEND FIX** (use `POST /kyc/submit`; fix stub `Image`) | SC-14 |
| Rider Earnings | `GET /rider/earnings`, `POST /rider/earnings/withdraw` | **DEFERRED / REMOVE** (out of R1 scope) | D7 |
| Admin login | `POST /auth/admin/login` | **NEEDS BACKEND FIX** (endpoint + seed/credentials) | SC-14 |
| Admin settings save | `PUT /admin/settings/:section` | **NEEDS BACKEND FIX** (or make settings frontend-only) | SC-14 |
| Fare quote | `POST /pricing/calculate` | **UNKNOWN** (no caller yet; needs `distanceKm`) | SC-8 |
| Payments | `POST /payments/initialize`, `GET /payments/:reference`, `POST /payments/verify/:reference`, webhooks | **UNKNOWN** (no caller; amount-units question) | SC-16 |
| Dispatch | `GET /dispatch/board`, `PUT /dispatch/:id/assign|reassign`, `GET /dispatch/my-queue`, `POST /dispatch/:id/acknowledge` | **UNKNOWN** (no caller yet) | D10 |
| Execution/POD | `PUT /deliveries/:id/pickup|in-transit`, `POST /deliveries/:id/complete|failure|redelivery`, `GET /deliveries/:id/proof` | **UNKNOWN** (no caller; recipient OTP not real) | SC-3 |
| Cancellation | `GET /notifications/cancellation-preview/:deliveryId`, `POST /notifications/cancel/:deliveryId` | **UNKNOWN** (no caller) | D14 / SC-2 |
| Tracking by number | `GET /deliveries/track/:trackingNumber` | **NEEDS FRONTEND FIX** — requires token (not public) | SC-15 |
| Issues | `POST /issues`, `GET /issues*`, `PUT /issues/:id/*` | **UNKNOWN** (no caller) | — |
| Notifications | `GET /notifications`, `POST /notifications/send` | **UNKNOWN / DEFERRED** (push deferred) | SC-13 |
| Admin users/riders/KYC | `GET /users*`, `PUT /users/:id/kyc|toggle-active`, `GET/PUT /kyc/*` | **UNKNOWN** (admin UI mock) | D10 |
| Cancellation (alt path) | `POST /deliveries/:id/cancel` | **DEFERRED** (use preview/cancel-with-fee instead) | SC-2 |

---

## C. Decision index (D1 … D20, Amendment Pack v2 §1)

| ID | Decision |
|---|---|
| D1 | Add `@tanstack/react-query` v5 to Customer and Rider |
| D2 | Approved deps only: react-query, async-storage, expo-secure-store, @expo-google-fonts/inter, vitest (shared); use `npx expo install` |
| D3 | One central mock latency (`mockConfig.latencyMs`, default 400; 0 in tests); no timers in screens/hooks |
| D4 | OTP expiry 5 min (UI); mock OTP fixed demo code shown only in demo mode |
| D5 | Single hosted-checkout hand-off; no cash/pay-on-pickup; checkout sheet has Card / Bank transfer tabs (test mode) |
| D6 | No map in R1; status-first with static route summary |
| D7 | Rider Earnings removed (screen, tab, API calls) |
| D8 | Git: human makes baseline commit; CommandCode proposes then commits on approval only |
| D9 | Font: Inter; verify ₦ glyph, else system font for amounts |
| D10 | Admin lean: Dashboard, Dispatch Board, Deliveries, Riders+KYC, Users, Issues, Pricing, small Reports |
| D11 | Excluded from R1 UI: ratings, scheduling, chat, saved cards, notification prefs, delivery instructions, business accounts |
| D12 | `vitest` in `apps/shared` for pure logic only |
| D13 | Demo on physical device (Expo Go) + backup video |
| D14 | Cancellation follows the code's preview/fee table (SC-2) |
| D15 | Redelivery admin-only; second failure → RETURNED; no customer redelivery button |
| D16 | Weight chips = tier maxima ≤1/≤5/≤10/≤25 kg → upper bound numeric kg |
| D17 | One `toCanonicalPhone()`; canonical = what screens send today (`080…`); display `0803 123 4567` |
| D18 | Each phase writes `docs/frontend/reports/PHASE-N-REPORT.md` + echoes in chat; conventional commits |
| D19 | SessionProvider: token in `expo-secure-store`, axios interceptor |
| D20 | Customer tabs 5 → 4 (Home · Deliveries · Alerts · Account); New Delivery = modal, Tracking = stack screen |

---

## D. Needs decision (summary)

1. **SC-2 / D14** — confirm cancellation fee tiers (50/75/full vs FR-C11 wording).
2. **SC-5 / D4** — confirm UI shows 5-min OTP countdown while backend expires at 10 min.
3. **SC-8 / SC-6** — source of `distanceKm` for fare without maps (fixture table acceptable for demo?).
4. **SC-16** — payment `amount` units (kobo vs naira).
5. **SC-17** — backend role enforcement gap (`@Roles` decorative outside `UsersController`); accept as-is or require backend fix.
6. **Admin login** — backend endpoint + seed credentials, or interim frontend mock (Phase 4).

## E. Backend issues deferred (not blocking frontend, tracked here)
- Signup DTO validation missing (interfaces, no class-validator).
- Phone not normalised server-side.
- OTP request rate-limiting absent; Redis unused.
- `acknowledgedAt` absent on deliveries.
- Recipient OTP for POD not generated/delivered.
- Cancellation endpoint inconsistency (`/deliveries/:id/cancel` vs `/notifications/cancel`).
- Role guard not applied outside `UsersController`.
