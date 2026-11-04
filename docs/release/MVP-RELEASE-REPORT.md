# TrustLink MVP — release readiness and deep regression report

**Branch:** `mvp-m5-store-ready` (from `fe-sdk-58-upgrade` @ `119525e`)
**Date:** 2026-11-04
**Scope:** admin visual fix + M5 security/testing + M6 CI + M7 production deployment + M8 store builds + M9 store/legal.

---

## 1. Status

The backend, customer app, rider app, and admin console are **pilot-ready and store-build-ready**. What remains is external: accounts/keys, EAS project IDs, real provider credentials, final designer brand assets, store screenshots, and the actual Play/Apple submission.

The local admin styling bug is fixed: the CSS file was missing every application-shell class (`.admin-layout`, `.admin-sidebar`, `.admin-header`, `.admin-content`, navigation, user menu). The full shell stylesheet is now in `apps/admin/src/styles/theme.css`; the admin production CSS grew from 12.93 kB to 16.90 kB.

---

## 2. What was delivered

### M5 — security and real tests
- **Auth OTP hashing:** `otp_codes.code` now stores HMAC-SHA256 hashes (`OTP_HASH_SECRET` or `JWT_SECRET`), verified in constant time. Plaintext codes are logged only outside production. The DB column keeps its historical name `code`.
- **Recipient OTP:** still bcrypt-hashed, 15-minute expiry, 3-attempt lock; added a Jest-only fixed-code seam.
- **Store-review login:** `REVIEW_PHONE` + `REVIEW_OTP` gives one allowlisted reviewer phone a fixed 6-digit code (hashed like any OTP). Remove the env vars after approval.
- **CORS:** `CORS_ORIGINS` is now enforced. Mobile requests (no Origin) are allowed; unlisted browser origins get no CORS header. `trust proxy` is set for Render/Railway.
- **Scripted journey:** new `test/journey.e2e-spec.ts` walks customer signup → pay → dispatch → rider acknowledge/pickup/in-transit → recipient OTP → delivered → proof → rider freed → reports.
- **API adapter contract tests:** new shared test locks the client routes/payloads (`/deliveries`, `/pricing/calculate`, kobo conversion, `/uploads`, address delete, recipient OTP resend, notification read-all).
- **Schema gap found and fixed:** `RecipientOtp` was missing from the TypeORM entity list and the baseline migration. It is now in `src/config/entities.ts` and the regenerated migration.

### M6 — CI
`.github/workflows/ci.yml` now:
- runs backend `build`, `migration:run`, `migration:show`, lint, unit, integration, e2e against Postgres/Redis services;
- sets `DB_SYNCHRONIZE=false`, `DB_MIGRATIONS_RUN=true`, `DB_SSL=false`, `OTP_HASH_SECRET`;
- typechecks and **exports both Android bundles** (`expo export`);
- builds the backend production Docker image;
- keeps shared/admin jobs.

### M7 — production deployment
- `backend/Dockerfile` — multi-stage Node 20, production-only runtime deps, non-root user, writable `/app/uploads`, `PORT`-aware health check. Verified locally: image builds, starts healthy, returns 200, CORS allow/deny works, and the production seed script creates an admin.
- `render.yaml` — reference Render blueprint with managed Postgres, generated JWT/OTP secrets, migration flags, S3/SMS/Paystack env placeholders.
- **TypeORM migrations:** `src/config/typeorm.datasource.ts`, `src/config/entities.ts`, `1793810634540-InitialSchema.ts`; scripts `migration:generate/run/revert/show`, `schema:log`.
- `DATABASE_URL` support for Neon/Supabase/Railway; `DB_SYNCHRONIZE=false` + `DB_MIGRATIONS_RUN=true` for production.
- `seed:admin:prod` runs the compiled seed script in the production image.
- Full runbook: `docs/release/DEPLOYMENT.md`. Keys/accounts: `docs/release/API_KEYS.md`.

### M8 — store builds and assets
- Generated valid 1024×1024 PNGs for icon, adaptive foreground/background/monochrome, splash, and favicon in both apps (navy `#0b1f47` + gold `#d4a55d` TL monogram).
- `app.config.ts`: navy adaptive background, configured splash (`splash-icon.png`, navy), iOS bundle IDs (`com.qafam.trustlink`, `com.qafam.trustlink.rider`), iOS build number, `usesNonExemptEncryption: false`.
- SDK 58 patch alignment: Expo `58.0.23`, constants `58.0.15`, linking `58.0.16`, sharing `58.0.22`, splash `58.0.13`, safe-area-context `5.11.1`; doctor **20/20** on both apps.

### M9 — submission materials
- `docs/legal/PRIVACY_POLICY.md` and `TERMS_OF_SERVICE.md` (NDPA-aware drafts with placeholders).
- `docs/release/PLAY_STORE.md` and `APP_STORE.md` — account setup, builds, testing tracks, data safety/App Privacy, review OTP, screenshots, rejection causes.
- `docs/release/STORE_LISTING.md` — names, short/full descriptions, categories, keywords, URLs, graphics checklist.

---

## 3. Deep regression results

