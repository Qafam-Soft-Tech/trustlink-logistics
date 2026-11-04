# M2 — Backend data integrity, payments, uploads, and operations

**Branch:** `mvp-m2-backend-integrity` (from `mvp-m1-backend-contract` @ `2e3354d`)
**Scope:** backend functionality and schema. Client wiring is M3/M4.
**Plan:** `~/.commandcode/plans/mvp-delivery-roadmap.md` (M2).

---

## 1. Summary (≤5 lines)

- The server now owns fare calculation: it derives distance from coordinates or the Abuja area table, computes the fare on delivery creation, and rejects a payment whose amount does not match the stored fare.
- Recipient OTP is real: a hashed 6-digit code is issued on assignment, sent by SMS, verified before `DELIVERED`, and can be resent.
- Uploads work through `POST /uploads` (JPEG/PNG/WebP, 5 MB) with a local driver for development and an S3-compatible driver for staging.
- SMS notifications use Termii; payment retry/webhook verification, notification read state, pagination, account deletion, reports, and global rate limiting are implemented.
- The e2e run caught and fixed two schema defects: coordinate columns were `integer`, and payment snapshots needed an explicit `createdAt`.

---

## 2. What changed

### 2.1 Fare and distance
- `backend/src/modules/payments/services/distance.service.ts` — Abuja area table + haversine; resolves coordinates first, then areas, then an explicit distance, then a 5 km default.
- `CalculateFareDto` now accepts `pickupArea`/`dropoffArea`/coordinates and makes `distanceKm` optional.
- `DeliveryService.createDelivery` computes `distanceKm` and `fare` from the pickup/dropoff inputs and stores both on the delivery.
- `PaymentService.initializePayment` rejects an amount that does not equal `delivery.fare * 100`.
- Delivery coordinate columns (pickup/dropoff, address, events, POD, rider location) changed from inferred `integer` to `double precision`.

### 2.2 Recipient OTP (POD)
- New `RecipientOtp` entity and `RecipientOtpService`; codes are bcrypt-hashed, expire after 15 minutes, and lock after 3 attempts.
- `DeliveryService.assignRider` issues the code and sends it to the recipient via Termii.
- `completeDelivery` verifies the code before writing proof and marking `DELIVERED`.
- `POST /deliveries/:id/recipient-otp/resend` lets the customer, assigned rider, or an admin resend it.
- `TermiiSmsService` gained `sendMessage()`; `sendOtp()` now uses it.

### 2.3 Uploads
- `backend/src/modules/uploads/` — `POST /uploads` (multipart `file`), JPEG/PNG/WebP only, 5 MB cap, authenticated customer/rider/admin.
- `LocalStorageService` writes to `UPLOAD_DIR` (default `backend/uploads`) and returns `/uploads/<file>`; `main.ts` serves it.
- `S3StorageService` writes to any S3-compatible bucket and returns `S3_PUBLIC_BASE_URL/<key>`.
- `@aws-sdk/client-s3` and `@types/multer` added; `backend/uploads/` is git-ignored.

### 2.4 Notifications
- Notification SMS is sent through Termii and marked `SENT`/`FAILED` based on the provider result. Push remains deferred.
- `Notification.readAt` added with `GET /notifications/unread-count`, `PUT /notifications/:id/read`, and `PUT /notifications/read-all`.
- Cancellation events are persisted through the `DeliveryEvent` repository and release the rider.

### 2.5 Payments
- Retry is allowed after `FAILED`/`CANCELLED`; a recent `PROCESSING` attempt blocks a second charge; a stale `PROCESSING` attempt is marked `CANCELLED` after `PAYMENT_PROCESSING_TTL_MINUTES` (default 15).
- Paystack webhooks verify the HMAC over the **raw body** (`rawBody: true`); Flutterwave compares the static `FLUTTERWAVE_WEBHOOK_HASH`.
- `verifyPayment` now persists the delivery's `SEARCHING` transition and payment reference.
- Admin payment listing is implemented.

### 2.6 Operations
- Pagination is optional and backward compatible: `?page=&limit=` returns `{ items, total, page, limit }`; without them the endpoints still return arrays. Applied to deliveries, issues, users, and pending KYC.
- `DELETE /users/me` anonymizes a customer/rider account, blocks while a delivery is active, and records `deletedAt`.
- `GET /admin/reports/summary` returns totals, completion/cancellation rates, revenue, and the last 7 days of delivery counts.
- `ThrottlerGuard` is registered globally (`THROTTLE_LIMIT`, default 120/min); auth/OTP routes have a 60/min ceiling.
- Redis remains unused; in-memory throttling is active for the single-instance pilot. This follows the approved amendment to REQUIREMENTS §8.

---

## 3. Files created / modified / deleted

**Created (11)**
`backend/src/common/pagination.ts` · `backend/src/modules/payments/services/distance.service.ts` · `backend/src/modules/deliveries/entities/recipient-otp.entity.ts` · `backend/src/modules/deliveries/services/recipient-otp.service.ts` · `backend/src/modules/uploads/storage.service.ts` · `backend/src/modules/uploads/uploads.controller.ts` · `backend/src/modules/uploads/uploads.module.ts` · `backend/src/modules/users/me.controller.ts` · `backend/src/modules/users/reports.service.ts` · `backend/src/modules/users/reports.controller.ts` · `backend/test/m2.e2e-spec.ts` · `backend/test/m2.recipient-otp.spec.ts` · this report.

