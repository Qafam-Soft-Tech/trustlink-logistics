# TrustLink Logistics — R1 (MVP) Requirements & Design Specification

**Phase 4: Analysis (Requirements) + Phase 5: Design**
Scope: Parcels & documents delivery only, Abuja launch. Food, groceries, and business/enterprise accounts are explicitly out of scope for R1 (see Section 9).

> **Note on scope:** Per the founder's direction, there is no separate UI/UX design phase (no wireframe/mockup deliverable stage) — this saves time since Ilyas is a UI/UX designer himself and will art-direct screens as they're built rather than pre-specifying every layout. OpenCode builds the full system end-to-end, including the Customer app, Rider app, and Admin dashboard UI, not just the backend. This document defines functional behavior, data, and architecture; see `docs/DEVELOPMENT_ROADMAP.md` for the brand direction (colors/tone) and the screen list attached to each build phase.

---

## 1. Actors

| Actor | Description |
|---|---|
| Customer | Requests and pays for deliveries |
| Rider | Company-employed/contracted delivery agent; picks up and delivers packages |
| Dispatcher/Admin | Assigns riders to deliveries, manages accounts, monitors operations |
| System | Automated processes: payment callbacks, notifications, status transitions |

---

## 2. Functional Requirements — Customer App

### 2.1 Authentication & Profile

| ID | User story | Acceptance criteria |
|---|---|---|
| FR-C01 | As a customer, I can sign up with my phone number so I can use the app | OTP sent via SMS; account created only after OTP verified; duplicate phone numbers rejected |
| FR-C02 | As a customer, I can log in with phone + OTP | Session token issued on success; invalid/expired OTP shows a clear error; OTP expires after 5 minutes |
| FR-C03 | As a customer, I can maintain a basic profile | Name, phone (immutable), optional email; can save frequently used pickup/drop-off addresses |

### 2.2 Delivery Request & Payment

| ID | User story | Acceptance criteria |
|---|---|---|
| FR-C04 | As a customer, I can request a delivery | Requires pickup address, drop-off address, sender contact, recipient contact (name + phone), package description, weight bracket |
| FR-C05 | As a customer, I see the fare before confirming | Fare shown based on weight bracket + distance banding; no request created until fare is accepted |
| FR-C06 | As a customer, I pay before a rider is assigned | Payment via Paystack or Flutterwave; request stays in REQUESTED state until payment confirms; failed payment does not create a chargeable delivery |
| FR-C07 | As a customer, I can specify a recipient different from myself | Recipient name + phone captured separately from account holder; used for delivery-side notifications and OTP |

### 2.3 Tracking & Status

| ID | User story | Acceptance criteria |
|---|---|---|
| FR-C08 | As a customer, I can see the live status of my delivery | Status maps to the state machine (Section 6); updates within 10s of a backend state change (polling acceptable for R1) |
| FR-C09 | As a customer, I'm notified on every status change | Push notification (or SMS fallback if push unavailable) sent on each transition in Section 6 |
| FR-C10 | As a customer, I can see my assigned rider's details | Name, photo, vehicle type visible once status = ASSIGNED |
| FR-C11 | As a customer, I can cancel a delivery | Free before ASSIGNED; partial fee between ASSIGNED and PICKED_UP; full fee after PICKED_UP; cancellation reason optional |

### 2.4 History & Support

| ID | User story | Acceptance criteria |
|---|---|---|
| FR-C12 | As a customer, I can view my delivery history | List of past deliveries with status, date, fare, and a simple receipt |
| FR-C13 | As a customer, I can view proof of delivery | Photo + confirmation timestamp visible on a DELIVERED order |
| FR-C14 | As a customer, I can report an issue on a delivery | Routes to admin dashboard as a flagged item; no full ticketing system required in R1 |

---

## 3. Functional Requirements — Rider App

### 3.1 Onboarding & KYC

| ID | User story | Acceptance criteria |
|---|---|---|
| FR-R01 | As a rider, I can sign up with my phone number | Same OTP flow as customer app |
| FR-R02 | As a rider, I submit KYC to be approved | NIN, valid ID (driver's license/voter's card), vehicle type + registration, profile photo required before going online |
| FR-R03 | As a rider, I can see my verification status | Status = Pending / Approved / Rejected, with a rejection reason if applicable |

### 3.2 Availability & Job Management

| ID | User story | Acceptance criteria |
|---|---|---|
| FR-R04 | As a rider, I can toggle online/offline | Only Approved riders can go online; offline riders receive no new assignments |
| FR-R05 | As a rider, my vehicle type and zone are visible on my profile | Dispatcher can filter/assign based on this; rider cannot self-assign to zones outside registered vehicle capability |
| FR-R06 | As a rider, I receive an assigned job | Push notification with pickup/drop-off details and customer contact appears immediately on assignment |
| FR-R07 | As a rider, I can acknowledge an assigned job | Job state moves to ASSIGNED only after rider acknowledgment; timeout triggers dispatcher re-assignment prompt |
| FR-R08 | As a rider, I update delivery status as I progress | Picked up → In transit are rider-triggered; each update timestamped |
| FR-R09 | As a rider, I capture proof of delivery | Photo required + recipient-entered OTP code before status can move to DELIVERED |
| FR-R10 | As a rider, I can mark a delivery as failed | Requires a reason (recipient unavailable / wrong address / refused); triggers redelivery/return workflow (Section 6) |

### 3.3 History

| ID | User story | Acceptance criteria |
|---|---|---|
| FR-R11 | As a rider, I can view my completed jobs | List view only in R1 — no earnings/wallet calculation (flagged assumption, Section 9) |

---

## 4. Functional Requirements — Admin / Dispatch Dashboard

### 4.1 Live Operations

