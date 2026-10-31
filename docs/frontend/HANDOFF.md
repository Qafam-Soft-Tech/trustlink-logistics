# TrustLink — Frontend Integration Hand-off (Phase 17)

Prepared at the end of the frontend-first track (Phases 0–17). The backend is unchanged and frozen; everything
below is what the backend / platform team needs to close before a real pilot.

> **M1 update (2026-10-31):** SC-43, SC-41 (backend), SC-17, SC-2, SC-5 and SC-42 are closed on the backend.
> **M2 update:** SC-8/20, SC-19, SC-26, SC-30, SC-33, SC-35 and recipient OTP are closed on the backend.
> See `CONTRACT_LEDGER.md` §A for the evidence. The clients/console still need their M3/M4 wiring.

---

## 1. Decisions that block production (open "Needs decision" rows first)

| ID | Decision needed | Frontend behaviour today | Impact if unresolved |
|---|---|---|---|
| **SC-43** | **Backend must free the rider** (`ON_TRIP → ONLINE`) when their delivery becomes delivered/failed/returned | Backend releases the rider on DELIVERED/FAILED/RETURNED/CANCELLED and redelivery, only when no other active delivery remains | **Resolved (M1)** with regression tests |
| **SC-41** | Seed a real admin user + `POST /auth/admin/login` | Endpoint, seed script, and console JWT login are wired | **Resolved (M1 backend, M4 console)** |
| **SC-17** | Enforce `@Roles` outside `UsersController` | `RolesGuard` is on every controller; cross-role e2e matrix passes | **Resolved (M1)** |
| **SC-19** | Retry after a declined/cancelled/timed-out payment | Retry is allowed after FAILED/CANCELLED; a stale PROCESSING attempt is cancelled after the TTL | **Resolved (M2)** |
| **SC-2** | Cancellation fee tiers (FR-C11 text vs the 50/75/full table) | FR-C11 adopted: free through SEARCHING, 50% at ASSIGNED, full from PICKED_UP | **Resolved (M1)** |
| **SC-5** | OTP validity 5 min (UI) vs 10 min (code/SMS) | Backend and UI both use 5 minutes; SMS copy updated | **Resolved (M1)** |
| **SC-8 / SC-20** | Source of `distanceKm` for fares (no maps in R1) | Backend derives distance from coordinates/areas and stores the fare | **Resolved backend (M2)**; client sends areas in M3 |
| **SC-27** | Refund/return endpoint | Copy only — no refund action exists | Cancellation refunds cannot be tracked in-app |
| **SC-26** | Pagination for `GET /deliveries` | `?page=&limit=` envelope exists | **Resolved backend (M2)**; client adopts in M3 |
| **SC-30** | Notification read state / mark-read endpoint | Server-side readAt, unread count and read-all exist | **Resolved backend (M2)** |
| **SC-31** | Real support phone / WhatsApp / email lines | Help shows clearly-marked placeholders | Demo-only contact details |
| **SC-33** | Account deletion/erasure endpoint (NDPA) | `DELETE /users/me` anonymizes the account | **Resolved backend (M2)**; client adopts in M3 |
| **SC-35** | KYC document upload endpoint | `POST /uploads` (local/S3) exists | **Resolved backend (M2)**; rider app adopts in M3 |
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

1. ~~`POST /auth/admin/login` (or an admin seed + documented flow).~~ **Done (M1)** — endpoint + `npm run seed:admin`.
2. A real verification provider behind `/kyc/*` (uploads are now stored; NIN checks are still manual).
3. ~~`@Roles` enforcement beyond `UsersController` (guard the dispatch, execution, pricing and issue routes).~~ **Done (M1)**.
4. ~~`GET /deliveries` pagination (or a dedicated history route) — SC-26/C-14.~~ **Done (M2)**.
5. ~~A notification read endpoint — SC-30.~~ **Done (M2)**.
6. A refund/return path linked to cancellations — SC-27.
7. Recipient OTP generation/delivery for real POD — SC-38 (today it is a fixture value).
8. ~~Distance/geocoding source for `/pricing/calculate` — SC-8/SC-20.~~ **Done (M2)**.
9. ~~`DELETE /users/me` or an erasure request flow — SC-33.~~ **Done (M2)**.
10. ~~Revisit the `PROCESSING` payment block so a retry is possible — SC-19.~~ **Done (M2)**.
11. ~~**Free the rider on job end** (`ON_TRIP → ONLINE` on delivered/failed/returned) — **SC-43, highest priority**.~~ **Done (M1)** — the backend now releases the rider when no active delivery remains.

