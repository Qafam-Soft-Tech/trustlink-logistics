# TrustLink Logistics — Development Roadmap (R1 MVP)

This is the execution plan for building R1. It picks up where `docs/REQUIREMENTS.md` leaves off: that file defines *what* to build (every requirement, the data model, the architecture); this file defines *in what order*, *how it's tested*, and *how it ships*.

> **Naming note:** "Phase 1" through "Phase 15" below are **build phases inside the Coding stage** of the project's overall lifecycle (Brainstorming → Research → Planning → Analysis → Design → **Coding** → Testing → Deployment → Maintenance). When Ilyas says "start phase 3" or "phase 3 complete, run regression, move to phase 4," he means the numbered phases in this document.

---

## 0. How This Document Is Used

The intended workflow, phase by phase:

1. Ilyas says: **"Start Phase N."**
   → Implement everything listed under that phase's Scope, against the acceptance criteria referenced in `docs/REQUIREMENTS.md`.
2. Ilyas says: **"Test Phase N."**
   → Run the New Tests listed for that phase (unit + integration). All must pass. Report results.
3. Ilyas says: **"Run regression."**
   → Run the ENTIRE accumulated test suite from Phase 1 through Phase N — not just the new tests. This confirms nothing earlier broke. Report results, and explicitly call out any previously-passing test that now fails.
4. Only after a clean regression run does a phase count as done. Then: **"Proceed to Phase N+1."**

If a requirement needed to complete a phase is ambiguous, missing, or contradicts `docs/REQUIREMENTS.md`, **stop and flag it** — list it under "Needs decision" in your output — rather than assuming an answer. See Section 8 (Open Assumptions) for known unresolved items already flagged.

**Scope of build:** OpenCode builds the entire system end-to-end — backend AND the full UI for the Customer app, Rider app, and Admin dashboard. There is no separate UI/UX design phase; each phase below includes both the backend work and the corresponding screens, built directly using the brand direction in `AGENTS.md` (TrustLink navy/gold, "Secure. Swift. Strategic." tone). Ilyas is a UI/UX designer himself and reviews each phase's screens for design quality as it's built — that's iterative art direction, not a separate build track.

---

## 1. Build Phases

### Phase 1 — Project Scaffolding & Environment Setup
- **Depends on:** nothing (starting point)
- **Scope:** NestJS backend with empty modules (`auth`, `users`, `deliveries`, `payments`, `notifications`); TypeORM/Prisma wired to PostgreSQL; Redis connection; `.env`-based config. Expo apps for `apps/customer` and `apps/rider` with navigation shell AND a shared theme/design-system setup (TrustLink navy `#0b1f47` + gold `#b8863a`, typography scale, base components — buttons, inputs, cards). React app for `apps/admin` with the same theme applied to a web layout shell. Root README with local run instructions.
- **New tests:** Health-check endpoint returns `200`. Backend boots and connects to Postgres + Redis without error. Each client app boots and renders its shell using the shared theme (not default/unstyled components).
- **Regression:** N/A (first phase).
- **Definition of done:** All four pieces (backend, customer app, rider app, admin app) run locally from a clean clone following only the README, and the two mobile apps + admin web app visibly share one consistent TrustLink-branded look.

### Phase 2 — Auth (Phone + OTP)
- **Depends on:** Phase 1
- **Scope:** FR-C01, FR-C02, FR-C03, FR-R01 (`docs/REQUIREMENTS.md` §2.1, §3.1). OTP request/verify, JWT issuance, profile read/update, phone immutability, one-role-per-phone rule.
- **Screens:** Phone entry → OTP verification → profile setup, built in both the Customer and Rider apps; profile view/edit screen.
- **New tests:** Unit tests for OTP generation/expiry/hashing logic. Integration tests: signup happy path, expired OTP, wrong OTP, duplicate phone+role, protected-route rejection without token.
- **Regression:** Phase 1 health-check and boot tests still pass.
- **Definition of done:** All FR-C01/C02/C03/FR-R01 acceptance criteria in REQUIREMENTS.md verified by a passing test.

