# TrustLink Frontend Plan — Amendment Pack v2

Date: 2026-10-07. Based on the uploaded project zip (read-only inspection) plus `docs/REQUIREMENTS.md`.
This pack **replaces** v1 Parts 2, 4, 5, 6, 7, 8, 9, 10 and 14 where they differ. Everything else in v1 stands
(Parts 1, 3 principle, 11–13, 16–19 as amended here and in files 02 and 03).

Recommended repo location: `docs/frontend/plan/` (all three files).

---

## 1. Decisions (all resolved by recommendation)

| ID | Decision | Reason |
|---|---|---|
| D1 | Add `@tanstack/react-query` v5 to Customer and Rider | Same major as Admin; loading/error/refetch/polling (FR-C08 ≤10s) for free; clean swap to the real API |
| D2 | Approved new dependencies, nothing else: `@tanstack/react-query` (customer, rider) · `@react-native-async-storage/async-storage` (flags: onboarding, theme, demo scenario) · `expo-secure-store` (session token) · `@expo-google-fonts/inter` (with the already-installed `expo-font`) · `vitest` (devDependency of `apps/shared` only). Use `npx expo install` for Expo-managed ones. **Not approved:** react-native-svg, expo-location, expo-notifications, expo-image-picker for Customer, any map/chart/state library, zod | Reanimated 4.6, gesture-handler, expo-font, linear-gradient, vector-icons, safe-area are already installed. Rider already has expo-image-picker |
| D3 | One central mock latency (`mockConfig.latencyMs`, default 400, 0 in tests); no timers in screens or hooks | Skeletons need visible loading |
| D4 | UI follows the spec: OTP expiry 5 min (`OTP_EXPIRY_SECONDS = 300`). Backend currently uses 10 (logged as SC-5). Mock OTP is a fixed demo code shown as a hint only in demo mode | REQUIREMENTS wins (AGENTS rule 5) |
| D5 | Single hosted-checkout hand-off (Paystack/Flutterwave per FR-C06). **No** cash/pay-on-pickup (§9). No payment-method picker screen. Mock checkout sheet has "Card" and "Bank transfer" tabs, labelled test mode | Methods are provider-controlled; spec is silent |
| D6 | **No map in R1.** Tracking is status-first with a static route summary (areas, distance, ETA text). No SVG map, no animated marker, no location permission anywhere | REQUIREMENTS §9 defers live GPS |
| D7 | Rider Earnings is removed: Phase 12 deletes `apps/rider/src/screens/EarningsScreen.tsx`, its tab and its API calls, and reports it | Out of R1 scope (§9, FR-R11) |
| D8 | Git: **you** make the baseline commit (section 2). CommandCode never commits on its own. At phase end it proposes a conventional-commit message and exact file list; after your approval it commits only those files with your message verbatim, then shows `git log --oneline -3`. Branches: `fe-phase-N-short-description` from `fe-baseline` (AGENTS.md pattern adapted; `phase-N-` names were used by backend phases). No remote, so no PRs | Matches your CommandCode habits |
| D9 | Font: Inter. Phase 2 verifies the ₦ glyph renders; if not, fall back to the system font for amounts | Polish with one family |
| D10 | Admin lean: Dashboard, Dispatch Board, Deliveries, Riders + KYC review, Users, Issues, Pricing, one small Reports page | Cut-line |
| D11 | Excluded from R1 UI: ratings, scheduling, chat, saved cards, notification preferences, delivery-instructions field, business accounts | Not in REQUIREMENTS |
| D12 | `vitest` in `apps/shared` for pure logic only (state machine, fare, validators, formatters) | Keeps RN apps free of a test runner |
| D13 | Demo on a physical device in Expo Go (all installed native libs are Expo-bundled) plus a recorded backup video. Phase 17 verifies on device. No dev build unless a library forces it | Lowest-friction demo |
| D14 | Cancellation follows the **code's preview/fee table**: REQUESTED/SEARCHING free; ASSIGNED 50%; PICKED_UP 75%; IN_TRANSIT full fee; DELIVERED/FAILED/RETURNED/CANCELLED not cancellable. The UI is driven by the preview's `canCancel / fee / refundAmount / reason`, never hardcoded. Conflict logged as SC-2 | The UI will call the preview endpoint |
| D15 | Redelivery is **admin-only** (`POST /deliveries/:id/redelivery` has `@Roles(ADMIN)`). Customer sees an informational "TrustLink will arrange one redelivery" on FAILED. Admin Dispatch Board has "Schedule redelivery" → status SEARCHING → assign. Second failure → RETURNED automatically. **No customer redelivery button** | Verified in `delivery.controller.ts` |
| D16 | Weight UI = chips from the pricing tier maxima: ≤1, ≤5, ≤10, ≤25 kg. Sends the chip's upper bound as numeric `packageWeight`. Document defaults to ≤1 kg, Parcel to ≤5 kg | DTO is numeric kg; spec says "bracket" |
| D17 | One `toCanonicalPhone()` util. Canonical form = whatever the existing auth screens send today (Phase 0 reads and reports it), so existing dev accounts aren't orphaned. Display as `0803 123 4567` | Backend does not normalise (SC-7) |
| D18 | Each phase writes `docs/frontend/reports/PHASE-N-REPORT.md` and echoes it in chat; itemised per-file and per-check counts; conventional commits | Matches your CommandCode taste file |
| D19 | Customer and Rider get a SessionProvider: token in `expo-secure-store`, attached via an axios interceptor in `utils/api.ts` (frontend-only change) | The apps currently store no token and send no Authorization header |
| D20 | Customer tabs change from 5 (Home, New Delivery, Tracking, History, Profile) to 4: **Home · Deliveries · Alerts · Account**. New Delivery is a full-screen modal flow; Tracking is a stack screen | Tracking needs an id, not a tab |

