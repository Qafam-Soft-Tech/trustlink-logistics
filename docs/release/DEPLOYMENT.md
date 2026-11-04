# TrustLink — production deployment runbook

This is the step-by-step path from the local pilot to a live API, live database, live admin console, and store builds.

The backend is a Docker image (`backend/Dockerfile`). It has been verified locally against a migrated empty Postgres, with `NODE_ENV=production` and `npm ci --omit=dev`. The image health check is `GET /api/health`.

---

## 1. What you are deploying

| Piece | Recommended host | Notes |
|---|---|---|
| API | Render / Railway / Fly.io (Docker) | Use the `backend/Dockerfile`; one instance is enough for the pilot |
| Postgres | Neon / Supabase / Railway / Render Postgres | Managed, backups on; `DATABASE_URL` + SSL |
| Uploads | Cloudflare R2 / AWS S3 / Backblaze B2 | `STORAGE_DRIVER=s3`; local disk is not durable |
| Admin console | Vercel / Netlify / Render Static | Build `apps/admin`, set `VITE_DATA_SOURCE=api` |
| Customer / Rider apps | EAS Build | SDK 58; see `PLAY_STORE.md` and `APP_STORE.md` |
| Redis | Optional | Current throttling is in-memory; only add when scaling beyond one instance |

A Render blueprint is included at `render.yaml` as a reference; you can use Railway/Neon instead with the same environment variables.

---

## 2. Provision the live database

1. Create a managed **PostgreSQL 16** database (Neon/Supabase/Railway/Render).
2. Copy the connection string. It looks like:
   ```text
   postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
   ```
3. Set these API environment variables:
   ```text
   DATABASE_URL=postgresql://...
   DB_SSL=true
   DB_SYNCHRONIZE=false
   DB_MIGRATIONS_RUN=true
   ```
   `DB_SYNCHRONIZE=false` is mandatory in production. The only schema authority is `backend/src/migrations/`.
4. The baseline migration is `backend/src/migrations/1793808092595-InitialSchema.ts`. It creates every table, enum, index, FK, and the `uuid-ossp` extension.
5. On first boot, `DB_MIGRATIONS_RUN=true` runs the migration automatically. For a release job or a single-instance deploy you can also run:
   ```bash
   npm run migration:run
   npm run migration:show
   ```
   For multi-instance deployments, run the migration once in a release/console job, then set `DB_MIGRATIONS_RUN=false` on the web service.
6. Verify from the provider console:
   ```sql
   select * from migrations;
   select count(*) from pricing_config; -- 18 after first boot
   ```

---

## 3. Set the API environment

Minimum production set:

```text
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://...
DB_SSL=true
DB_SYNCHRONIZE=false
DB_MIGRATIONS_RUN=true

# Secrets — generate each with:
# node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=<random-48-byte-hex>
OTP_HASH_SECRET=<different-random-48-byte-hex>

# Public URL of this API (no trailing slash)
PUBLIC_BASE_URL=https://api.yourdomain.com

# Comma-separated browser origins (the admin console). Mobile apps send no Origin.
CORS_ORIGINS=https://admin.yourdomain.com

# SMS (Termii)
SMS_PROVIDER=termii
SMS_PROVIDER_API_KEY=<termii-api-key>
SMS_SENDER_ID=TrustLink
SMS_BASE_URL=https://api.ng.termii.com/api

# Payments
PAYSTACK_SECRET_KEY=<paystack-live-secret>
FLUTTERWAVE_WEBHOOK_HASH=<optional>
PAYMENT_PROCESSING_TTL_MINUTES=15

# Uploads (S3/R2)
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=trustlink-uploads
S3_ACCESS_KEY_ID=<key>
S3_SECRET_ACCESS_KEY=<secret>
S3_PUBLIC_BASE_URL=https://cdn.yourdomain.com

# Rate limiting
THROTTLE_LIMIT=120

# Store-review only; remove after approval
REVIEW_PHONE=
REVIEW_OTP=
```

Do **not** set `DB_HOST`/`DB_USERNAME`/`DB_PASSWORD` if `DATABASE_URL` is present; `DATABASE_URL` wins.

---

## 4. Deploy the API

### Render (reference)

1. Push this repo to GitHub.
2. Render → **New → Blueprint**, select the repo. `render.yaml` creates the web service and database.
3. Fill the `sync: false` values (public URL, CORS, Termii, Paystack, S3).
4. Deploy. Wait for `GET https://api.yourdomain.com/api/health` to return `200`.
5. Run the admin seed in the Render shell:
   ```bash
   node dist/scripts/seed-admin.js
   ```
   with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE` set in the shell. The image includes the compiled seed script.

### Railway / Fly / any Docker host

```bash
docker build -t trustlink-api ./backend
docker run -p 3000:3000 --env-file .env.production trustlink-api
```

Set the same environment variables in the host dashboard. The container listens on `0.0.0.0` and exposes `/api/health`.

### Post-deploy checks

```bash
curl https://api.yourdomain.com/api/health
curl -H "Origin: https://admin.yourdomain.com" -D - https://api.yourdomain.com/api/health
```

The second command must return `Access-Control-Allow-Origin: https://admin.yourdomain.com`.
An unlisted origin must not receive that header.

