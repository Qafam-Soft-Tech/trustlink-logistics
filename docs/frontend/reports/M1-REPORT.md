# M1 — Backend contract, auth, and RBAC hardening

**Branch:** `mvp-m1-backend-contract` (from `main` @ `75a3692`)
**Scope:** backend API hardening + the small client auth-flow change needed to keep the real contract working. No screen redesigns, no new feature areas.
**Plan:** `~/.commandcode/plans/mvp-delivery-roadmap.md` (M1).

---

## 1. Summary (≤5 lines)

- Every controller now validates real DTOs with `class-validator`; `POST /auth/signup` rejects missing names/role and refuses `role: "admin"`.
- Auth is hardened: profile setup requires a JWT and can no longer change phone/role; admins sign in with seeded email + password.
- `RolesGuard` is wired on **every** controller; a cross-role e2e matrix proves customers/riders cannot reach admin routes.
- Delivery integrity is fixed: riders are freed on DELIVERED/FAILED/RETURNED/CANCELLED, timeline events persist, POD completion notifies, and assignment requires a paid (`SEARCHING`) delivery.
- The approved policy decisions landed: 5-minute OTP, FR-C11 cancellation fees, server-side payment-amount check, and the `acknowledgedAt` column.

---

## 2. What changed

### 2.1 Validated DTOs (new files)
| File | Contents |
|---|---|
| `backend/src/modules/auth/dto.ts` | `SignupDto`, `VerifyOtpDto`, `LoginDto`, `ResendOtpDto`, `UpdateProfileDto`, `ProfileSetupDto`, `AdminLoginDto` (Nigerian phone regex, 6-digit OTP, role whitelist, password length) |
| `backend/src/modules/deliveries/dto.ts` | delivery creation, status updates, assign/reassign, fare, locations, POD completion, failure, addresses, rider profile/status, issues |
| `backend/src/modules/users/dto.ts` | rider KYC submission, KYC rejection, admin KYC status |
| `backend/src/modules/payments/dto.ts` | fare calculation, pricing update, payment initialization (kobo integer) |
| `backend/src/modules/notifications/dto.ts` | admin notification send |

All controllers now use these classes; `whitelist` + `forbidNonWhitelisted` are effective.

### 2.2 Auth and security
- `AuthService.signup`: explicit field mapping; role limited to `customer`/`rider`; duplicate phone/role handling preserved.
- `AuthService.updateProfile`: explicit allow-list (name, email, avatar); phone/role attempts still return the original 400 messages.
- `AuthService.setupProfile`: requires a JWT, uses the caller's id, ignores body `phone`/`role`, and persists rider vehicle data to `RiderProfile`.
- `AuthService.adminLogin` + `POST /auth/admin/login`: bcrypt comparison, active-admin check, sanitized response.
- `backend/src/scripts/seed-admin.ts` + `npm run seed:admin`: idempotent upsert from `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE`.
- `RolesGuard` added to every controller (delivery, dispatch, rider profile, issues, KYC, pricing, payments, notifications, users); missing `@Roles` filled in.
- `AllExceptionsFilter` registered globally; `throw new Error('Not authorized')` replaced with `ForbiddenException`.
- `ClassSerializerInterceptor` + `@Exclude()` on `User.passwordHash` (admin user list no longer leaks hashes).
- `app.setup.ts` centralizes prefix/helmet/CORS/validation/filter/serialization for `main.ts` **and** the e2e harness.
- `main.ts` enables `rawBody` (webhook groundwork) and graceful shutdown.
- `GET /api/health/ready` probes Postgres.

### 2.3 Delivery correctness
- Timeline events now persist through `DeliveryEvent` (create, status change, assign, POD, failure, redelivery, cancellation).
- `completeDelivery` saves the DELIVERED event, notifies, and releases the rider.
- `reportFailure` persists the event, notifies, and releases the rider.
- `scheduleRedelivery` clears the rider and frees them.
- `releaseRiderIfIdle` only sets `ONLINE` when no other `ASSIGNED`/`PICKED_UP`/`IN_TRANSIT` delivery remains.
- Assignment now requires `SEARCHING` (paid) and validates KYC, online state, and vehicle compatibility in both the delivery and dispatch paths.
- `riderAcknowledgeJob` sets the new `acknowledgedAt` timestamp.
- Address routes are declared before `GET /deliveries/:id`, and `DELETE /deliveries/addresses/:id` exists.
- `GET /deliveries/:id/proof` now checks delivery ownership.
- Rider online/offline endpoints enforce KYC approval.
- FR-C11 cancellation fees: 0% through SEARCHING, 50% at ASSIGNED, 100% from PICKED_UP.
- OTP expiry is 5 minutes in code and SMS copy.

### 2.4 Client compatibility
`profile/setup` now needs a token, but the apps called it before `signIn`. Both apps now persist the token returned by `verify-otp` before navigating to profile setup, and clear a token that has no completed user on cold start:
- `apps/customer/src/screens/auth/OtpVerificationScreen.tsx`
- `apps/customer/src/session/SessionContext.tsx`
- `apps/rider/src/screens/auth/OtpVerificationScreen.tsx`
- `apps/rider/src/session/SessionContext.tsx`