### Phase 3 — Rider KYC & Onboarding
- **Depends on:** Phase 2
- **Scope:** FR-R02, FR-R03 (§3.1). NIN + ID + vehicle registration submission, KYC status states (Pending/Approved/Rejected), admin-side approval endpoint (the admin approval screen itself is built in Phase 11 alongside the rest of account management).
- **Screens:** Rider app KYC submission flow (ID/NIN entry, vehicle details, document/selfie capture) and a status screen (Pending/Approved/Rejected).
- **New tests:** Submission validation (rejects incomplete KYC), status transition tests, rider cannot go online while Pending/Rejected.
- **Regression:** Full Phase 2 suite (auth must still work for both roles).
- **Definition of done:** A rider can be created, submit KYC, and reach Approved status entirely via API.

### Phase 4 — Address & Delivery Request Creation
- **Depends on:** Phase 2
- **Scope:** FR-C04, FR-C07 (§2.2). Address entity (with landmark/informal-address tolerance per NFR-5), delivery request creation with pickup/dropoff/sender/recipient, initial `REQUESTED` state.
- **Screens:** Customer app "New delivery" flow — pickup/dropoff address entry (with map/autocomplete), package details form, sender/recipient contact fields.
- **New tests:** Request creation with valid/invalid addresses, recipient-distinct-from-sender flow, delivery record correctly links to customer.
- **Regression:** Phases 2–3 suites.
- **Definition of done:** A logged-in customer can create a delivery request via API and retrieve it.

### Phase 5 — Fare Calculation Engine
- **Depends on:** Phase 4
- **Scope:** FR-C05, FR-A07 (§2.2, §4.2). Weight-tier + distance-banding fare logic; admin-configurable pricing parameters (editable without redeploy — store in DB, not hardcoded).
- **Screens:** Customer app fare-quote/confirmation screen (shown before payment); Admin dashboard pricing-configuration screen.
- **New tests:** Fare calculated correctly across weight brackets and distance bands; changing a pricing parameter changes subsequent fare calculations without a restart.
- **Regression:** Phase 4 suite (fare must attach correctly to a request).
- **Definition of done:** Every delivery request returns a fare quote before payment per FR-C05.

### Phase 6 — Payments Integration
- **Depends on:** Phase 5
- **Scope:** FR-C06 (§2.2). Paystack and/or Flutterwave integration, pay-before-assignment enforcement, webhook/callback handling, `REQUESTED` → `SEARCHING` transition only on confirmed payment.
- **Screens:** Customer app payment screen (provider checkout hand-off) and payment success/failure confirmation screen.
- **New tests:** Successful payment moves state correctly; failed/pending payment does NOT create a chargeable, assignable delivery; webhook signature validation; idempotency on duplicate webhook delivery.
- **Regression:** Phases 4–5 suites.
- **Definition of done:** No delivery can reach `SEARCHING` without a confirmed payment record.

### Phase 7 — Dispatch, Assignment & Rider Job Flow
- **Depends on:** Phases 3, 6
- **Scope:** FR-A01–FR-A04 (admin manual assignment, reassignment, live board, timeline) and FR-R06–FR-R07 (rider receives + acknowledges job) (§3.2, §4.1). Zone/vehicle-type filtering per rider profile.
- **Screens:** Admin dashboard live delivery board with assign/reassign action; Rider app incoming-job screen with accept/acknowledge action.
- **New tests:** Assignment only offers Approved + online + zone/vehicle-matched riders; reassignment works on failure/timeout; every transition logged with actor+timestamp (NFR-7).
- **Regression:** Phases 3 and 6 suites.
- **Definition of done:** A paid request can be manually assigned to an eligible rider and the rider can acknowledge it, entirely via API.

### Phase 8 — Delivery Execution & Proof of Delivery
- **Depends on:** Phase 7
- **Scope:** FR-R08, FR-R09, FR-R10 (§3.2) and the full state machine (`docs/REQUIREMENTS.md` §6): `PICKED_UP → IN_TRANSIT → DELIVERED`, failure handling, one redelivery attempt, `RETURNED` after second failure.
- **Screens:** Rider app status-update controls (mark picked up/in transit/delivered), proof-of-delivery capture screen (photo + recipient OTP entry), failure-reason screen.
- **New tests:** Full happy-path state walk; photo+OTP required before `DELIVERED`; failure reason required before `FAILED`; redelivery cap enforced (max 1 auto-retry, then `RETURNED`).
- **Regression:** Phase 7 suite (assignment must precede execution correctly).
- **Definition of done:** A delivery can be walked end-to-end from `REQUESTED` to `DELIVERED` (and separately, to `RETURNED` via the failure path) purely through API calls.

