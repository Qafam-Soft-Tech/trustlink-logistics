# PHASE 4B REPORT — Auth determinism, demo reliability, deep-link config

Branch: `fe-phase-4b-auth-fixes` (created this phase from `fe-phase-4-splash-auth-session`; only tool-managed files were dirty).

---

## 1. Inspection findings (before changes)

**How mock auth decided (before):**
- `authRequestOtp` (`apps/shared/src/data/mock/store.ts`): validated the phone format, resolved a **rider by phone else the demo customer**, cleared `session`, stored `pendingPhone`, returned `{ message, userId }`. **No new-vs-returning distinction, no existence/lock checks.**
- `authVerifyOtp`: accepted **any 6-digit code** — no comparison to `DEMO_OTP`, **no attempt counter, no lock, no expiry**.
- So the "wrong code / locked / expired" states the Phase 4 UI claimed were **not backed by the mock**; only the UI's local counter faked them.

**API-mode wiring:** `apps/customer/src/data/httpClient.ts` line 2 imports the app's `api` from `../utils/api` and wraps `get/post/put/delete` over it — so **API-mode requests go through the axios instance** whose request interceptor attaches `Authorization: Bearer <token>` and whose response interceptor handles 401. **No fix required** (evidence below).

**Deep links:** `apps/customer/app.json` and `apps/rider/app.json` had **no `scheme`**. `expo-linking` is **not installed** in either app (`node_modules/expo-linking` missing; not in `package.json`), so `Linking.createURL('/')` cannot be used without adding a dependency.

**Consent links:** `PhoneEntryScreen` opens `https://trustlink.ng/terms` and `https://trustlink.ng/privacy` via `Linking.openURL`.

## 2. Summary (≤5 lines)

1. Made mock auth **deterministic**: only `482913` passes; 3 wrong codes lock the phone until Demo-menu *Reset data*; returning `08031234567` vs new phones; `08000000000` is a locked account; expiry via countdown or *Expire OTP now*.
2. Added a **13-test vitest auth suite** and made mock login rider-aware (so earlier scenario tests still pass).
3. Demo menu gains **Expire OTP now** and **Reset session & onboarding** (clears SecureStore token/user + onboarding + query cache → Splash).
4. Verified (with file evidence) API-mode requests carry the token; added **`scheme: trustlink`** to both app configs; added `DEMO.md`.
5. Full frontend regression passes: shared 81 tests, customer/rider typecheck+bundle, admin build+lint, contrast.

## 3. Files created / modified / deleted (path — why)

**Created (3)**
- `apps/shared/src/__tests__/auth.test.ts` — 13 deterministic-auth tests.
- `docs/frontend/DEMO.md` — auth cheat-sheet, demo-menu guide, deep-link commands, consent URLs.

**Modified (12)**
- `apps/shared/src/data/mock/store.ts` — deterministic auth (`AuthFlow`, `customers`, `lockedPhones`, `LOCKED_ACCOUNT_PHONE`, `expireOtpNow`), rider-aware resolution; setupProfile uses `customers`.
- `apps/shared/src/data/mock/index.ts` — `resendOtp` → store; `DemoControls.expireOtp`.
- `apps/shared/src/data/mock/scenarios.ts` — seed `customers`/`authFlow`/`lockedPhones`.
- `apps/shared/src/__tests__/scenarios.test.ts` — use `DEMO_OTP` for logins.
- `apps/customer/src/storage/authStorage.ts` — `clearOnboarding`.
- `apps/customer/src/session/SessionContext.tsx` — `resetAll`.
- `apps/customer/src/demo/DemoMenuContext.tsx` — **Expire OTP now**, **Reset session & onboarding**.
- `apps/customer/src/screens/auth/OtpVerificationScreen.tsx` — server-driven errors/lock (removed fake local counter).
- `apps/customer/app.json`, `apps/rider/app.json` — `"scheme": "trustlink"`.
- `docs/frontend/CONTRACT_LEDGER.md` — SC-18.
- `docs/frontend/SCAFFOLD_REGISTER.md` — consent external links.

**Deleted:** none. **Counts:** created 3 (2 code/docs + this report), modified 12, deleted 0. (Files listed above: 3 created, 12 modified — reconciled.)

## 4. Dependencies added

**None.** (No installs. `expo-linking` deliberately **not** added — see §7/§8.)

## 5. Commands run with real output

- Shared `npm run typecheck` → clean; `npm test` → `Test Files 6 passed (6)` · `Tests 81 passed (81)` (auth suite = 13).
- Contrast → `ALL CHECKS PASSED`.
- Customer `npm run typecheck` → clean; bundle → `Android Bundled 25993ms index.ts (1537 modules)`.
- Rider `npm run typecheck` → clean; bundle → `Android Bundled 14623ms index.ts (1526 modules)`.
- Admin `npm run build` → `✓ built in 799ms`; `npm run lint` → `Found 2 warnings and 0 errors`.

## 6. Acceptance checklist