| ID | User story | Acceptance criteria |
|---|---|---|
| FR-A01 | As a dispatcher, I see all active deliveries on one board | Real-time (or near-real-time, ≤10s refresh) view grouped by status |
| FR-A02 | As a dispatcher, I manually assign a rider to a request | Assignable riders filtered by Approved status, online, and vehicle/zone match |
| FR-A03 | As a dispatcher, I can reassign a delivery | Available for FAILED or unacknowledged ASSIGNED deliveries |
| FR-A04 | As a dispatcher, I can view full delivery timeline | Every state transition with timestamp and triggering actor |

### 4.2 Account Management

| ID | User story | Acceptance criteria |
|---|---|---|
| FR-A05 | As an admin, I can view/search/suspend customer accounts | Search by phone/name; suspend blocks new requests, doesn't delete history |
| FR-A06 | As an admin, I can approve/reject rider KYC and manage rider status | Approve/reject with reason; can deactivate an active rider |
| FR-A07 | As an admin, I can configure pricing parameters | Weight-tier rates and distance bands editable without a code deploy |

### 4.3 Reporting

| ID | User story | Acceptance criteria |
|---|---|---|
| FR-A08 | As an admin, I can view basic operational reports | Deliveries per day/week, completion rate, cancellation rate, total revenue — simple aggregate views |

---

## 5. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | Core actions (create request, update status) respond within ~2s under normal load |
| NFR-2 | Backend degrades gracefully if a third-party integration (maps/payment) is down — never a hard crash of the request flow |
| NFR-3 | TLS in transit; PII encrypted/hashed at rest; role-based access control on the admin dashboard |
| NFR-4 | NDPA 2023-aligned: explicit consent at signup, data minimization, ability to fulfil data-subject requests (final compliance sign-off sits with legal/business, not engineering) |
| NFR-5 | Naira currency formatting; +234 phone format; addresses tolerate informal/landmark-based descriptions |
| NFR-6 | Usable on inconsistent 3G/4G connections — minimal payloads, retry/queue on failed status updates |
| NFR-7 | Every delivery status change is logged with timestamp + actor for dispute resolution |

---

## 6. Delivery State Machine

```
REQUESTED → SEARCHING → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED
                                                      │
                                                      ▼
                                                   FAILED ─→ ASSIGNED (1 redelivery attempt)
                                                      │
                                                      ▼
                                                   RETURNED (after 2nd failure)

CANCELLED — reachable from REQUESTED, SEARCHING, or ASSIGNED (customer-initiated, fee per Section 2.3 FR-C11)
```

---

## 7. Data Model (Core Entities)

| Entity | Key attributes | Relationships |
|---|---|---|
| User | id, phone, role, auth_hash, created_at | base for CustomerProfile / RiderProfile |
| CustomerProfile | user_id, name, email, saved_addresses | 1–many Delivery (as sender) |
| RiderProfile | user_id, kyc_status, nin_ref, vehicle_id, zone, online_status | 1–many Delivery (as assignee) |
| Vehicle | id, rider_id, type, registration_no | belongs to RiderProfile |
| Address | id, label, lat, lng, landmark_note | used by Delivery (pickup/dropoff) |
| Delivery | id, customer_id, rider_id (nullable), pickup_address_id, dropoff_address_id, package_desc, weight_bracket, status, fare, created_at | has many DeliveryStatusHistory, one Payment |
| DeliveryStatusHistory | id, delivery_id, status, actor, timestamp | belongs to Delivery |
| Payment | id, delivery_id, amount, provider, provider_ref, status | belongs to Delivery |
| Notification | id, user_id, channel, content, sent_at | — |

---

## 8. R1 System Architecture

```
Client apps (Customer, Rider, Admin)
            │
            ▼
     Backend API (NestJS)
      — Auth module
      — Deliveries module
      — Payments module
      — Users/Admin module
      — Notifications module
            │
      ┌─────┴─────┐
      ▼           ▼
 Data store   External services
 (Postgres    (Paystack/Flutterwave,
  + Redis)     Google Maps, Termii/
               Africa's Talking, KYC
               provider)
```

Notes:
- **Redis** used for: dispatch queue (available riders per zone), session cache, and rate-limiting OTP requests.
- **Real-time updates** for R1: short-interval polling from client apps (every 5–10s while a delivery is active) rather than WebSockets — simpler to build correctly with an AI coding agent; can upgrade to WebSocket/push later without changing the data model.
- **API style**: REST, versioned (`/v1/...`), organized by module above.

---

## 9. Out of Scope for R1 (explicitly deferred)

- Food and grocery-specific flows (multi-item carts, substitutions, restaurant/store integration)
- Live GPS map tracking (status-based tracking only in R1)
- Automatic/algorithmic rider dispatch
- Cash on delivery
- Rider earnings/wallet/payout system
- Business and Enterprise accounts (sub-brand naming under TrustLink still pending founder decision)
- Multi-city operation
- Loyalty/rewards

---

## 10. Open Assumptions Requiring Sign-Off

1. Default parcel weight bracket set at 0–5kg for R1, mirroring common market practice — confirm or adjust.
2. No rider payout/wallet mechanism is being built into the app in R1; assumed to be handled outside the software (cash/bank transfer managed by ops) until a business decision says otherwise.
3. Admin/dispatch dashboard is a web application (desktop-oriented), not a mobile app, since dispatch is assumed to be a desk-based operations role.
4. Redelivery is capped at one automatic attempt before a delivery is marked RETURNED — confirm this matches intended customer experience.

---

*Prepared by Claude (Senior PM) for Qafams Software Technology — TrustLink Logistics platform, R1 MVP. This document is the requirements/design baseline for implementation tickets handed to OpenCode. Update via the same phased process as changes are approved.*
