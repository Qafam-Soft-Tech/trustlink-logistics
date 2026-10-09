# Phase 14 — Admin console

Branch: `fe-phase-14-admin`
Scope: FR-A01–A08. Admin keeps its own brand CSS (no `@trustlink/shared`); backend and mobile apps untouched.

---

## 1. Inspection findings (before changes)

- **Admin is a separate npm project** (React 19 + Vite 8 + react-router 7 + TanStack Query installed but unused). `BASELINE.md` records **no workspace and no blessed Vite alias** for `@trustlink/shared` — so per the phase prompt the admin copies the minimal types + fixtures (SC‑40).
- **Vite template leftovers were live**: `src/App.css` (unimported), `src/assets/{react.svg,vite.svg,hero.png}` (unreferenced), and `src/index.css` — the only imported one — which defined a **purple accent**, `color-scheme: light dark`, and `#root` width/centering/border rules that fought `theme.css`.
- **Auth could not work**: `AuthContext` posted to `/auth/admin/login`, which **does not exist** (SC‑14) — the console was unusable.
- **Layout bugs**: the header title was hardcoded to `"Dashboard"` on every page, and the user dropdown never opened (`aria-expanded="false"` with no state/handler).
- **All pages were hardcoded** with mock arrays (Dashboard, Deliveries, Users, Riders, Analytics, Settings) and there was **no `/deliveries/:id` route** even though `theme.css`'s tables imply a detail view.
- **Sidebar** was Dashboard · Deliveries · Users · Riders · Analytics · Settings — missing Dispatch, Issues, Pricing and Reports; **Settings had no backend** (SC‑14) and Analytics overlapped with the required Reports.
- **`theme.css` already provides the full component vocabulary** (buttons, cards, dense tables, badges, form controls, tabs, modal, toasts, pagination, empty state) and the brand tokens (navy `#0b1f47`, gold `#b8863a`) — so no new CSS framework or chart library was needed (and none was added).

## 2. Summary (≤5 lines)

- Cleaned the console down to `theme.css` as the single style source (deleted `App.css`, the three unused assets, and trimmed `index.css` to a minimal reset).
- Mock-backed admin auth + a working header (dynamic title, open/close user dropdown) and the required sidebar (Dashboard · Dispatch · Deliveries · Riders · Users · Issues · Pricing · Reports).
- Added the missing `/deliveries/:id` detail page (timeline, POD, payment) and rebuilt every page on an admin-local mock world that matches the apps' Abuja data.
- Dispatch does real work — assign, reassign, schedule redelivery — and Riders has a KYC queue with document review, approve and reject-with-reason; Users suspend/activate; Issues assign + status; Pricing edits the real keys with a live fare preview; Reports splits day/week.
- Backendless **Settings** and the redundant **Analytics** page are deleted; admin build + lint green, mobile/shared regression unaffected.

## 3. Files created / modified / deleted

**Created (11)**
| Path | Why |
|---|---|
| `apps/admin/src/data/types.ts` | Admin-local domain types + label/badge helpers (SC-40) |
| `apps/admin/src/data/mock.ts` | Abuja mock world (deliveries, riders, users, issues, pricing) + selectors (KPIs, eligible riders, reports) |
| `apps/admin/src/data/AdminDataContext.tsx` | State + actions: assign, reassign, redelivery, KYC approve/reject, user toggle, issue assign/status, pricing, reset |
| `apps/admin/src/data/adminCredentials.ts` | Documented demo credentials |
| `apps/admin/src/components/ui.tsx` | PageHeader, KpiCard, StatusBadge, Panel, Feedback, EmptyRow, formatters |
| `apps/admin/src/pages/DispatchPage.tsx` | Unassigned → eligible riders → assign; reassign; failed → schedule redelivery |
| `apps/admin/src/pages/DeliveryDetailPage.tsx` | `/deliveries/:id` — route, payment, rider (+reassign), timeline, POD |
| `apps/admin/src/pages/IssuesPage.tsx` | Assign, status change, resolution notes |
| `apps/admin/src/pages/PricingPage.tsx` | The 18 real pricing keys with validation + live fare preview |
| `apps/admin/src/pages/ReportsPage.tsx` | Per day/week breakdown, completion + cancellation rate, revenue, status mix |
| `docs/frontend/reports/PHASE-14-REPORT.md` | This report |