| Criterion | ✓/✗ | Evidence |
|---|---|---|
| Every auth state reachable on demand & documented | ✓ | `DEMO.md` §2 table; mock implements each |
| Wrong codes rejected | ✓ | `auth.test.ts` (3 cases); only `DEMO_OTP` accepted |
| 3-strike lock until Reset data | ✓ | `auth.test.ts`; `lockedPhones` cleared only on store reset |
| Expiry via countdown + Expire OTP now | ✓ | `expireOtpNow()`; `auth.test.ts`; Demo menu item |
| New vs returning / unknown / existing | ✓ | `auth.test.ts` (4 cases) |
| API-mode requests carry the token | ✓ | `httpClient.ts` uses `api` (interceptor) — §7 |
| Scheme + prefixes configured | ◐ | `scheme: trustlink` + `trustlink://` done; **Expo-Go `exp://` prefix blocked** (needs `expo-linking`) → SC-18 |
| Scaffold register updated | ✓ | consent external links row |
| Counts reconcile | ✓ | created 3, modified 12, deleted 0 |
| Full regression | ✓ | §5 |

## 7. Deviations and why

1. **Expo-Go deep-link prefix NOT implemented.** The task asks for `Linking.createURL('/')`, which requires **`expo-linking`**; that package is **not installed and not on the approved dependency list**, and "No new dependencies" is stated. I did not silently add it — logged as **SC-18 "Needs decision"** and documented in `DEMO.md` §4. `trustlink://` (dev builds) **is** configured.
2. **Mock auth made rider-aware.** The stricter rules initially broke `scenarios.test.ts` (rider login + a dummy code). I treated rider-fixture phones as **known** accounts and switched the tests to `DEMO_OTP`, so the Phase 1 scenario/dispatch tests keep passing. (Riders aren't in the customer auth allow-list per the task; this is the minimal change to keep mock login working for the rider flow.)
3. **OtpVerification reworked** to surface the mock's own error/lock messages rather than a local counter (the previous local counter would have disagreed with the server after resend).
4. `expo-linking` remains uninstalled; if you approve it, the change is one line in `linking.prefixes`.

## 8. Ledger rows added / "Needs decision"

- **SC-18 (new)** — Expo-Go deep links require `expo-linking` (`Linking.createURL('/')`), which is not approved; `trustlink://` works for dev builds; Expo-Go prefix deferred. **Needs decision.**
- Open unchanged: SC-2, SC-5 (now frontend `OTP_EXPIRY_SECONDS=300`), SC-8, SC-16, SC-17, admin-login.

## 9. Scaffolds still present

`SCAFFOLD_REGISTER.md` updated with the **consent external links** row (Terms/Privacy URLs → replaced by in-app screens in Phase 11). No other scaffold changes.

## 10. Known issues, risks, open questions

- **Expo-Go deep links** unverified/blocked (SC-18) — `trustlink://` needs a dev build.
- **API mode** still not exercised end-to-end (backend frozen); the plumbing is confirmed by code, not by a live call.
- Lock is cleared only by **Demo menu → Reset data** (store rebuild) — by design.
- `setupProfile` for a brand-new phone now stores into `customers`; the demo customer remains the seeded one.

## 11. How a human verifies this phase manually

1. `cd apps/shared && npm run typecheck && npm test` → clean / **81 passed**.
2. `cd apps/customer && npm run typecheck && npx expo export --platform android` (and rider); `cd apps/admin && npm run build && npm run lint`.
3. On device via Expo Go, follow `docs/frontend/DEMO.md` §2: sign up `08099998888`; log in `08031234567`; wrong code ×3 → locked; **Demo menu → Reset data**; **Expire OTP now** → verify shows expired; log in `08099998888` → “No account found”; sign up `08031234567` → “Account already exists”; `08000000000` → locked.
4. **Demo menu** → **Reset session & onboarding** → returns to Splash and re-runs routing.

## 12. Proposed commit message and file list

```
fix(frontend): phase 4b deterministic mock auth, deep-link scheme, demo docs

- deterministic mock auth: only DEMO_OTP accepted; 3 wrong → locked until Reset data;
  returning 08031234567 vs new phones; 08000000000 locked; expiry via countdown + Expire OTP now
- add vitest auth suite (13) + rider-aware mock login
- Demo menu: Expire OTP now, Reset session & onboarding (clears token/onboarding/cache)
- add scheme trustlink to customer+rider; note Expo-Go prefix needs expo-linking (SC-18)
- add DEMO.md cheat-sheet; register consent external links in SCAFFOLD_REGISTER
```
**Files to stage:**
```
apps/shared/src/data/mock/store.ts
apps/shared/src/data/mock/index.ts
apps/shared/src/data/mock/scenarios.ts
apps/shared/src/__tests__/scenarios.test.ts
apps/shared/src/__tests__/auth.test.ts
apps/customer/src/storage/authStorage.ts
apps/customer/src/session/SessionContext.tsx
apps/customer/src/demo/DemoMenuContext.tsx
apps/customer/src/screens/auth/OtpVerificationScreen.tsx
apps/customer/app.json
apps/rider/app.json
docs/frontend/CONTRACT_LEDGER.md
docs/frontend/SCAFFOLD_REGISTER.md
docs/frontend/DEMO.md
docs/frontend/reports/PHASE-4B-REPORT.md
```
Do **not** stage `.commandcode/**`.

STOPPED. Awaiting approval for the next phase.