| Check | Result |
|---|---|
| Backend build | **PASS** — 0 errors |
| Backend lint | **PASS** — 0 warnings / 0 errors (root oxlint; backend-local binary blocked by a Windows App Control policy) |
| Backend unit tests | **143 / 143 PASS** (12 suites) |
| Backend e2e | **54 / 54 PASS** (4 suites: auth, RBAC, M2, full journey) |
| Shared tests | **156 / 156 PASS** (16 files, incl. 5 API contract tests) |
| Typecheck | **PASS** — customer, rider, shared |
| Admin build | **PASS** — 412.47 kB JS (126.32 kB gzip), 16.90 kB CSS |
| `expo-doctor` | **20/20 PASS** customer; **20/20 PASS** rider (one retry needed because the remote schema check lost network) |
| `expo install --check` | **Dependencies are up to date** both apps |
| Customer Android export | **PASS** — 1664 modules |
| Rider Android export | **PASS** — 1599 modules |
| Root `npm ci --dry-run` | **up to date** |
| Backend `npm ci --dry-run` | **up to date** |
| Baseline migration | **PASS** — runs on an empty Postgres, includes `recipient_otps`, `migrations` row written |
| Production Docker image | **PASS** — builds, starts, health `healthy`, `/api/health` 200 |
| Production CORS | **PASS** — allowed origin echoed; unlisted origin gets no ACAO |
| Production admin seed | **PASS** — `Admin ready: admin@journey.ng` in the production image |
| Full MVP journey | **PASS** — 5.0s, delivered + proof + rider online + report |

### Bugs found and fixed during this pass
1. **Admin shell unstyled** — all layout/navigation CSS classes were missing. Added the full shell stylesheet.
2. **Auth OTPs plaintext** — replaced with HMAC-SHA256.
3. **CORS wide open** — `cors()` ignored `CORS_ORIGINS`; now an explicit allowlist.
4. **Container health check** hardcoded port 3000; now `${PORT:-3000}`.
5. **Production image missing runtime deps** — `@nestjs/swagger`, `swagger-ui-express`, and `dotenv` were dev-only; moved to dependencies.
6. **`RecipientOtp` absent from the entity list/migration** — the journey test exposed it; fixed and migration regenerated.
7. **Docker bind/health** — app now listens on `0.0.0.0`; health check passes with a non-3000 port.
8. **SDK 58 breaking changes** — Clipboard, `forwardRef` ref types, `RefreshControl.onRefresh`; fixed and re-bundled.

---

## 4. What still requires a human / external account

These are not code gaps; they cannot be completed without credentials or assets:

1. **Provider keys** — Termii API key + approved sender ID, Paystack live secret key, R2/S3 bucket + keys, live `DATABASE_URL`, `JWT_SECRET`, `OTP_HASH_SECRET`.
2. **Expo/EAS** — `eas login`, `eas init` (writes `extra.eas.projectId`), Android keystore, Apple certificates.
3. **Store accounts** — Google Play Console, Apple Developer Program, app records, screenshots, feature graphic, final privacy/support URLs.
4. **Final brand assets** — the generated monogram PNGs are valid and store-safe; replace with the designer's final logo if different.
5. **Store review account** — set `REVIEW_PHONE`/`REVIEW_OTP`, create the customer review account, create/approve a review rider, then remove the vars after approval.
6. **iOS device pass** — the iOS build is configured but has not been run on an iPhone in this session.
7. **Post-pilot hardening** — Redis-backed throttling for multiple instances, malware scanning for KYC uploads, admin POD display, push notifications, automated KYC provider, refunds endpoint.

---

## 5. How to test now (local)

```powershell
# infra + API
cd "C:\Users\Qafams\Desktop\TrustLink Logistics"
docker compose up -d --wait
cd backend
$env:NODE_ENV='development'
npm run start:dev

# apps
cd ..\apps\customer
npx expo start -c
# second terminal
cd ..\apps\rider
npx expo start -c

# admin
cd ..\apps\admin
npm run dev
```

Admin login: `admin@trustlink.ng` / `trustlink-demo` (seed with `npm run seed:admin` if the DB was reset).

Customer/rider: use phone + OTP. The DB now stores a **hash**, so read the OTP from the backend console (`[OTP] Phone: ..., Code: ...`), not `otp_codes.code`. The recipient POD code is logged as `[DEV] Recipient OTP for delivery ...: ...` when Termii is not configured.

The admin styling fix is served now; hard-refresh `http://localhost:5173` (Ctrl+F5) if the old CSS is cached.

---

## 6. Live database and keys

- **Live database / hosting / migrations:** `docs/release/DEPLOYMENT.md`
- **Every API key and account, with acquisition steps:** `docs/release/API_KEYS.md`
- **Play Store:** `docs/release/PLAY_STORE.md`
- **App Store:** `docs/release/APP_STORE.md`
- **Listing copy:** `docs/release/STORE_LISTING.md`
- **Legal drafts:** `docs/legal/PRIVACY_POLICY.md`, `docs/legal/TERMS_OF_SERVICE.md`
- **Build commands:** `docs/release/BUILD.md`

Minimum launch set: `DATABASE_URL` + `DB_SSL=true` + `DB_SYNCHRONIZE=false` + `DB_MIGRATIONS_RUN=true`, `JWT_SECRET`, `OTP_HASH_SECRET`, Termii key/sender, Paystack live secret + webhook, R2/S3 keys, `PUBLIC_BASE_URL`, `CORS_ORIGINS`, and the admin seed.

---

## 7. Suggested commit

```
chore(release): m5-m9 security, tests, deployment and store readiness

- hash auth OTPs and add a controlled store-review code
- add the full admin shell stylesheet
- add TypeORM baseline migration, production Dockerfile, render blueprint,
  DATABASE_URL support, production seed script, and env templates
- enforce CORS_ORIGINS and trust proxy; bind 0.0.0.0
- add scripted MVP journey and API-adapter contract tests
- upgrade CI to run migrations, e2e, exports and the Docker build
- generate valid store PNGs, iOS bundle IDs and splash config
- add deployment/API-key/Play/App Store/legal documentation
```