**Modified (12)**
| Path | Why |
|---|---|
| `apps/admin/src/App.tsx` | Routes for all 8 sections + `/deliveries/:id`; `AdminDataProvider`; Settings/Analytics removed |
| `apps/admin/src/index.css` | Trimmed to a minimal reset (no purple, no `color-scheme`, no `#root` sizing) |
| `apps/admin/src/components/AdminLayout.tsx` | Dynamic page title, working dropdown, new sidebar |
| `apps/admin/src/context/AuthContext.tsx` | Mock-backed login against the demo credential (no dead `/auth/admin/login`) |
| `apps/admin/src/pages/{Dashboard,Deliveries,Login,Riders,Users}Page.tsx` | Rebuilt on the mock layer (KPIs, filters/pagination, demo login, KYC queue + document viewer, search + suspend/activate) |
| `docs/frontend/DEMO.md` | §5 corrected (consent links are in-app), §6 rider demo, §7 admin console demo |
| `docs/frontend/CONTRACT_LEDGER.md` | SC-40 (data duplication), SC-41 (local admin login) |
| `docs/frontend/SCAFFOLD_REGISTER.md` | Admin note: no scaffolds remain |

**Deleted (6)**
| Path | Why |
|---|---|
| `apps/admin/src/App.css` | Vite leftover, never imported |
| `apps/admin/src/assets/react.svg` / `vite.svg` / `hero.png` | Unreferenced template assets |
| `apps/admin/src/pages/SettingsPage.tsx` | Sections with no backend (SC-14) |
| `apps/admin/src/pages/AnalyticsPage.tsx` | Superseded by Reports |

## 4. Dependencies added

none (no chart library requested; the reports view is table + bar markup).

## 5. Commands run with real output

```
apps/admin$   npm run build                → tsc -b && vite build → ✓ 87 modules transformed · built in 2.59s
apps/admin$   npm run lint                 → Found 5 warnings and 0 errors. (oxlint react-hooks style hints)
apps/admin$   stale-reference check        → (no matches for SettingsPage/AnalyticsPage)
apps/shared$  npm run typecheck            → clean
apps/shared$  npm test                     → Test Files 12 passed (12) · Tests 128 passed (128)
apps/shared$  node scripts/contrast-check.mjs → ALL CHECKS PASSED
apps/customer$ npm run typecheck           → clean
apps/customer$ npx expo export --platform android → Bundled 18361ms (1563 modules) · Exported
apps/rider$    npm run typecheck           → clean
apps/rider$    npx expo export --platform android → Bundled 19018ms (1506 modules) · Exported
```

## 6. Acceptance checklist