### Phase 9 — Customer Tracking, Notifications & Cancellation
- **Depends on:** Phase 8
- **Scope:** FR-C08–FR-C11 (§2.3). Status polling endpoint, notification dispatch (push/SMS) on every transition, assigned-rider visibility, tiered cancellation policy with fees.
- **Screens:** Customer app live tracking/status screen, assigned-rider info card, push notification handling, cancel-delivery flow with fee disclosure.
- **New tests:** Notification fires on every state transition in §6; cancellation fee logic matches the tier rules (free/partial/full) at each state; rider details visible only once `ASSIGNED`.
- **Regression:** Phase 8 suite.
- **Definition of done:** A customer polling the status endpoint sees every transition in real time (≤10s per NFR-1/§2.3), and cancellations charge correctly by state.

### Phase 10 — History, Receipts & Support Flag
- **Depends on:** Phase 9
- **Scope:** FR-C12–FR-C14, FR-R11 (§2.4, §3.3). Delivery history for customer and rider, receipt view, proof-of-delivery display, issue-report routing to admin.
- **Screens:** Customer app history list + receipt/proof-of-delivery view + "report an issue" screen; Rider app completed-jobs list.
- **New tests:** History correctly scoped per user (no cross-user leakage); proof-of-delivery only visible on `DELIVERED` orders; issue report creates an admin-visible flag.
- **Regression:** Phase 9 suite.
- **Definition of done:** Every FR in §2.4/§3.3 verified.

### Phase 11 — Admin Account Management & Reporting
- **Depends on:** Phase 3, Phase 9
- **Scope:** FR-A05, FR-A06, FR-A08 (§4.2, §4.3). Customer/rider search & suspend, KYC approve/reject with reason, basic aggregate reports.
- **Screens:** Admin dashboard customer management screen, rider management + KYC approval screen, reports/analytics screen.
- **New tests:** Suspended customer cannot create new requests but history remains intact; KYC rejection requires a reason and rider cannot go online after rejection; report numbers match underlying data on a seeded test dataset.
- **Regression:** Phases 3 and 9 suites.
- **Definition of done:** All admin-facing FRs in §4 are complete — this closes out the full functional scope of R1.

### Phase 12 — Non-Functional Hardening Pass
- **Depends on:** Phase 11 (all functional scope complete)
- **Scope:** NFR-1 through NFR-7 (§5) as a dedicated pass: response-time check under load, graceful third-party-outage handling, TLS/encryption/RBAC audit, NDPA-aligned consent & data-minimization review, currency/phone/address localization check, low-bandwidth payload review, audit-log completeness check.
- **New tests:** Basic load test on core endpoints; simulated third-party (maps/payment) failure doesn't crash the request flow; RBAC test matrix (each role can only hit its permitted endpoints).
- **Regression:** Full suite, Phases 1–11.
- **Definition of done:** Every NFR in §5 has a corresponding check that passes.

### Phase 13 — Full Integration & End-to-End Regression Pass
- **Depends on:** Phase 12
- **Scope:** No new features. Walk every core journey end-to-end against a clean environment: customer signup → request → pay → assign → pickup → deliver → history; rider signup → KYC → onboarding → job execution; admin signup-adjacent flows → assignment → reporting. This is the "does the whole thing actually work together" phase.
- **New tests:** End-to-end scripted journeys (can be automated via API-level test scripts, e.g. Postman/Newman or Jest+Supertest chains) covering the three journeys above plus the failure/cancellation/redelivery paths.
- **Regression:** The entire suite from Phase 1 onward, run clean, with no manual patching.
- **Definition of done:** All three core journeys pass end-to-end with zero manual intervention. This is the MVP's "ready to demo" gate referenced in the Planning phase.