## 4. Demo-day prerequisites

1. Both mobile apps run from their own folder (`apps/customer`, `apps/rider`) in Expo Go on the same Wi-Fi; the console runs with `npm run dev` in `apps/admin`.
2. Each app has its own in-memory mock: restarting an app restores its seeded state; the customer and admin have explicit reset actions (see `DEMO.md` §10).
3. The POD recipient code is a fixture value (`482913`) and is revealed in the customer app's Demo menu under "recipient codes".
4. Everything is naira; the only money numbers a presenter should read out are fares and the reports revenue (all mock).

## 5. Suggested next steps after the demo

1. ~~Close the SC-41/SC-17 pair (admin auth + role enforcement).~~ **Done (M1)**; wire the console to the real admin login in M4.
2. Decide SC-19 (payment retry) with the payment provider's constraints in hand — money units are closed (SC-16, verified kobo).
3. Add the KYC upload endpoint (SC-35) and a real verification provider.
4. Move history and notifications to server-side pagination/read-state (SC-26, SC-30).
5. Legal sign-off (SC-34) and the real support lines (SC-31) before any public build.

## 6. Frontend dependencies (installed — nothing new is needed)

| App | Dependencies |
|---|---|
| `apps/shared` | none at runtime (pure TS + Reanimated/gesture-handler/safe-area-context as peers of the apps); `vitest` as a devDependency |
| `apps/customer` | `@tanstack/react-query`, `expo-linking`, `@react-native-async-storage/async-storage`, `expo-secure-store`, `@expo-google-fonts/inter`, `expo-print`, `expo-sharing`, plus the Expo/RN runtime |
| `apps/rider` | `@tanstack/react-query`, `@react-native-async-storage/async-storage`, `expo-secure-store`, `@expo-google-fonts/inter`, `expo-image-picker` (KYC capture), plus the Expo/RN runtime |
| `apps/admin` | `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query` (installed), `axios`, Vite + oxlint as devDependencies |

Notes: `expo-print` + `expo-sharing` were approved for PDF receipts (SC-28); `expo-image-picker` is the rider's KYC capture tool. Deliberately **not** used: any map/GPS, push, chart or state library, `zod`, `react-native-svg`.

## 7. Data-source rule (no silent default)

Both mobile apps read `EXPO_PUBLIC_DATA_SOURCE` and the console reads `VITE_DATA_SOURCE`. In **non-development builds the value is required** (`"mock"` or `"api"`); a missing value throws at startup instead of silently defaulting to mock. While the source is `mock`, a gold **Demo data** strip is visible on every screen in all three apps (`DemoModeBanner` for mobile, the console's `DemoBanner`).

**Installable (EAS/standalone) builds must set `EXPO_PUBLIC_DATA_SOURCE` through `eas.json` → `build.<profile>.env`.** `.env` files are git-ignored and are **not uploaded to EAS**, so they do not exist on the build server: `preview` is pinned to `mock`, `preview-api` and `production` to `api` (+ the `EXPO_PUBLIC_API_URL` placeholder) in `apps/customer/eas.json` and `apps/rider/eas.json`. `eas.json` also sets `APP_VARIANT`, which `app.config.ts` turns into the package id and app name (`.preview` suffix for tester builds). `EXPO_PUBLIC_*` values are inlined at build time, so changing data source requires a new build. The repo is now an npm workspace with a single root lockfile, so the shared package resolves on the builder — see `docs/release/BUILD.md` (SC-45 closed in Phase 19).