**Modified (key)**
`delivery.entity.ts` (distance/coordinate types) · `delivery.service.ts` (fare, recipient OTP, pagination) · `dispatch.service.ts` (delegates assignment) · `payment.service.ts` / `payment.controller.ts` (retry, raw webhook, amount check) · `notification.service.ts` / controller / entity / module (SMS, read state) · `users.service.ts` / module / controller (deletion, pagination, reports) · `kyc.controller.ts` / `kyc.service.ts` (pagination) · `issue.controller.ts` / `issue.service.ts` (pagination) · `app.module.ts` / `main.ts` (throttler, uploads, static serving) · `termii-sms.service.ts` · `tsconfig.json` · `.env.example` · `.gitignore` · phase 4/6/7/8/9/10/11 + m1 tests + `mock-db.ts`.

---

## 4. Commands run with real output

```
backend$ npm run build       → nest build, 0 errors
backend$ npm run lint        → 0 warnings, 0 errors (oxlint, 81 files)
backend$ npm run test:unit   → 12 suites / 143 tests passed
backend$ npm run test:e2e    → 3 suites / 52 tests passed (auth, RBAC, M2)
```

The M2 e2e suite covers: upload accept/reject/anonymous, area-based quote vs stored fare, tampered amount, in-progress payment block, pagination envelope vs array, account anonymization and active-delivery block, notification unread/read-all, and admin reports with a customer 403.

---

## 5. Acceptance checklist (M2 plan)

| Criterion | ✓ | Evidence |
|---|---|---|
| Server-authoritative distance and fare | ✓ | `DistanceService`, delivery stores `distanceKm`/`fare`, quote test |
| Payment amount cannot be tampered | ✓ | `initializePayment` amount check; e2e 400 |
| Recipient OTP generated, hashed, expiring, attempt-limited, SMS-delivered | ✓ | `RecipientOtpService`, unit tests, resend endpoint |
| Uploads with local and S3 drivers | ✓ | `POST /uploads`, local e2e, S3 driver wired |
| Real SMS notification transport | ✓ | Termii `sendMessage`; SMS status reflects the provider result |
| Notification read state | ✓ | `readAt`, unread-count, read/read-all, e2e |
| Pagination | ✓ | optional envelope on deliveries/issues/users/KYC; e2e |
| Account deletion (NDPA) | ✓ | `DELETE /users/me`; e2e anonymization + active-delivery block |
| Reports endpoint | ✓ | `GET /admin/reports/summary`; e2e |
| Payment retry + raw-body webhook verification | ✓ | retry tests; controller passes `req.rawBody` |
| Rate limiting | ✓ | global `ThrottlerGuard` + OTP route ceilings |

---

## 6. Known issues / deviations

1. **Redis is still unused.** Throttling is in-memory for the single-instance pilot; the approved amendment to REQUIREMENTS §8 covers this. Redis-backed throttling/caching is a scaling task.
2. **Push notifications remain deferred** (in-app + SMS fallback, as decided in SC-13).
3. **Flutterwave webhooks need `FLUTTERWAVE_WEBHOOK_HASH`** set to the dashboard's verif-hash; otherwise they are rejected.
4. **S3 uploads need `S3_BUCKET` + `S3_PUBLIC_BASE_URL` + credentials**; local disk is the development fallback and is not durable on staging.
5. **Refunds remain a manual ops runbook** (founder decision), and the cancellation route still accepts no reason body.
6. **Rider vehicle type is still not on the delivery payload** (SC-22); the tracking card hides the badge in api mode.
7. **The client still sends its own `distanceKm` for quotes**; M3 switches it to areas/coordinates and removes the client estimate.
8. **The first `createDelivery` after a schema change may be slower** while TypeORM synchronizes; production will use migrations (M7).
9. ~~**Auth OTPs are stored in plaintext** in `otp_codes.code`.~~ **Resolved (M5)** — auth OTPs are HMAC-SHA256 hashed; the recipient OTP was already bcrypt-hashed. The DB column keeps the historical name `code`.

---

## 7. Next milestone

**M3 — Customer and Rider apps in `api` mode:** fix the EAS API URL, open the Paystack checkout, upload KYC/POD images, send areas instead of a client distance, use the recipient OTP, and run the full flow on a device against the local backend.

---

## 8. Proposed commit message

```
feat(backend): m2 server fares, recipient otp, uploads, and operations

- derive distance from Abuja coordinates/areas, compute and store the fare on
  creation, and reject a payment amount that differs from the stored fare
- issue/verify a hashed recipient OTP on assignment, send it via Termii, and add
  a resend endpoint; persist DELIVERED proof only after verification
- add POST /uploads with local and S3-compatible drivers (JPEG/PNG/WebP, 5 MB)
- send notification SMS through Termii, add notification read state, optional
  pagination, account deletion, admin reports, global throttling, payment retry
  and raw-body Paystack/Flutterwave webhook verification
- fix coordinate columns to double precision and set payment createdAt explicitly

Co-authored-by: CommandCodeBot <noreply@commandcode.ai>
```