No API adapter change was needed: the axios interceptor picks up the stored token.

### 2.5 Tests and CI
- `test/auth.e2e-spec.ts`: now boots the app with `configureApp` + `/api` prefix, so validation/prefix/filter are actually exercised. Added admin self-signup rejection and three admin-login cases.
- `test/rbac.e2e-spec.ts`: unauthenticated, cross-role denials, permitted access, password-hash serialization, and validation-for-permitted-roles.
- `test/m1.rider-release.spec.ts`: SC-43 regression for delivery completion, failure, and redelivery.
- Existing suites updated for the new repositories; phase 9 fee expectation changed to FR-C11.
- CI: the e2e step is now blocking (the temporary `continue-on-error` is gone).

---

## 3. Commands run with real output

```
backend$ npm run build          → nest build, 0 errors
backend$ npm run lint           → 0 warnings, 0 errors (oxlint, 69 files)
backend$ npm run test:unit      → 11 suites / 136 tests passed (8.7 s)
backend$ npm run test:e2e       → 2 suites / 41 tests passed (auth 52 s, rbac 9 s)
backend$ npm run seed:admin     → Admin ready: admin@trustlink.ng
root$    npm run typecheck      → customer, rider, shared clean
```

Docker Desktop was started for the e2e run (`docker compose up -d --wait` → Postgres + Redis healthy).

---

## 4. Acceptance checklist (M1 plan)

| Criterion | ✓ | Evidence |
|---|---|---|
| DTOs are `class-validator` classes, not interfaces | ✓ | five `dto.ts` files; `forbidNonWhitelisted` enforced |
| Signup rejects missing fields and `role: "admin"` | ✓ | e2e: 400 for both |
| Profile setup requires JWT and cannot change phone/role | ✓ | `JwtAuthGuard`; body phone/role ignored |
| Admin login + seed | ✓ | `POST /api/auth/admin/login`; `npm run seed:admin` verified |
| `RolesGuard` on every controller | ✓ | RBAC e2e matrix (16 cases) |
| No unauthorized path returns 500 | ✓ | `ForbiddenException` + global filter |
| Password hashes never serialized | ✓ | `@Exclude` + e2e assertion on `/api/users` |
| Route shadowing fixed; address delete exists | ✓ | address routes before `:id`; `DELETE /api/deliveries/addresses/:id` |
| SC-43 rider release | ✓ | `m1.rider-release.spec.ts` (3 cases) |
| `completeDelivery` persists the DELIVERED event and notifies | ✓ | event saved then returned; notification call |
| Assignment requires `SEARCHING` | ✓ | delivery + dispatch services |
| 5-minute OTP and FR-C11 fees | ✓ | `otp.service.ts`, `termii-sms.service.ts`, `notification.service.ts` |
| e2e suite 41/41 | ✓ | auth 25 + RBAC 16 |

---

## 5. Known issues still open (moved to M2)

1. **Recipient OTP is still length-checked only** — `completeDelivery` accepts any 6 digits until M2 generates/hashes/delivers the recipient code.
2. **Fare is still client-distance-based** — the server does not yet compute distance or recompute fare; the payment amount is checked against `delivery.fare` only when a fare exists.
3. **No upload endpoint** — KYC/POD still receive URLs/local URIs.
4. **No rate limiting applied** — `ThrottlerModule` is registered but no guard; Redis is still unused.
5. **Webhook signatures** are computed over `JSON.stringify(payload)` until M2 switches to the raw body.
6. **CORS is still open** (`cors()` with no allowlist) and Swagger is exposed in every environment; both are M7.
7. **Pagination, notification read state, account deletion, reports endpoint** are M2.
8. `AllExceptionsFilter` now logs 4xx at `warn` and 5xx at `error`; expected validation failures no longer look like crashes.

---

## 6. Next milestone

**M2 — backend data integrity:** server-authoritative fare/distance, recipient OTP, uploads, real SMS notification transport, notification read state, pagination, account deletion, throttling/Redis, payment retry, webhook raw-body verification, and the reports endpoint.

---

## 7. Proposed commit message

```
feat(backend): m1 validated contracts, auth hardening, and rbac

- add class-validator DTOs for auth, deliveries, KYC, pricing, payments and
  notifications; signup is limited to customer/rider and profile setup now
  requires a JWT with immutable phone/role
- add admin email/password login and an idempotent `npm run seed:admin`
- wire RolesGuard on every controller, register the global exception filter and
  ClassSerializerInterceptor (passwordHash excluded), and add an RBAC e2e matrix
- persist delivery timeline events, free riders on terminal states, notify on
  completion/failure, require SEARCHING for assignment, expose address deletion,
  and add acknowledgedAt
- apply the approved policy decisions: 5-minute OTP and FR-C11 cancellation fees
- store the signup token before profile setup in both mobile apps
- CI: the e2e job is now blocking

Co-authored-by: CommandCodeBot <noreply@commandcode.ai>
```