### Phase 14 — CI/CD Pipeline Setup
- **Depends on:** Phase 1 (can be set up early and expanded incrementally — recommended to stand up a basic version right after Phase 1, then harden here)
- **Scope:** See Section 3 (CI/CD Pipeline) below for full detail.
- **New tests:** Pipeline itself is validated by: a passing PR triggers lint+test+build; a failing test blocks merge; a merge to `main` deploys to staging automatically.
- **Regression:** Full suite must run inside the pipeline, not just locally.
- **Definition of done:** Every phase from here on is verified by CI, not by manual "it worked on my machine" checks.

### Phase 15 — Staging Deployment & Production Go-Live Readiness
- **Depends on:** Phases 13 and 14
- **Scope:** See Section 4 (Environments & Deployment) below. Deploy to staging, run Phase 13's full journey suite against the live staging environment (not just local), fix anything environment-specific, then prepare the production cutover checklist.
- **New tests:** Same end-to-end journeys as Phase 13, executed against staging infrastructure with real (sandbox-mode) third-party integrations.
- **Regression:** Full suite, against staging.
- **Definition of done:** Staging behaves identically to the local test suite's expectations. Production go-live is a business decision (NIPOST licensing status, founder sign-off) layered on top of this technical readiness — flag when this phase is technically complete so that conversation can happen.

---

## 2. Testing Strategy

- **Unit tests:** Jest, for all service-layer business logic (fare calculation, state machine transitions, OTP handling, etc.). Aim for thorough coverage of business logic specifically — not a blanket percentage target on the whole codebase.
- **Integration tests:** Supertest against a real test database (a disposable test/CI Postgres instance — do not mock the DB layer for these). One suite per module, covering every endpoint's happy path and its documented failure modes.
- **End-to-end tests:** API-level scripted journeys (Phase 13) are the primary automated E2E coverage for R1 — full mobile-UI automation (e.g. Detox) is a reasonable addition later but isn't required to hit MVP speed. Screen-level correctness (does the UI actually reflect the state the API returns, does it look right) is verified by Ilyas's manual design/QA review each phase, not by automated visual regression at this stage.
- **Regression suite = the full accumulated test suite, every phase.** Nothing is ever removed from it as new phases are added; it only grows. "Run regression" always means "run everything from Phase 1 forward," never just the newest tests.
- **Manual smoke checklist:** In addition to automated tests, manually walk the new screens/flows for each phase (via the actual app, not just the API) when a phase involves a new external integration (payments, maps, SMS, KYC provider) or a new user-facing flow — automated tests should mock these integrations; a manual check confirms the real integration and the real UI actually work together.

---

## 3. CI/CD Pipeline

Recommended: **GitHub Actions**, triggered as follows:

| Trigger | Steps |
|---|---|
| Push to any branch / PR opened | Lint → Unit tests → Integration tests (against a CI Postgres/Redis service container) → Build check |
| Merge to `main` | All of the above, then auto-deploy backend to **staging** |
| Manual trigger / tagged release | Promote the already-tested staging build to **production** (no direct-to-prod deploys) |

A failing step at any stage blocks progression to the next. No merge to `main` without a green pipeline.

---

## 4. Environments & Deployment

| Environment | Purpose | Suggested hosting (adjust as needed — not yet founder-approved, just a sane MVP default) |
|---|---|---|
| Local | Development | Docker Compose (Postgres + Redis + backend) |
| Staging | Pre-production validation, matches Phase 15 | Railway or Render (managed Postgres + Redis + backend, low cost, fast to set up for a small team) |
| Production | Live, real users, real money | Same provider as staging, separate project, promoted only after staging validation |
| Mobile builds | Customer/Rider app builds for testing and eventual store submission | Expo EAS Build |
| Admin web | Dashboard hosting | Vercel or Netlify |

Production go-live also depends on the NIPOST courier/logistics license status (see `docs/REQUIREMENTS.md` NFR-4 and the earlier project research) — technical readiness and legal readiness are tracked separately.

---

## 5. Environment Variables (names only — no real values ever committed)