| Criterion | ✓ | Evidence |
|---|---|---|
| Delete the Vite leftovers after confirming no references | ✓ | `App.css`, `react.svg`, `vite.svg`, `hero.png` removed; grep for references was clean before deletion |
| Remove conflicting `index.css` rules so `theme.css` is the single source | ✓ | `index.css` now only resets box-sizing/height/body margins; no purple, no `color-scheme`, no `#root` width-centering-border |
| AdminLayout header title dynamic | ✓ | `titleFor(pathname)` (8 titles + delivery-detail) |
| User dropdown works | ✓ | `menu.open` state toggles, outside-click closes, route change closes (render-phase reset) |
| Missing `/deliveries/:id` route added | ✓ | Route + `DeliveryDetailPage`; Dashboard/Deliveries/Dispatch/Issues link to it |
| Mock-backed AuthContext + documented demo credential | ✓ | `admin@trustlink.ng` / `trustlink-demo`; documented in `DEMO.md` §7 and shown on the login page |
| Dashboard KPIs | ✓ | Awaiting dispatch, active, delivered, revenue, KYC pending, open issues + two queue panels |
| Dispatch board: unassigned → eligible riders → assign | ✓ | Per-delivery candidate table with distance/ETA and Assign |
| Reassign for ASSIGNED / PICKED_UP | ✓ | Active-jobs table + delivery detail offer rider selects (excluding the current rider) |
| FAILED deliveries with Schedule redelivery | ✓ | Failed panel; disabled at 2 attempts; action returns the job to `searching` |
| Deliveries list + detail (timeline, POD, payment) | ✓ | Filters + search + pagination; detail shows events timeline, POD block and payment panel |
| Riders with KYC review queue (approve/reject + reason, document viewer) | ✓ | Queue with 5-document viewer; reject requires a reason (min 5 chars) |
| Users (search, suspend/activate) | ✓ | Search + role filter + suspend/reactivate (admins excluded) |
| Issues (assign, status) | ✓ | Assign to an admin (auto `in_progress`), status select, resolution notes |
| Pricing (real config keys) | ✓ | All 18 keys editable with validation and a fare preview |
| Small Reports page (day/week, completion + cancellation rate, revenue) | ✓ | Range toggle, breakdown table, KPIs and status mix |
| Remove Settings sections with no backend | ✓ | `SettingsPage` deleted and unlinked |
| Sidebar: Dashboard, Dispatch, Deliveries, Riders, Users, Issues, Pricing, Reports | ✓ | `navigation` array in `AdminLayout` |
| Dense but calm tables; shared filters/badges; tablet-responsive | ✓ | `table-container`/`table` classes, `form-select`/`form-input` filters, responsive grids |
| Keep Admin's own theme; mirror brand tokens | ✓ | `theme.css` untouched (navy/gold); no shared package import |
| Data layer: alias or copy + ledger | ✓ | Copied (no alias blessed in Phase 0) → **SC-40** |
| Every action changes visible mock state; no console-only buttons | ✓ | All actions mutate context state and surface a `Feedback` banner or updated row; no `console.log` handlers |

### Walk-throughs

**Assign** — Dispatch → unassigned delivery → **Assign** next to an eligible rider → the delivery leaves "Unassigned", appears under Active jobs with that rider, the rider flips to `on_trip`, and the Dashboard's "Awaiting dispatch" KPI drops.
**Reassign** — Dispatch → Active jobs → choose a rider in the row select → the job is reassigned, a `Reassigned to …` event is appended, the previous rider returns to `online`, and the detail page's rider panel updates.
**Redelivery** — Dispatch → Failed panel → **Schedule redelivery** → status becomes `searching`, the rider is cleared, the job returns to the unassigned queue with `1 of 2` attempts, and the button disables at 2 attempts.
**Approve KYC** — Riders → **Review documents** (5-document viewer) → **Approve** → the rider's badge becomes `approved`, they disappear from the queue, and they become eligible for assignment. **Reject** requires a reason and stores it on the rider (shown under the badge).

## 7. Deviations and why

- **No Vite alias for `@trustlink/shared`** — Phase 0 blessed none, so the admin copies minimal types + a compatible mock world; recorded as **SC-40**.
- **Admin auth is local** — `/auth/admin/login` does not exist (SC‑14); the demo credential is documented and the gap is logged as **SC‑41**.
- **Settings and Analytics pages deleted** rather than kept: Settings had no backend, Analytics duplicated the required Reports page.
- **No chart library** — the prompt requires asking first, and the reports view works with tables + CSS bars.
- **TanStack Query remains installed but unused**: the console runs on an in-memory store (a `useState`-backed context) so every action is instantly visible; wiring react-query to a mock would add indirection without changing behaviour.
- **Legacy page files were removed and recreated** (Login/Dashboard/Deliveries/Riders/Users) because they were hardcoded; git reports them as modified.

## 8. Ledger rows added / "Needs decision"