---

## 2. Two manual steps for you

**a) Baseline commit (before Phase 0).** Review `git status` first.
```
git switch -c fe-baseline
git add -A
git commit -m "chore: snapshot working tree before frontend-first track"
git log --oneline -3
```
`backend/.env` is gitignored. Do not force-add it.

**b) Secrets hygiene.** `backend/.env` was inside the zip you shared. If the commented-out Termii key was live, rotate it. Leave `.env` out of future archives.

---

## 3. Verified facts from the zip (replace v1 "unknowns")

- **Money:** naira decimals (not kobo). Pricing defaults: base ₦500, ₦150/km, ₦100/kg, minimum ₦1,000; weight tiers max 1/5/10/25 kg with multipliers 1.0/1.5/2.0/3.0; distance bands max 5/15/50 km with multipliers 1.0/1.2/1.5. Fare = max(base + km×rate×bandMult + kg×rate×tierMult, minimum). Example: 4 km, 2 kg → 500 + 600 + 300 = ₦1,400.
- **Delivery fields:** `trackingNumber` (e.g. TLK-2024-001), pickup/dropoff `Street, Landmark, Area, Latitude, Longitude`, `packageType` (document | parcel), `packageWeight`, `packageDescription`, `senderName/Phone`, `recipientName/Phone`, `status`, `failureReason`, `redeliveryAttempts`, timestamps, `fare`, `paymentReference`. Events: `status, actorRole, notes, lat/lng, createdAt`. **No** delivery-instructions field.
- **Address entity:** `label, street, landmark, area, city, state, country, lat/lng, isDefault`. **No** LGA/Area Council.
- **POD:** `photoUrl, recipientOtp, recipientName, recipientPhone, notes, lat/lng`.
- **Roles:** cancel = customer only; redelivery = admin only; assign/reassign = admin; failure and pickup/in-transit = rider (or access-checked).
- **Assignment:** admin `assignRider` sets ASSIGNED immediately. `acknowledge` does not change status (code comment: "could add acknowledgedAt").
- **Enums:** KycDocumentType = nin, id_front, id_back, selfie, vehicle_registration. VehicleType = motorcycle, van, truck. RiderStatus = online, offline, on_trip. IssueType = delivery_issue, payment_issue, rider_issue, other. IssueStatus = open, in_progress, resolved, closed. IssuePriority = low, medium, high, urgent. NotificationChannel = push, sms, email (notifications always carry a `deliveryId`).
- **Customer app:** 5 tabs, each a single-screen stack; static light-only `theme` object imported directly (`theme.colors.navy`); no token storage; no Authorization header; no typecheck/lint scripts; Expo ~57, RN 0.86.3, React 19.2.3, TS ~6.
- **Shared package:** `theme/index.ts` (140 lines), `components/primitives.tsx` (451), `components/layout.tsx` (352); no tsconfig; TS ~5.3 and React types 18 while apps use 19/6.
- **Admin:** Vite + TanStack Query + react-router; own `styles/theme.css`; `oxlint`; **does not import `@trustlink/shared`**.
- **Contrast:** existing `textTertiary` (#9ca3af) is ~2.6:1 on white; existing semantic success/warning (#10b981, #f59e0b) are fine as fills/icons but fail as small text on white.

---

## 4. Spec Conflict Register (seed for `CONTRACT_LEDGER.md`)

| ID | Conflict | UI behaviour chosen |
|---|---|---|
| SC-1 | Roadmap mentions live tracking/map autocomplete; REQUIREMENTS §9 defers live GPS | Status-based tracking, static route card, no maps |
| SC-2 | Cancellation: FR-C11 (partial ASSIGNED→PICKED_UP, full after) vs §6 (cancel only from REQUESTED/SEARCHING/ASSIGNED) vs notification fee table (through IN_TRANSIT; 50/75/full) | Follow preview endpoint / fee table (D14); needs founder decision |
| SC-3 | Redelivery: spec FAILED→ASSIGNED and "automatic"; code resets to SEARCHING, admin-only; transition table allows only FAILED→RETURNED | Follow code (D15) |
| SC-4 | FR-R07: ASSIGNED only after rider acknowledgement; code sets ASSIGNED on admin assign, acknowledge is a no-op on status | Follow code; mock stores `acknowledgedAt` |
| SC-5 | OTP expiry 5 min (spec) vs 10 min (code and SMS text) | UI uses 5 (D4) |
| SC-6 | Weight "bracket" (spec) vs numeric kg with tiers to 25 kg (code) | Chips → upper-bound kg (D16) |
| SC-7 | Phone not normalised on the backend (lookup by raw string; only Termii client converts to 234) | `toCanonicalPhone()` (D17) |
| SC-8 | FR-C05 "no request until fare accepted" vs backend create-then-fare; fare needs `distanceKm` which the client cannot get without Maps | Flow: quote → accept → create → pay; mock distance from a fixture table |
| SC-9 | Address: spec has lat/lng/landmark_note; code has street/area/city/state; no LGA | Street, landmark, area, city, state (fixed FCT/Abuja) |
| SC-10 | Spec `/v1/...` vs code `/api/...` | Use `/api` |
| SC-11 | Customer/Rider apps store no token and send no Authorization header | D19 |
| SC-12 | No rider decline endpoint; FR-A03 reassign on unacknowledged timeout | Rider can acknowledge or "call dispatch"; admin reassigns |
| SC-13 | FR-C09 push/SMS on every transition; code only logs | In-app notifications only; SMS-fallback copy; push DEFERRED |
| SC-14 | Missing routes: `/auth/admin/login`, `/admin/settings/*`, `/deliveries/history`, `/rider/earnings*`; wrong client routes: `/jobs/*`, `/rider/kyc`, `/users/profile` | Api adapter uses real routes; missing ones throw `NotSupportedByBackendError` |
| SC-15 | Customer `GET /deliveries` was reported as wired; with no token it likely returns 401 | Verify in Phase 0, do not assume |

---

## 5. Corrected sections

### Part 2 (delta)
Add to FRONTEND BLOCKER: **FB10** static light-only theme must become a ThemeProvider (Phase 2); **FB11** no session/token handling (Phase 4); **FB12** no typecheck scripts (Phase 0); **FB13** shared package has no tsconfig and mismatched TS/React types (Phase 0). Remove FB7 (maps) — not needed.
Add to BACKEND DEFERRED: signup validation; phone normalisation; OTP rate limit; `acknowledgedAt`; cancellation rule alignment; redelivery state-machine alignment; weight bracket support; distance computation with Maps.

### Part 3 (delta)
- The mock lifecycle engine implements the **code's** behaviour (SC-3, SC-4, D14, D15), with the transition table as the real backend has it plus the `scheduleRedelivery` path.
- Demo scenarios: `happy`, `failedOnce`, `failedTwiceReturned`, `assigningDelayed`, `paymentFails`, `emptyAccount`, `offline`, `serverError`. (`noRiderFound` becomes `assigningDelayed` because dispatch is manual.)
- No `TrackingMap`. Replace with `RouteSummaryCard` and `StatusTimeline`.

### Part 4 — Customer screen inventory (corrected)

**A Launch:** Splash · Onboarding (3 slides) · Welcome.
**B Auth:** PhoneEntry (signup/login) [exists] · OTP [exists] (counting, resend, wrong code with attempts left, expired, locked) · ProfileSetup [exists] (name; optional email) · explicit consent line with Terms/Privacy links (NFR-4) · AccountReady · SessionExpired sheet.
**C Home:** Home (greeting, "Send a package", active-delivery cards, track-by-number, recents, quick actions, trust strip, bell) with skeleton/empty/error/offline · TrackByNumber · NotFound.
**D Create delivery (modal):** Pickup (saved or new) · Drop-off + recipient (name, phone) · Address form (street, landmark, area, city, state fixed to FCT/Abuja) · Package (Document/Parcel, weight chips, description) · Sender contact (prefilled) · Review · out-of-area state · discard dialog · offline-on-submit with draft kept.
**E Fare & payment:** Fare quote (breakdown) + loading/error/expired · Pay summary → CheckoutSheet (test mode; Card / Bank transfer) → Processing → Success / Failed (retry) / Cancelled → Request confirmed (tracking number).
**F Status tracking:** Tracking with variants REQUESTED / SEARCHING ("Assigning your rider") / ASSIGNED / PICKED_UP / IN_TRANSIT · StatusTimeline · RouteSummaryCard · rider card (name, photo, vehicle type, from ASSIGNED — FR-C10) · call rider · share tracking · recipient-code note ("your recipient gets a delivery code by SMS") · assigning-delayed state · rider-reassigned notice · Cancel flow (preview with fee/refund, optional reason, confirm, success) · not-cancellable state.
**G Terminal:** Delivered + POD (photo, timestamp, recipient name) · Delivery unsuccessful (reason; "TrustLink will arrange one redelivery") · Redelivery scheduled (SEARCHING with attempt-2 banner) · Returned.
**H History:** Deliveries list (Active / Completed / Cancelled & Failed, search) · Details · Receipt · Send again · all states.
**I Issues & help:** ReportIssue (delivery picker, type: delivery/payment/rider/other, description) · Submitted · My issues + detail (open/in progress/resolved/closed) · Help/FAQ · Contact support.
**J Notifications:** list (delivery-bound status updates, SMS-fallback copy) · empty/error · in-app status banner.
**K Account:** Account (name, immutable phone, optional email) · Edit profile · Saved addresses · Appearance · Security (sign out) · Delete-account request · Terms · Privacy (NDPA) · About (version, tagline, demo-data note).
**L System:** offline banner · API error · session expired · maintenance (optional).

Removed from v1: location and push permission primers, "use my current location", TrackingMap, PaymentMethod screen, delivery-instructions step, notification preferences, customer redelivery request, LGA/Area Council, issue photo attachment.

### Part 5 — Rider (corrected)
- No location primer; no push primer (push DEFERRED; in-app new-job banner only).
- KYC steps exactly: NIN, ID front, ID back, selfie, vehicle registration (+ vehicle type: motorcycle/van/truck). Rider cannot go online until approved.
- Jobs: assigned by admin; **Acknowledge** (no status change; mock stores `acknowledgedAt`) or "Can't take this? Call dispatch". No decline route.
- Execution: Navigate (device maps link) → Confirm pickup (`PUT /deliveries/:id/pickup`) → In transit (`PUT …/in-transit`) → **POD requires photo + recipient-entered OTP** (wrong OTP state) → Delivered. Failure: reason from {recipient unavailable, wrong address, refused} + note.
- After first failure: job leaves the queue (FAILED); admin schedules redelivery; it reappears as "Redelivery — attempt 2 of 2". Second failure → returned-to-sender confirmation.
- Earnings removed (D7).

### Part 6 — Admin (additions)
Dispatch Board shows FAILED deliveries with **Schedule redelivery**; reassign allowed only for ASSIGNED/PICKED_UP (as in code); pricing page edits the real config keys (base fare, per-km, per-kg, minimum, weight tiers, distance bands); Reports page = deliveries per day/week, completion and cancellation rate, revenue (FR-A08).

### Part 7 — Journeys (corrected)
3. **Create:** Home → pickup → drop-off/recipient → package → sender → review. 4. **Fare:** Review → quote (distance from fixture; fare per config) → accept. 5. **Pay:** accept → create delivery (REQUESTED) → pay summary → CheckoutSheet → processing → success (→ SEARCHING by system) or failure (no chargeable delivery, FR-C06). 6. **Track:** status timeline with ≤10s polling, rider card at ASSIGNED, recipient-code note. 8. **Failure:** rider reports failure → FAILED screen with info message. 9. **Redelivery:** admin schedules → customer sees SEARCHING with attempt-2 banner; second failure → RETURNED. 10. **Cancel:** preview → reason → confirm; fee per D14; terminal states not cancellable.

### Part 8 — Navigation (changes)
```
MainTabs: Home · Deliveries · Alerts · Account   (4 tabs)
NewDeliveryStack (modal): Pickup → Dropoff → Package → Sender → Review → Fare → PaySummary → Checkout(sheet) → Processing → Result
TrackingStack: Tracking(deliveryId) · Timeline · POD · Failed · Returned · CancelFlow
```
Session gate reads the token from secure-store; logout clears it and the query cache.

### Part 9 — Design system (changes)
- **ThemeProvider migration:** introduce `ThemeProvider` + `useTheme()` with semantic role tokens (bg, surface, text, textMuted, border, primaryAction, accent, status roles). Keep the existing named tokens (`navy`, `gold`, `statusRequested`…) and keep a deprecated light-only `theme` export during the transition. Rule: **no new direct `theme.colors` imports** after Phase 2; each later phase migrates the screens it touches.
- Keep the existing status colours; add accessible text variants for badges (verify ≥4.5:1).
- Fix `textTertiary` via a new `textMuted` token.
- Components: remove `TrackingMap`; add `RouteSummaryCard`, `StatusTimeline`, `FareBreakdown`, `CheckoutSheet`, `PodCard`.
- Dark palette and contrast rules from v1 Part 9 stand.

### Part 10 — Nigerian UX (changes)
Address = street, landmark ("nearest bus stop"), area (district, e.g. Wuse 2, Maitama), city, state (fixed to FCT/Abuja for R1; others show "coming soon"). No LGA field. Phone via `toCanonicalPhone()`. Weight chips mirror pricing tiers. No location permission flows.

### Part 14 — Roadmap (updated)

| # | Phase | Notes vs v1 |
|---|---|---|
| 0 | Baseline & contract snapshot | Shorter: half the unknowns are already answered; adds typecheck scripts, role matrix |
| 1 | Data boundary | Engine follows code behaviour; fixtures from real pricing defaults |
| 2 | Design system + ThemeProvider migration | Adds migration of shared primitives/layout and navigators |
| 3 | Customer navigation & shell | 4 tabs; Demo menu |
| 4 | Splash, onboarding, auth + session | Adds SessionProvider and token handling |
| 5 | Home & saved addresses | |
| 6 | Create delivery | Fare moves out; sender step added |
| 7 | Fare & payment | Quote → accept → create → pay |
| 8 | Status tracking & cancellation | No map |
| 9 | Terminal states, history, details, receipts | No customer redelivery request |
| 10 | Issues, help, notifications | No preferences, no photo |
| 11 | Account, settings, security, legal | |
| 12 | Rider A | Earnings deleted; no location |
| 13 | Rider B | POD photo + OTP |
| 14 | Admin | Schedule redelivery |
| 15 | Systemic states & scenarios | |
| 16 | Dark mode, accessibility, motion | |
| 17 | Polish & investor QA | |

Cut-line unchanged: 0–13 plus 15–17 are the demo core; cut Admin Reports and Pricing polish first.

---

## 6. AGENTS.md / roadmap addendum (add to the repo)

Add a short section to `AGENTS.md` (CommandCode will read it): *"Frontend-first track (from 2026-10-07): UI work follows `docs/frontend/plan/` and supersedes the roadmap's phase order for frontend work. Backend is frozen. AGENTS rule 1 (regression-gate) applies to backend phases only. REQUIREMENTS.md still wins on behaviour; conflicts go to `docs/frontend/CONTRACT_LEDGER.md` as 'Needs decision'."* Phase 0 proposes the exact wording and waits for your approval before editing AGENTS.md.
