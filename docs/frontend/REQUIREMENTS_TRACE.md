# TrustLink — Requirements → Planned Screens Trace

Phase 0 deliverable. Maps each R1 functional requirement to the planned frontend screen(s). "Planned screens" = Amendment Pack v2 **Part 4 (Customer)**, **Part 5 (Rider)**, **Part 6 (Admin)**. Behaviour is per `docs/REQUIREMENTS.md` unless a ledger row says otherwise.

Legend: **Status** = current frontend state (❌ none · ◐ partial/exists-but-mock-or-wrong · ✅ wired).

---

## Customer (FR-C, REQUIREMENTS §2)

| FR | Requirement (short) | Planned screen(s) — Part 4 | Status |
|---|---|---|---|
| FR-C01 | Sign up with phone + OTP; dup rejected; account only after OTP | B Auth: PhoneEntry, OTP | ◐ exists, real API; no token persistence |
| FR-C02 | Log in phone + OTP; 5-min expiry (spec) | B: PhoneEntry, OTP (counting/resend/wrong/expired/locked), SessionExpired | ◐ (code uses 10 min — SC-5) |
| FR-C03 | Profile (name, immutable phone, optional email); saved addresses | K Account: Account, Edit profile, Saved addresses | ❌ Account mock; addresses not built |
| FR-C04 | Request delivery: pickup, dropoff, sender, recipient, description, weight bracket | D Create delivery: Pickup, Drop-off+recipient, Address form, Package (weight chips), Sender, Review | ◐ NewDelivery exists but payload mismatched; no review/sender step |
| FR-C05 | Fare shown before confirming; no request until fare accepted | E Fare & payment: Fare quote (breakdown), then create → pay | ❌ no fare step (SC-8) |
| FR-C06 | Pay before assignment (Paystack/Flutterwave); failed payment = no chargeable delivery | E: Pay summary, CheckoutSheet, Processing, Success/Failed/Cancelled, Request confirmed | ❌ none |
| FR-C07 | Recipient distinct from self (name+phone) | D: Drop-off + recipient | ◐ fields exist; backend enforces distinct phone |
| FR-C08 | Live status ≤10s (polling OK) | F Status tracking: Tracking variants, StatusTimeline, RouteSummaryCard | ◐ Tracking exists; no polling; wrong shape |
| FR-C09 | Notified on every status change | J Notifications: list (in-app), status banner | ❌ none (code logs only — SC-13) |
| FR-C10 | See assigned rider details once ASSIGNED | F: rider card (name, photo, vehicle type) | ❌ none real |
| FR-C11 | Cancel (free before ASSIGNED; fee tiers) | F: Cancel flow (preview fee/refund, reason, confirm), not-cancellable state | ❌ none (fees per D14/SC-2) |
| FR-C12 | Delivery history list w/ status, date, fare, receipt | H History: Deliveries (Active/Completed/Cancelled & Failed, search), Details, Receipt | ◐ History exists; wrong endpoint |
| FR-C13 | Proof of delivery (photo + timestamp) on DELIVERED | G Terminal: Delivered + POD; H: Details/Receipt | ❌ none |
| FR-C14 | Report an issue (routes to admin) | I Issues & help: ReportIssue, Submitted, My issues, Help/FAQ, Contact support | ❌ none (backend exists) |

Extra customer screens in Part 4 with no single FR: Launch (A), TrackByNumber/NotFound (C), Redelivery scheduled / Returned (G), Send again (H), System states (L).

## Rider (FR-R, REQUIREMENTS §3)

| FR | Requirement (short) | Planned screen(s) — Part 5 | Status |
|---|---|---|---|
| FR-R01 | Rider sign up with phone (same OTP) | Auth: PhoneEntry, OTP, ProfileSetup | ✅ wired |
| FR-R02 | Submit KYC (NIN, ID, vehicle reg, photo) | KYC steps: NIN, ID front, ID back, selfie, vehicle registration (+ vehicle type) | ◐ KycScreen exists; wrong endpoint `/rider/kyc`, broken Image |
| FR-R03 | See verification status (Pending/Approved/Rejected + reason) | KYC status screen | ❌ not hydrated |
| FR-R04 | Toggle online/offline; only Approved can go online | Home (online toggle) | ◐ calls `/rider/profile/status` (exists) |
| FR-R05 | Vehicle type + zone visible/used on profile | Profile (vehicle type/zone) | ◐ Profile hydrates from `/rider/profile` |
| FR-R06 | Receive assigned job (push + details) | Jobs (in-app new-job banner; push DEFERRED) | ❌ JobsScreen uses `/jobs/*` (missing) |
| FR-R07 | Acknowledge assigned job; timeout → reassign | Jobs: Acknowledge, "Call dispatch" | ❌ (SC-4/SC-12) |
| FR-R08 | Update status Picked up → In transit (timestamped) | Execution: Confirm pickup, In transit | ❌ none |
| FR-R09 | POD: photo + recipient OTP before DELIVERED | Execution: POD (photo + OTP, wrong-OTP state) | ❌ none (recipient OTP not real — snapshot §10) |
| FR-R10 | Mark failed with reason; redelivery/return workflow | Failure: reason {recipient unavailable, wrong address, refused} + note; redelivery/returned confirmations | ❌ none |
| FR-R11 | View completed jobs (list only) | Jobs completed list | ❌ Earnings removed (D7) |

## Admin (FR-A, REQUIREMENTS §4)

| FR | Requirement (short) | Planned screen(s) — Part 6 | Status |
|---|---|---|---|
| FR-A01 | Live board of active deliveries (≤10s) | Dispatch Board | ❌ mock |
| FR-A02 | Manually assign rider (filtered by approved/online/vehicle/zone) | Dispatch Board (assign) | ❌ mock |
| FR-A03 | Reassign (FAILED / unacknowledged ASSIGNED) | Dispatch Board (reassign) | ❌ mock |
| FR-A04 | Full delivery timeline (actor + timestamp) | Deliveries / Delivery detail / timeline | ❌ mock |
| FR-A05 | Search/suspend customers | Users | ❌ mock |
| FR-A06 | Approve/reject KYC + reason; manage rider | Riders + KYC review | ❌ mock |
| FR-A07 | Configure pricing (no redeploy) | Pricing page (real config keys) | ❌ mock |
| FR-A08 | Reports: per day/week, completion, cancellation, revenue | Reports (small) | ❌ mock |

Admin also: Dashboard (overview), Issues (from customer FR-C14 routing).

---

## Coverage notes
- **No FR is fully wired end-to-end today** except the auth path (signup/login/OTP/profile-setup) which is real on both mobile apps.
- Backend endpoints already exist for FR-C05/06/08/10/11/14, FR-R06–R10, FR-A01–A08 — so most gaps are **frontend work**, not backend blockers (exceptions tracked in `CONTRACT_LEDGER.md`: admin login, `/deliveries/history`, recipient OTP generation, maps/distance for FR-C05).
