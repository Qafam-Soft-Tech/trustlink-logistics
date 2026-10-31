# M4 — Admin console on the real API

**Branch:** `mvp-m4-admin-api` (from `mvp-m3-client-api` @ `6cc18f6`)
**Scope:** admin web app + the one backend endpoint it needed (rider profiles with KYC).
**Plan:** `~/.commandcode/plans/mvp-delivery-roadmap.md` (M4).

---

## 1. Summary (≤5 lines)

- The console now switches between its in-memory demo world and the real backend with `VITE_DATA_SOURCE=mock|api`.
- Admin login calls `POST /auth/admin/login` and stores the JWT; a 401 clears the session and returns to login.
- Dispatch, deliveries, riders/KYC, users, issues, pricing, and reports all read real data and call the real mutation endpoints.
- A new `GET /admin/riders` returns rider profiles + KYC documents; `GET /deliveries/all` now includes timeline events.
- KYC document previews render uploaded images in the review panel.

---

## 2. What changed

### 2.1 Backend
- New `AdminRidersService` + `GET /admin/riders` (admin): rider user + profile + KYC submission (including document URLs).
- `GET /deliveries/all` now joins `delivery.events`, so the console's detail timeline is populated.
- Pricing defaults are seeded on boot (`FareCalculationService.initializeDefaults()`), so the console's Pricing page is populated on a fresh database.
- No other backend behavior changed.

### 2.2 Admin app
- `src/api/adminApi.ts` — typed axios client for login, riders, deliveries, payments, users, issues, pricing, dispatch assignment/reassignment/redelivery, KYC approve/reject, user suspension, issue assignment/status, pricing updates, and the reports summary.
- `src/utils/api.ts` — Bearer token from `trustlink.admin.token`; 401 clears the session and redirects.
- `src/context/AuthContext.tsx` — API login in `api` mode, demo credential in `mock` mode; restores sessions only when the token is present.
- `src/data/dataSource.ts` — `api` is now supported.
- `src/data/AdminDataContext.tsx` — `MockAdminDataProvider` (unchanged behavior) plus `ApiAdminDataProvider`:
  - React Query reads every 10 s for deliveries, payments, riders, issues; users/pricing on demand.
  - Maps API entities to the console's existing `AdminState` shape, so **no page needed a rewrite**.
  - Mutations call the backend and invalidate the admin query cache.
- `src/components/AdminLayout.tsx` — "Reset demo data" becomes "Refresh data" in api mode; the demo strip stays mock-only.
- `src/pages/LoginPage.tsx` — mode-aware credentials guidance.
- `src/pages/RidersPage.tsx` — uploaded KYC images render in the review panel.

### 2.3 Local configuration
- `apps/admin/.env` (git-ignored): `VITE_DATA_SOURCE=api`, `VITE_API_URL=http://192.168.0.152:3000/api`.
- Local admin seeded with `admin@trustlink.ng` / `trustlink-demo` (`npm run seed:admin`).

---

## 3. Verification

```
root$ npm run build --workspace admin   → 147 modules, 383.17 kB JS (117.58 kB gzip)
root$ npm run lint  --workspace admin   → 5 warnings, 0 errors (pre-existing fast-refresh hints)
backend$ npm run build / lint / test:unit → clean / 0 warnings / 143 passed
backend$ jest m2.e2e-spec               → 12/12 passed (includes GET /admin/riders)
```

The admin UI was not driven by a browser in this session; the API routes it calls are the ones covered by the backend e2e suite, and the mapping layer is typechecked.

---

## 4. How to use it

1. Seed the admin (once):
   ```powershell
   cd backend
   $env:NODE_ENV='development'; $env:ADMIN_EMAIL='admin@trustlink.ng'; $env:ADMIN_PASSWORD='trustlink-demo'; $env:ADMIN_PHONE='08000000001'
   npm run seed:admin
   ```
2. Start the backend (`npm run start:dev`) and the console:
   ```powershell
   cd apps/admin
   npm run dev
   ```
3. Open `http://localhost:5173`, sign in with `admin@trustlink.ng` / `trustlink-demo`.
4. The console polls the API every 10 s; use the header menu → **Refresh data** for an immediate refetch.

---

## 5. Known limitations

1. **Proof-of-delivery is not shown in the admin detail page yet** (the API provider maps `pod` to `null`). The customer/rider apps and the API still hold it.
2. **Reports are computed client-side** from the fetched delivery list; the backend `GET /admin/reports/summary` exists for a later move.
3. **The console fetches all deliveries/issues** — fine for pilot volume; pagination is available on the API and can be adopted later.
4. **No live push** — 10-second polling.
5. **Admin settings** route still does not exist (not in the current navigation).

---

## 6. Next milestone

**M5 — test suite rebuild:** real-DB integration tests, scripted end-to-end journeys, RBAC/security tests, API-adapter contract tests, and a load smoke test. Then M6 CI, M7 staging, M8 device builds.

---

## 7. Proposed commit message

```
feat(admin): m4 admin console on the real api

- add a typed admin API client and JWT login/401 handling; support
  VITE_DATA_SOURCE=api alongside the existing mock world
- add an API-backed AdminDataProvider that maps deliveries, payments, riders,
  users, issues and pricing into the console's existing state shape and calls
  the real dispatch/KYC/user/issue/pricing mutations
- add GET /admin/riders (profile + KYC documents) and include delivery events
  in GET /deliveries/all; render uploaded KYC images in the review panel
- seed the local admin with the documented demo credential

Co-authored-by: CommandCodeBot <noreply@commandcode.ai>
```
