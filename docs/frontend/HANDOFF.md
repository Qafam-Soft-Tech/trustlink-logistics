# TrustLink — Frontend Integration Hand-off (Phase 17)

Prepared at the end of the frontend-first track (Phases 0–17). The backend is unchanged and frozen; everything
below is what the backend / platform team needs to close before a real pilot.

---

## 1. Decisions that block production (open "Needs decision" rows first)

| ID | Decision needed | Frontend behaviour today | Impact if unresolved |
|---|---|---|---|
| **SC-41** | Seed a real admin user + `POST /auth/admin/login` | Console signs in against a local demo credential | Admin cannot be used outside demo mode |
| **SC-17** | Enforce `@Roles` outside `UsersController` | UI restricts by role; backend trusts any valid JWT | Any authenticated user could call admin/rider routes |
| **SC-16** | Payment `amount` units (kobo vs naira) | Adapter sends **kobo** (`naira × 100`) | Wrong charge amount if the backend expects naira |
| **SC-19** | Retry after a declined/cancelled/timed-out payment | UI allows a retry; backend §12 blocks while a payment is `PROCESSING` | A user who abandons checkout may be unable to pay again |
| **SC-2** | Cancellation fee tiers (FR-C11 text vs the 50/75/full table) | UI follows the fee table via the preview endpoint | Customer-facing fee wording may differ from policy |
| **SC-5** | OTP validity 5 min (UI) vs 10 min (code/SMS) | UI shows a 5-minute countdown | Users may be told a code expired while it still works |
| **SC-8 / SC-20** | Source of `distanceKm` for fares (no maps in R1) | Client estimates from launch-area coordinates | Fare accuracy depends on a coordinate table |
| **SC-27** | Refund/return endpoint | Copy only — no refund action exists | Cancellation refunds cannot be tracked in-app |
| **SC-26** | Pagination for `GET /deliveries` | Client-side filtering + "Show more" | History will not scale past a few hundred deliveries |
| **SC-30** | Notification read state / mark-read endpoint | Unread is stored on the device | Read state is lost across devices |
| **SC-31** | Real support phone / WhatsApp / email lines | Help shows clearly-marked placeholders | Demo-only contact details |
| **SC-33** | Account deletion/erasure endpoint (NDPA) | The UI explains the gap and routes to support | Cannot honour an erasure request in-app |
| **SC-35** | KYC document upload endpoint | Local image URIs are submitted as document URLs | KYC documents are not really stored |
| **SC-37** | Dispatch phone line | Placeholder number behind "Call dispatch" | Riders cannot actually reach dispatch |
| **SC-39** | Note on delivery failure | Note kept locally; only the reason is sent | Dispatchers lose the rider's context |
| **SC-22** | Rider vehicle type on the delivery payload | Demo-only `riderVehicleType` (mock decorates reads) | The customer tracking rider card loses the vehicle badge |
| **SC-34** | Legal sign-off for Terms & Privacy | Real drafts, marked "Draft for legal review" | Cannot publish the app stores' legal URLs |

## 2. What is real vs mocked

| Area | Real | Mocked (demo) |
|---|---|---|
| Transport | `apps/*/src/utils/api.ts` axios clients with `Authorization` + 401 interceptors; `EXPO_PUBLIC_API_URL` / `VITE_API_URL` | `EXPO_PUBLIC_DATA_SOURCE=mock` (default) routes every port call to the in-memory mock |
| Auth | Session persistence (SecureStore), OTP screens, phone canonicalisation, 401 → session-expired | OTP codes (`482913`), the three demo riders, the locked account, admin login |
| Deliveries | Full state machine, role rules, cancellation fee table, POD OTP check, redelivery counters | Delivery/notification/issue fixtures, area coordinates, recipient codes |
| Payments | Call order (`initialize → verify`), naira→kobo at the adapter boundary, no double-pay | Provider checkout URL, always-succeed/fail/pending scenarios |
| Notifications | In-app list, per-status icons, SMS-fallback copy | No OS push (SC-13) — SMS is copy only |
| Maps | "Navigate with maps" opens the device maps app | No map, no GPS, no location permission (SC-1) |
| Admin | Full console UI, dispatch/reassign/redelivery/KYC/users/issues/pricing/reports | Entire admin dataset lives in the console's own in-memory store |
| KYC | The whole flow + document pickers + statuses | Document URLs are local file paths; no real verification provider |

## 3. Backend gaps to close (from the ledger §F and §E)

1. `POST /auth/admin/login` (or an admin seed + documented flow).
2. A docs/verification provider behind `/kyc/*` (document upload/storage + real NIN checks).
3. `@Roles` enforcement beyond `UsersController` (guard the dispatch, execution, pricing and issue routes).
4. `GET /deliveries` pagination (or a dedicated history route) — SC-26/C-14.
5. A notification read endpoint — SC-30.
6. A refund/return path linked to cancellations — SC-27.
7. Recipient OTP generation/delivery for real POD — SC-38 (today it is a fixture value).
8. Distance/geocoding source for `/pricing/calculate` — SC-8/SC-20.
9. `DELETE /users/me` or an erasure request flow — SC-33.
10. Revisit the `PROCESSING` payment block so a retry is possible — SC-19.

## 4. Demo-day prerequisites

1. Both mobile apps run from their own folder (`apps/customer`, `apps/rider`) in Expo Go on the same Wi-Fi; the console runs with `npm run dev` in `apps/admin`.
2. Each app has its own in-memory mock: restarting an app restores its seeded state; the customer and admin have explicit reset actions (see `DEMO.md` §10).
3. The POD recipient code is a fixture value (`482913`) and is revealed in the customer app's Demo menu under "recipient codes".
4. Everything is naira; the only money numbers a presenter should read out are fares and the reports revenue (all mock).

## 5. Suggested next steps after the demo

1. Close the SC-41/SC-17 pair (admin auth + role enforcement) — nothing else can go live without it.
2. Decide SC-16 and SC-19 (money units and payment retry) with the payment provider's constraints in hand.
3. Add the KYC upload endpoint (SC-35) and a real verification provider.
4. Move history and notifications to server-side pagination/read-state (SC-26, SC-30).
5. Legal sign-off (SC-34) and the real support lines (SC-31) before any public build.
