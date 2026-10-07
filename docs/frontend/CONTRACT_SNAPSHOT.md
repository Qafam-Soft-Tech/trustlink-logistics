# TrustLink — Backend Contract Snapshot

Phase 0 deliverable. Derived by reading the backend source (read-only). **Global prefix `api`** (`backend/src/main.ts`: `app.setGlobalPrefix('api')`), so every path below is `/api/<path>`. Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` — unknown body fields cause **400**. Controllers with a class-level `@UseGuards(JwtAuthGuard)` require a Bearer JWT on every route in them.

> **Role enforcement caveat (important).** `@Roles(...)` only actually enforces when `RolesGuard` is in the guard list. Only `UsersController` includes `@UseGuards(JwtAuthGuard, RolesGuard)`. Everywhere else the controller has `@UseGuards(JwtAuthGuard)` **without** `RolesGuard`, so `@Roles` metadata is **decorative** (services enforce some checks; most do not). "Declared role" below = the `@Roles` value; enforcement is noted per controller. This is a backend defect → tracked in `CONTRACT_LEDGER.md` (DEFERRED).

---

## 1. Route inventory

### Auth — `auth.controller.ts` (no class guard)

| Method | Path | Declared role | Guard | Request | Success | Errors |
|---|---|---|---|---|---|---|
| POST | `/auth/signup` | public | none | `{ phone, firstName?, lastName?, role, email? }` | `201 { message: 'OTP sent to phone number', userId }` | `409` same phone+role (`User with this phone and role already exists`); `409` same phone other role (`Phone number already registered with a different role`) |
| POST | `/auth/verify-otp` | public | none | `{ phone, code }` (`purpose` ignored) | `201 { user, token }` | `401 Invalid or expired OTP`; `401 User not found` |
| POST | `/auth/login` | public | none | `{ phone }` | `201 { message, userId }` | `401 User not found`; `401 Phone not verified` |
| POST | `/auth/verify-login-otp` | public | none | `{ phone, code }` | `201 { user, token }` | `401 Invalid or expired OTP` |
| POST | `/auth/resend-otp` | public | none | `{ phone, purpose? }` | `201 { message: 'OTP resent successfully' }` | — |
| GET | `/auth/profile` | authed | JwtAuthGuard | — | `200 <User sanitised>` | `401` |
| PUT | `/auth/profile` | authed | JwtAuthGuard | `Partial<User>` | `200 <User>` | `400 Phone number cannot be changed`; `400 Role cannot be changed` |
| POST | `/auth/profile/setup` | public | **none** | `{ phone, firstName, lastName, email?, role, vehicleType?, vehiclePlate? }` | `201 { user, token }` | `401 User not found` |

> `SignupDto`/`VerifyOtpDto`/`LoginDto` are plain interfaces — **no class-validator**, so required-field validation is not enforced (SC in ledger). `role` is only defaulted by the DB column.

### Users — `users.controller.ts` (`JwtAuthGuard, RolesGuard` — roles enforced)

| Method | Path | Role | Request | Success |
|---|---|---|---|---|
| GET | `/users?role=&isActive=` | admin | query | `200 User[]` |
| GET | `/users/:id` | admin | — | `200 User` |
| PUT | `/users/:id/kyc` | admin | `{ status, rejectionReason? }` | `200 User` |
| PUT | `/users/:id/toggle-active` | admin | — | `200 User` |

### KYC — `kyc.controller.ts` (`JwtAuthGuard` only; `@Roles` decorative)

| Method | Path | Declared role | Request | Success | Errors |
|---|---|---|---|---|---|
| POST | `/kyc/submit` | rider | `{ nin, idType, idFrontUrl, idBackUrl, selfieUrl, vehicleRegistrationUrl, vehicleType, vehiclePlate }` | `201 KycSubmission` | `403` non-rider; `400` NIN ≠ 11 digits; `400` missing uploads; `400` missing vehicle type/plate; `400` already approved; `400` already pending |
| GET | `/kyc/status` | rider | — | `200 { status, rejectionReason, submittedAt, reviewedAt }` | — |
| GET | `/kyc/can-go-online` | rider | — | `200 { canGoOnline }` | — |
| GET | `/kyc/pending` | admin | — | `200 KycSubmission[]` (with `user`) | — |
| PUT | `/kyc/:userId/approve` | admin | — | `200 KycSubmission` | `404`; `400` already approved |
| PUT | `/kyc/:userId/reject` | admin | `{ reason }` | `200 KycSubmission` | `404`; `400` already rejected; `400` empty reason |

### Deliveries — `delivery.controller.ts` (`JwtAuthGuard` class-level; `@Roles` decorative; service enforces some)

| Method | Path | Declared role | Request | Success | Errors |
|---|---|---|---|---|---|
| POST | `/deliveries` | customer | see §2 `CreateDeliveryDto` | `201 Delivery` | `404` customer missing/inactive; `403` not customer; `400` recipient phone == sender |
| GET | `/deliveries?status=` | authed | query | `200 Delivery[]` (own: customer→customerId, rider→riderId, else all) | `401` |
| GET | `/deliveries/all?status=` | admin | query | `200 Delivery[]` | — |
| GET | `/deliveries/:id` | authed | — | `200 Delivery` | `404`; access check throws `Error` → `500` |
| GET | `/deliveries/track/:trackingNumber` | **authed (NOT public)** | — | `200 Delivery` | `404`; `401` if no token |
| PUT | `/deliveries/:id/status` | authed | `{ status, notes?, latitude?, longitude? }` | `200 Delivery` | `400` invalid transition; `403` role rule |
| PUT | `/deliveries/:id/assign` | admin | `{ riderId }` | `200 Delivery` | `400` invalid rider; `400` wrong status |
| PUT | `/deliveries/:id/fare` | admin | `{ fare }` | `200 Delivery` | `404` |
| POST | `/deliveries/:id/cancel` | customer | — | `200 Delivery` | `403` not owner; `400` only REQUESTED/SEARCHING |
| POST | `/deliveries/addresses` | customer | `Partial<Address>` | `201 Address` | — |
| GET | `/deliveries/addresses` | customer | — | `200 Address[]` (default first) | — |
| PUT | `/deliveries/addresses/:id` | customer | `Partial<Address>` | `200 Address` | `404` |
| POST | `/deliveries/addresses/:id/default` | customer | — | `201` (void) | — |
| PUT | `/deliveries/:id/pickup` | rider | `{ latitude?, longitude? }` | `200 Delivery` | `400` bad transition; `403` |
| PUT | `/deliveries/:id/in-transit` | rider | `{ latitude?, longitude? }` | `200 Delivery` | `400`; `403` |
| POST | `/deliveries/:id/complete` | rider | `{ photoUrl, recipientOtp, recipientName, recipientPhone, latitude?, longitude?, notes? }` | `200 Delivery` (DELIVERED) | `403` not assigned; `400` not IN_TRANSIT; `400` photo required; `400` OTP must be 6 digits |
| POST | `/deliveries/:id/failure` | rider | `{ reason, latitude?, longitude? }` | `200 Delivery` (FAILED or RETURNED) | `403`; `400` not PICKED_UP/IN_TRANSIT; `400` empty reason |
| POST | `/deliveries/:id/redelivery` | admin | — | `200 Delivery` (SEARCHING, riderId cleared) | `400` not FAILED; `400` max attempts |
| GET | `/deliveries/:id/proof` | authed | — | `200 ProofOfDelivery \| null` | — |

### Dispatch — `dispatch.controller.ts` (`JwtAuthGuard` only; `@Roles` decorative)

| Method | Path | Declared role | Request | Success |
|---|---|---|---|---|
| GET | `/dispatch/board` | admin | — | active `Delivery[]` |
| GET | `/dispatch/:deliveryId/eligible-riders` | admin | — | `{ rider, distanceKm, estimatedTimeMinutes }[]` |
| PUT | `/dispatch/:deliveryId/assign` | admin | `{ riderId }` | `Delivery` |
| PUT | `/dispatch/:deliveryId/reassign` | admin | `{ newRiderId, reason }` | `Delivery` |
| GET | `/dispatch/my-queue` | rider | — | `Delivery[]` (ASSIGNED only) |
| POST | `/dispatch/:deliveryId/acknowledge` | rider | — | `Delivery` (**status unchanged**) |
| PUT | `/dispatch/location` | rider | `{ latitude, longitude }` | `RiderProfile` |
| PUT | `/dispatch/status` | rider | `{ status }` | `RiderProfile` |
| GET | `/dispatch/status` | rider | — | `{ message }` (placeholder) |

### Rider profile — `rider-profile.controller.ts` (`JwtAuthGuard`)

| Method | Path | Request | Success |
|---|---|---|---|
| GET | `/rider/profile` | — | `RiderProfile` (auto-creates default if absent) |
| PUT | `/rider/profile` | `{ vehicleType?, vehiclePlate?, vehicleModel?, vehicleColor?, zone? }` | `RiderProfile` |
| PUT | `/rider/profile/status` | — | `RiderProfile` (toggle online/offline) |
| PUT | `/rider/profile/status/set` | `{ status }` | `RiderProfile` |
| PUT | `/rider/profile/location` | `{ latitude, longitude }` | `RiderProfile` |

### Issues — `issue.controller.ts` (`JwtAuthGuard` only; `@Roles` decorative)

| Method | Path | Declared role | Request | Success |
|---|---|---|---|---|
| POST | `/issues` | customer/rider | `{ deliveryId, type, priority, title, description, attachments? }` | `Issue` (`403` if not reporter's delivery) |
| GET | `/issues?status=` | authed | — | own `Issue[]` |
| GET | `/issues/assigned?status=` | admin | — | `Issue[]` |
| GET | `/issues/all?status=&priority=` | admin | — | `Issue[]` |
| GET | `/issues/:id` | authed | — | `Issue` |
| PUT | `/issues/:id/assign` | admin | `{ assignedToId }` | `Issue` (sets IN_PROGRESS) |
| PUT | `/issues/:id/status` | authed | `{ status, resolution? }` | `Issue` |

### Notifications & cancellation — `notification.controller.ts` (`JwtAuthGuard`)

| Method | Path | Declared role | Request | Success |
|---|---|---|---|---|
| GET | `/notifications?limit=20` | authed | — | `Notification[]` |
| GET | `/notifications/cancellation-preview/:deliveryId` | authed | — | `{ canCancel, fee, refundAmount, reason }` |
| POST | `/notifications/cancel/:deliveryId` | authed (no role) | — | `{ cancelled, fee, refundAmount }` |
| POST | `/notifications/send` | admin | `{ deliveryId, userId, channel, title, body, data? }` | `Notification` |

### Pricing — `pricing.controller.ts` (`JwtAuthGuard` only; `@Roles` decorative)

| Method | Path | Declared role | Request | Success |
|---|---|---|---|---|
| POST | `/pricing/calculate` | customer/admin | `{ distanceKm, weightKg, packageType }` | `FareBreakdown` |
| GET | `/pricing/config` | admin | — | `PricingConfig[]` |
| GET | `/pricing/config/:key` | admin | — | `{ key, value, defaultValue }` |
| PUT | `/pricing/config/:key` | admin | `{ value, description? }` | `PricingConfig` |
| POST | `/pricing/initialize` | admin | — | `{ message }` |
| GET | `/pricing/defaults` | admin | — | `DEFAULT_PRICING_CONFIG` |

### Payments — `payment.controller.ts` (per-route `JwtAuthGuard`; `@Roles` decorative)

| Method | Path | Declared role | Request | Success |
|---|---|---|---|---|
| POST | `/payments/initialize` | customer | `{ deliveryId, amount, email, phone, provider, metadata? }` | `{ paymentId, reference, authorizationUrl, accessCode?, status }` |
| GET | `/payments/:reference` | authed | — | `Payment` (access-checked) |
| GET | `/payments/delivery/:deliveryId` | authed | — | `Payment \| null` |
| POST | `/payments/verify/:reference` | authed | — | `{ status, amount, paidAt?, channel?, gatewayResponse }` |
| POST | `/payments/webhook/paystack` | public (HMAC-SHA512 `x-paystack-signature`) | raw body | `200 { received: true }` |
| POST | `/payments/webhook/flutterwave` | public (`verif-hash`) | raw body | `200 { received: true }` |
| GET | `/payments` | admin | — | `{ message: 'Admin payment listing not yet implemented' }` |

### Health
- `GET /health` → `200` (health-check endpoint; exact body shape **UNKNOWN** — not read in this pass).

---

## 2. Request DTOs (exact field names)

**`CreateDeliveryDto`** (`delivery.controller.ts`) — **numeric kg, embedded addresses**:
```
pickupStreet: string            dropoffStreet: string
pickupLandmark?: string         dropoffLandmark?: string
pickupArea?: string             dropoffArea?: string
pickupLatitude?: number         dropoffLatitude?: number
pickupLongitude?: number        dropoffLongitude?: number
packageType: 'document'|'parcel'
packageWeight: number  (kg)     packageDescription?: string
senderName: string              senderPhone: string
recipientName: string           recipientPhone: string
```
**`UpdateStatusDto`**: `{ status, notes?, latitude?, longitude? }`
**`ProfileSetupDto`**: `{ phone, firstName, lastName, email?, role, vehicleType?, vehiclePlate? }`
**`InitializePaymentDto`**: `{ deliveryId, amount, email, phone, provider: 'paystack'|'flutterwave', metadata? }`
**`CalculateFareDto`**: `{ distanceKm, weightKg, packageType }`
**`SubmitKycDto`**: `{ nin, idType, idFrontUrl, idBackUrl, selfieUrl, vehicleRegistrationUrl, vehicleType, vehiclePlate }`
**`CreateIssueDto`**: `{ deliveryId, type, priority, title, description, attachments? }`
**`ReassignRiderDto`**: `{ newRiderId, reason }`; **`AssignRiderDto`**: `{ riderId }`
**`ProofData`** (`/deliveries/:id/complete`): `{ photoUrl, recipientOtp, recipientName, recipientPhone, latitude?, longitude?, notes? }`
**`failure`**: `{ reason, latitude?, longitude? }`

---

## 3. Entities

| Entity | Table | Key fields |
|---|---|---|
| `User` | `users` | id, phone (unique), email?, firstName?, lastName?, role (enum), passwordHash?, kycStatus (enum, default pending), kycRejectionReason?, avatarUrl?, isActive (default true), isPhoneVerified (default false), timestamps |
| `OtpCode` | `otp_codes` | id, phone, code, purpose (`signup|login|reset`), attempts (default 0), isUsed, createdAt, expiresAt. Unique index (phone, code) |
| `KycSubmission` | `kyc_submissions` | id, userId (unique), nin?, idType? (enum), idFrontUrl?, idBackUrl?, selfieUrl?, vehicleRegistrationUrl?, vehicleType?, vehiclePlate?, status (enum), rejectionReason?, reviewedBy?, reviewedAt? |
| `Address` | `addresses` | id, userId, label, street, landmark?, area?, city?, state?, country?, latitude?, longitude?, isDefault, timestamps |
| `Delivery` | `deliveries` | id, trackingNumber (unique), customerId, riderId?, pickup{Street,Landmark?,Area?,Lat?,Lng?}, dropoff{…}, packageType, packageWeight (decimal), packageDescription?, senderName, senderPhone, recipientName, recipientPhone, status, failureReason?, redeliveryAttempts (default 0), assignedAt?, pickedUpAt?, deliveredAt?, cancelledAt?, fare? (decimal), paymentReference?, timestamps, events[] |
| `DeliveryEvent` | `delivery_events` | id, deliveryId, status, actorId?, actorRole?, notes?, latitude?, longitude?, createdAt |
| `ProofOfDelivery` | `proof_of_delivery` | id, deliveryId (unique), photoUrl, recipientOtp, recipientName, recipientPhone, latitude?, longitude?, notes?, createdAt |
| `RiderProfile` | `rider_profiles` | id, userId (unique), vehicleType (enum), vehiclePlate, vehicleModel?, vehicleColor?, zone?, status (enum, default offline), currentLatitude, currentLongitude, lastLocationUpdate?, rating, totalDeliveries, cancelledDeliveries, failedDeliveries, timestamps |
| `Issue` | `issues` | id, deliveryId, reporterId, assignedToId?, type (enum), status (enum), priority (enum), title, description, attachments? (jsonb), resolution?, resolvedAt?, timestamps |
| `Notification` | `notifications` | id, deliveryId (**always present**), userId, channel (enum), title, body, data? (jsonb), status (enum), sentAt?, errorMessage?, externalId?, createdAt |
| `PricingConfig` | `pricing_config` | id, key (unique enum), value (decimal), description?, updatedBy?, timestamps |
| `Payment` | `payments` | id, deliveryId, reference (unique), providerReference?, provider (enum), status (enum), amount (decimal), currency ('NGN'), channel?, customerEmail?, customerPhone?, authorizationUrl?, accessCode?, paidAt?, failedAt?, failureReason?, gatewayResponse?, metadata?, webhookRetries, lastWebhookAt?, timestamps |

---

## 4. Enums

- **UserRole:** `customer | rider | admin`
- **KycStatus:** `pending | approved | rejected`
- **DeliveryStatus:** `requested | searching | assigned | picked_up | in_transit | delivered | failed | returned | cancelled`
- **PackageType:** `document | parcel`
- **VehicleType:** `motorcycle | van | truck`
- **RiderStatus:** `online | offline | on_trip`
- **KycDocumentType:** `nin | id_front | id_back | selfie | vehicle_registration`
- **IssueType:** `delivery_issue | payment_issue | rider_issue | other`
- **IssueStatus:** `open | in_progress | resolved | closed`
- **IssuePriority:** `low | medium | high | urgent`
- **NotificationChannel:** `push | sms | email`; **NotificationStatus:** `pending | sent | failed`
- **PaymentProvider:** `paystack | flutterwave`; **PaymentStatus:** `pending | processing | success | failed | cancelled | refunded`; **PaymentChannel:** `card | bank_transfer | ussd | mobile_money | qr_code`
- **PricingConfigKey:** base_fare, per_km_rate, per_kg_rate, minimum_fare, weight_tier_1..4_max/multiplier, distance_band_1..3_max/multiplier

---

## 5. Delivery state machine (as implemented — `delivery.service.ts` `validateStatusTransition`)

```
REQUESTED  → SEARCHING, CANCELLED
SEARCHING  → ASSIGNED, CANCELLED
ASSIGNED   → PICKED_UP, CANCELLED
PICKED_UP  → IN_TRANSIT, FAILED
IN_TRANSIT → DELIVERED, FAILED
DELIVERED  → (terminal)
FAILED     → RETURNED            (only transition in the map)
RETURNED   → (terminal)
CANCELLED  → (terminal)
```
**Extra path not in the map:** `POST /deliveries/:id/redelivery` (admin) forces `FAILED → SEARCHING` directly (bypasses the map) and clears `riderId`. Role rules enforced in the same method: customer may only set `CANCELLED`; rider only `PICKED_UP/IN_TRANSIT/DELIVERED/FAILED`. (Undefined transitions → `400`.)

---

## 6. Cancellation fee table (code — `notification.service.ts` `CANCELLATION_FEES`)

| Status | Type | Fee | Refund |
|---|---|---|---|
| requested | free | 0 | full fare |
| searching | free | 0 | full fare |
| assigned | partial | 50% of fare | 50% |
| picked_up | partial | 75% of fare | 25% |
| in_transit | full | full fare | 0 |
| delivered / failed / returned | full | full fare | 0 |
| cancelled | free | 0 | full fare |

- **Two cancel paths differ:** `POST /deliveries/:id/cancel` (`delivery.service.cancelDelivery`) allows only **REQUESTED/SEARCHING**; `POST /notifications/cancel/:deliveryId` (`cancelDeliveryWithFee`) allows through **IN_TRANSIT**. The UI should use the **preview endpoint** and follow `canCancel/fee/refundAmount/reason` (D14).
- Preview `reason` strings: `'Free cancellation'`, `'<n>% cancellation fee applies'`, `'Full fare charged as cancellation fee'`, or `'Cannot cancel delivery in current status'` with `canCancel:false`.

---

## 7. Redelivery / failure counters (`delivery.service.ts`)

- `reportFailure` requires rider assignment, status `PICKED_UP|IN_TRANSIT`, and a non-empty reason. It **increments `redeliveryAttempts`**; if `>= 2` → `RETURNED`; else → `FAILED`. (So: 1st failure = FAILED with attempts=1; 2nd failure = RETURNED with attempts=2.)
- `scheduleRedelivery` (admin) requires status `FAILED` and `redeliveryAttempts < 2`; sets `SEARCHING` and `riderId = null`. Only **one** redelivery is possible; there is no customer-triggered redelivery.
- Assignment sets `ASSIGNED` immediately; `POST /dispatch/:id/acknowledge` does **not** change status (code comment: "Could add acknowledgedAt").

---

## 8. Pricing defaults (`pricing-config.entity.ts` `DEFAULT_PRICING_CONFIG`)

- **base_fare** ₦500 · **per_km_rate** ₦150 · **per_kg_rate** ₦100 · **minimum_fare** ₦1,000
- Weight tiers (max kg / multiplier): 1 / 1.0, 5 / 1.5, 10 / 2.0, 25 / 3.0
- Distance bands (max km / multiplier): 5 / 1.0, 15 / 1.2, 50 / 1.5
- Formula: `max(baseFare + distanceKm×perKmRate×bandMult + weightKg×perKgRate×tierMult, minimumFare)`. Example 4 km & 2 kg → `500 + 600 + 300 = ₦1,400`.
- `FareBreakdown` response: `{ baseFare, distanceCharge, weightCharge, subtotal, minimumFare, totalFare, weightTier:{max,multiplier}, distanceBand:{max,multiplier} }`.

---

## 9. KYC document types & rules
`KycDocumentType = nin | id_front | id_back | selfie | vehicle_registration`. `submitKyc` requires NIN exactly 11 digits, all four URL uploads (`idFrontUrl, idBackUrl, selfieUrl, vehicleRegistrationUrl`), and `vehicleType`+`vehiclePlate`. Rejected submissions may be resubmitted; approved/pending cannot. `canRiderGoOnline` = `user.kycStatus === approved`.

---

## 10. Proof of Delivery
Stored fields: `photoUrl, recipientOtp, recipientName, recipientPhone, latitude?, longitude?, notes?, createdAt`. Visible via `GET /deliveries/:id/proof` **only when the delivery is `DELIVERED`** (otherwise `null`).
**`recipientOtp` is NOT generated or delivered by the backend.** `completeDelivery` only checks that `recipientOtp` is a 6-character string; it is **not** validated against any stored/issued code (code comment: "in real implementation, this would check against sent OTP"). There is no endpoint that issues a recipient OTP, and `OtpCode` is only used for auth (`signup|login|reset`). → Frontend must treat recipient OTP as a **demo-only** value in R1; a real flow requires backend work (ledger).

---

## 11. Tracking endpoint
`GET /deliveries/track/:trackingNumber` returns the same `Delivery` object (with `customer`, `rider`, `events`) as `GET /deliveries/:id`. **It is NOT public** — `DeliveryController` has a class-level `@UseGuards(JwtAuthGuard)` (`delivery.controller.ts:45`), so a Bearer token is required despite the `"public"` Swagger summary. Unknown tracking number → `404 Delivery not found`.

---

## 12. Payment success effect on delivery
On confirmed success (webhook `charge.success`, or `verifyPayment` when status success), the **payment** becomes `SUCCESS` and the linked **delivery** is set to **`SEARCHING`** and `paymentReference` is written (`payment.service.ts` `processSuccessfulPayment` / `verifyPayment`). Failed payment → payment `FAILED`, delivery **left in `REQUESTED`** (not chargeable/assignable). `initializePayment` only accepts a delivery in `REQUESTED`, and blocks a second payment if one is `SUCCESS`/`PROCESSING`.
**Unit note:** `InitializePaymentDto.amount` is documented "In kobo" while fares are naira decimals — an inconsistency (ledger `SC-16`).

---

## 13. Mock data formats fixtures must produce
Realistic values derived from the contract:
- **Tracking numbers:** `TLK-2026-xxx` (backend format `TLK-<year>-<4 digits>`).
- **Phone:** canonical 11-digit local (`080…`), display `0803 123 4567`.
- **Names:** Nigerian (e.g., Adaeze Okafor, Emeka Nwosu, Fatima Bello, Tunde Adeyemi).
- **Abuja areas:** Wuse 2, Maitama, Garki, Asokoro, Jabi, Utako, Gwarinpa, Wuye, Apo, Lugbe; city `Abuja`, state `FCT`.
- **Money:** naira, e.g. ₦1,400 / ₦2,500; fare breakdown per §8.
- **Weight:** 0.5, 1, 5, 10, 25 kg (chips ≤1/≤5/≤10/≤25).
- **Enums:** exactly those in §4 (lower-case string values).
- **Delivery object:** all fields in §3 `Delivery` (+ embedded pickup/dropoff, `events[]`).
- **POD:** fields in §10.