`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `NODE_ENV`, `PORT`, `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `GOOGLE_MAPS_API_KEY`, `SMS_PROVIDER_API_KEY` (Termii or Africa's Talking), `KYC_PROVIDER_API_KEY` (VerifyMe or Seamfix). All secrets live in `.env` (git-ignored) locally and in the hosting provider's secret manager in staging/production — never in source control.

---

## 6. Git Workflow

- `main` is always deployable (auto-deploys to staging on merge).
- One feature branch per phase: `phase-3-rider-kyc`, `phase-6-payments`, etc.
- PR required to merge into `main`; CI must be green.
- Commit style: conventional commits — `feat:`, `fix:`, `test:`, `chore:`, `docs:`.

---

## 7. Definition of Done (applies to every phase)

- [ ] Code merged to `main` via a passing PR
- [ ] All new tests for the phase pass
- [ ] Full regression suite (all prior phases) passes
- [ ] No linter errors
- [ ] Endpoints briefly documented (route, method, request/response shape)
- [ ] All acceptance criteria for that phase's FR-IDs (per `docs/REQUIREMENTS.md`) explicitly verified
- [ ] Any ambiguity encountered was flagged, not silently assumed

---

## 8. Open Assumptions & Escalation

See `docs/REQUIREMENTS.md` §10 for the current list of assumptions awaiting sign-off (weight bracket, no rider payout system in R1, admin dashboard as web app, single redelivery attempt). Do not silently resolve these differently than stated — implement to the current assumption, and flag it again if a phase's work depends heavily on one of them changing.

If something in this roadmap conflicts with `docs/REQUIREMENTS.md`, the requirements document wins — flag the conflict rather than guessing which is current.

---

## 9. Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-10-31 | M3 customer/rider apps on the real API | Area-based fare quotes, server fare for payment, Paystack browser checkout, KYC/POD uploads, recipient OTP resend, server notification read state, terminal polling stop, `/api` EAS URLs. 151 shared tests, 143 backend unit, 52 e2e; both apps export. |
| 2026-10-31 | M2 backend integrity complete | Server-side distance/fare; recipient OTP for POD; uploads (local/S3); Termii SMS notifications; notification read state; optional pagination; account deletion; admin reports; payment retry + raw-body webhooks; global throttling. 143 unit + 52 e2e tests pass. |
| 2026-10-31 | M1 backend contract/security hardening complete | Validated DTOs across every controller; signup role whitelist; JWT-protected profile setup; admin email/password login + seed; `RolesGuard` on every controller; exception filter/serialization; route-shadowing and address-delete fixes; SC-43 rider release; persisted timeline events; 5-minute OTP; FR-C11 cancellation fees. 136 unit + 41 e2e tests pass. |
| 2026-10-31 | MVP delivery plan adopted (M0–M9); Phases 12–15 sequencing superseded | The frontend completed a separate Phase 0–19 track on mock data. The remaining work is integration/hardening/shipping, tracked as M0–M9 in the approved plan (M0 baseline complete). Phase 12–15 intent is preserved: NFR hardening, integration journeys, CI, and staging. |
| 2026-09-11 | Phase 1-11 backend implementation complete; Phase 12-15 pending | Full R1 MVP backend implemented with all functional requirements from Phases 1-11. Admin dashboard, Customer app, Rider app scaffolds complete. Unit tests for OtpService (10) and KycService (26) passing. Backend builds clean. Admin builds clean. Mobile apps start. Real DB connection pending Docker availability. |
| 2026-09-11 | Phase 1-3 backend implementation complete | Auth (phone+OTP), Rider KYC, User management implemented and unit tested |
| 2026-09-11 | Phase 4-5 backend implementation complete | Delivery creation, fare calculation engine with dynamic pricing |
| 2026-09-11 | Phase 6-7 backend implementation complete | Payments (Paystack/Flutterwave), Dispatch/Assignment, Rider job flow |
| 2026-09-11 | Phase 8-11 backend implementation complete | Delivery execution with POD, notifications, cancellation, history/issues, admin management |
| — | Initial version | Baseline for Phase 1 kickoff |

*(Add an entry here every time scope, a phase, or an assumption changes — this keeps OpenCode's context accurate across sessions.)*