- **SC-40 (Resolved)** — the admin copies minimal domain types + mock data (no alias/workspace); revisit if one is approved.
- **SC-41 (Needs decision)** — the console signs in locally because no admin login route exists; decide whether to seed a real admin user + endpoint.
- No other ledger changes (the mobile app has no admin login route to call).

## 9. Scaffolds still present

- Customer: Onboarding "Slides" copy (Phase 17); permanent `__DEV__` Design Gallery; Demo menu.
- Rider: none. **Admin: none** (Settings/Analytics and the Vite leftovers deleted).

## 10. Known issues, risks, open questions

- **The console is mock-only**: nothing is persisted (a page reload resets the arena) and no request reaches the backend.
- **KYC documents are mock paths** — the viewer shows labelled placeholders, not real images (no upload/storage endpoint, SC‑35).
- **Reports have no charts** (a chart library needs approval first).
- **Assignee list is the seeded admins** (one admin in the mock).
- **Admin login is not real** (SC-41) and would need a seeded admin once the endpoint exists.
- SC-2 / SC-5 / SC-8 / SC-12 / SC-16 / SC-17 / SC-19 / SC-20 / SC-21 / SC-22 / SC-23 / SC-26 / SC-27 / SC-30 / SC-31 / SC-33 / SC-35 / SC-37 / SC-39 / SC-41 remain open.

## 11. How a human verifies this phase manually

1. `cd apps/admin && npm run dev` → open `http://localhost:5173`.
2. Sign in with `admin@trustlink.ng` / `trustlink-demo`; try a wrong password to see the error, then sign in.
3. Confirm the header title changes per section, and that the avatar dropdown opens (click again or click away to close) and logs out.
4. **Dispatch** → assign a rider to an unassigned delivery (row moves to Active jobs, rider becomes `on_trip`); reassign an active job; click **Schedule redelivery** on a failed job (moves to `searching`, attempts `1 of 2`).
5. **Dashboards/KPIs** → return to Dashboard and check "Awaiting dispatch" changed after the assignment.
6. **Deliveries** → filter by status, search by tracking number, paginate, open a delivery → timeline, payment panel, POD; from an assigned delivery, reassign the rider there.
7. **Riders** → KYC queue → **Review documents** (five labelled documents) → **Approve** one rider and **Reject** another with a short reason (rejection requires ≥5 characters); the table badges update.
8. **Users** → search a customer → **Suspend** → badge flips to `suspended`; activate again.
9. **Issues** → assign an issue to the admin (status becomes `in progress`) → set it to `resolved` and type a resolution note.
10. **Pricing** → change `base_fare`, watch the fare preview update, then **Save changes** (confirmation appears); try an empty save to see validation.
11. **Reports** → toggle **Per day / Per week**; check the KPIs, the breakdown table and the status mix bars.
12. Confirm there is **no Settings or Analytics entry** in the sidebar and no purple accent anywhere.

## 12. Proposed commit message and file list

```
feat(admin): phase 14 admin console

- admin: strip the Vite leftovers (App.css, react.svg, vite.svg, hero.png) and reduce index.css
  to a minimal reset so theme.css is the single style source
- admin: mock-backed AuthContext with a documented demo credential (no /auth/admin/login route)
- admin: working header (dynamic section title + user dropdown) and the required sidebar
  (Dashboard, Dispatch, Deliveries, Riders, Users, Issues, Pricing, Reports)
- admin: admin-local mock world (types, Abuja fixtures, state + actions) — copied, not aliased (SC-40)
- admin: Dispatch (assign / reassign / schedule redelivery), Deliveries + /deliveries/:id detail
  (timeline, POD, payment), Riders + KYC review queue with document viewer, Users (+suspend),
  Issues (assign/status), Pricing (real keys + fare preview), Reports (day/week, rates, revenue)
- admin: delete the backendless Settings and the redundant Analytics pages
- docs: DEMO.md admin + rider demo sections, ledger SC-40/SC-41, scaffold register note
```

Files to stage (29 — 11 created, 12 modified, 6 deleted): as listed in §3.

STOPPED. Awaiting approval for the next phase.