---

## 5. Seed the first admin

On a machine that can reach the live database:

```bash
cd backend
export DATABASE_URL='postgresql://...'
export DB_SSL=true
export NODE_ENV=production
export JWT_SECRET='<same as API>'
export OTP_HASH_SECRET='<same as API>'
export ADMIN_EMAIL='admin@yourdomain.com'
export ADMIN_PASSWORD='<strong-password>'
export ADMIN_PHONE='08000000001'
npm run seed:admin
```

Or in the deployed container:

```bash
node dist/scripts/seed-admin.js
```

Log in at the admin console with that email/password.

---

## 6. Deploy the admin console

```bash
cd apps/admin
npm ci
VITE_DATA_SOURCE=api VITE_API_URL=https://api.yourdomain.com/api npm run build
```

Deploy `apps/admin/dist` to Vercel/Netlify/Render Static.

- Add a SPA rewrite: all paths → `/index.html`.
- Set `CORS_ORIGINS` on the API to the admin URL exactly (scheme + host, no trailing slash).
- The console polls every 10 seconds; use the avatar menu → **Refresh data** for an immediate refetch.

---

## 7. Point the mobile apps at production

Set these in `apps/customer/eas.json` and `apps/rider/eas.json` → `build.production.env`:

```json
"EXPO_PUBLIC_DATA_SOURCE": "api",
"EXPO_PUBLIC_API_URL": "https://api.yourdomain.com/api"
```

Then rebuild the apps (see `PLAY_STORE.md` / `APP_STORE.md`). JS bundles from SDK 57 or the local API URL will not work against production.

---

## 8. Configure provider webhooks

### Paystack

- Dashboard → Settings → API Keys & Webhooks.
- Webhook URL: `https://api.yourdomain.com/api/payments/webhook/paystack`
- Use the **live secret key** as `PAYSTACK_SECRET_KEY`. The backend verifies the raw-body HMAC.
- Send a test event and confirm `payments` transitions to `success` for a test reference.

### Flutterwave (optional)

- Webhook URL: `https://api.yourdomain.com/api/payments/webhook/flutterwave`
- Set `FLUTTERWAVE_WEBHOOK_HASH` to the dashboard **verif-hash** (not the secret key). The backend compares it exactly.

### Termii

- `SMS_PROVIDER_API_KEY`, approved `SMS_SENDER_ID`, `SMS_BASE_URL`.
- Send a real OTP to your phone before launch. Without a key, OTPs are only logged in development and the app cannot sign in in production.

---

## 9. Uploads (R2/S3)

1. Create a bucket (private writes, public reads or a CDN).
2. Set the five `S3_*` variables.
3. Set `S3_PUBLIC_BASE_URL` to the CDN/public host; uploads return `<base>/uploads/<file>`.
4. Add a CORS rule on the bucket:
   - Allowed origins: your admin URL and `*` for GET (images) or the exact origins.
   - Allowed methods: `GET`, `HEAD`.
5. Test: rider KYC upload → admin Riders/KYC review → image loads; POD photo → customer tracking proof.

---

## 10. Database migration from the local pilot

You do **not** copy local demo rows to production. Start clean:

1. Create the managed database.
2. Apply the baseline migration (`DB_MIGRATIONS_RUN=true` or `npm run migration:run`).
3. Seed the admin.
4. Seed pricing: it happens automatically on every boot (`FareCalculationService.initializeDefaults()`), 18 rows.
5. Create real customer/rider accounts through the apps.
6. If you must preserve specific users, export only those rows with `pg_dump --data-only --table=users` and import after migrations — never copy the whole local schema with `synchronize`.

For future schema changes:

```bash
cd backend
npm run migration:generate src/migrations/DescriptiveName
npm run migration:run
```

Commit the generated migration. Do not use `synchronize` in production.

---

## 11. Backups and rollback

- Turn on provider backups / point-in-time recovery before launch.
- Before a migration, take a manual snapshot.
- Roll back a migration with `npm run migration:revert`, but only after a backup.
- Roll back the API image to the previous deployment in the host dashboard; the database migration is the part that needs care.
- Keep `JWT_SECRET` stable across deploys; changing it invalidates every session.

---

## 12. Go-live checklist

- [ ] `/api/health` returns 200 over HTTPS
- [ ] `migrations` table has the baseline row
- [ ] `pricing_config` has 18 rows
- [ ] Admin login works
- [ ] Customer signup receives a real Termii OTP
- [ ] Paystack live payment succeeds and the delivery moves to `SEARCHING`
- [ ] Paystack webhook signature is accepted
- [ ] KYC upload lands in R2/S3 and the admin can see the image
- [ ] POD completes with the recipient SMS code
- [ ] CORS allows only the admin origin
- [ ] Nightly database backup enabled
- [ ] `REVIEW_PHONE`/`REVIEW_OTP` set only if a store review is active
