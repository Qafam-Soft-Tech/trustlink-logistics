# TrustLink — API keys and accounts checklist

Everything below is set in the **API environment** (Render/Railway dashboard or `backend/.env` locally), never in the mobile bundle. `EXPO_PUBLIC_*` values are public; secrets must not go there.

Legend: **Required** = the pilot cannot work without it. **Optional** = current MVP works without it; add when the feature is switched on.

---

## 1. Application secrets

| Variable | Required | What it does | How to create |
|---|---|---|---|
| `JWT_SECRET` | Yes | Signs user/admin tokens; keep it stable | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `OTP_HASH_SECRET` | Yes | HMAC key for salted OTP hashes | Generate a second, different value |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_PHONE` | One-off | `seed:admin`/`seed:admin:prod` creates the first admin | Choose a strong password; store it in a password manager |
| `REVIEW_PHONE` / `REVIEW_OTP` | Only during store review | Fixed OTP for one allowlisted reviewer phone | Use a Nigerian-format phone and a random 6-digit code; remove after approval |

---

## 2. Database

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes (managed) | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `DB_SSL` | Yes | `true` for Neon/Supabase/Railway/Render |
| `DB_SYNCHRONIZE` | Yes | **`false` in production** |
| `DB_MIGRATIONS_RUN` | Yes | `true` for a single instance; use a release job for multiple instances |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | Alternative | Only when not using `DATABASE_URL` |

Recommended providers: Neon, Supabase, Railway Postgres, Render Postgres. Turn on backups/PITR.

---

## 3. SMS / OTP — Termii

| Variable | Required | Notes |
|---|---|---|
| `SMS_PROVIDER` | Yes | `termii` |
| `SMS_PROVIDER_API_KEY` | Yes | Termii dashboard → API Keys |
| `SMS_SENDER_ID` | Yes | Register/approve a sender ID (e.g. `TrustLink`) in Termii |
| `SMS_BASE_URL` | Yes | `https://api.ng.termii.com/api` |

Steps:
1. Create a Termii account.
2. Request/approve the sender ID. Unapproved sender IDs fail or show a generic sender.
3. Copy the API key into `SMS_PROVIDER_API_KEY`.
4. Send a test OTP to your own phone from the app.
5. If SMS fails, the API logs `OTP for <phone> stored but SMS not sent`; the OTP is only logged in development, never production.

Without Termii, production users cannot sign in.

---

## 4. Payments — Paystack (primary)

| Variable | Required | Notes |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | Yes for real payments | Paystack dashboard → Settings → API Keys → **Live secret key** |
| Webhook URL | Yes | `https://api.yourdomain.com/api/payments/webhook/paystack` |
| `PAYMENT_PROCESSING_TTL_MINUTES` | Recommended | `15` — stale checkout attempts are cancelled after this |

Steps:
1. Complete Paystack business/KYC verification for live payments.
2. Copy the live secret key. Do **not** put the public key in the mobile app; the backend returns the Paystack authorization URL.
3. Add the webhook URL. Paystack signs the raw body with the secret key; the API verifies it.
4. Start with a small live payment to your own account, confirm the delivery moves to `SEARCHING`, then refund it from the Paystack dashboard if needed.
5. Test a failed payment and confirm the retry flow works.

Without a key, the backend uses a mock checkout and success path — suitable only for local testing, never for production.

---

## 5. Payments — Flutterwave (optional)

| Variable | Required | Notes |
|---|---|---|
| `FLUTTERWAVE_SECRET_KEY` | Optional | Only if offering Flutterwave |
| `FLUTTERWAVE_WEBHOOK_HASH` | Optional | Dashboard **verif-hash**, not the secret key |
| Webhook URL | Optional | `https://api.yourdomain.com/api/payments/webhook/flutterwave` |

The backend compares the `verif-hash` exactly. If you only use Paystack, leave these blank.

---

## 6. File storage — Cloudflare R2 / S3

| Variable | Required | Notes |
|---|---|---|
| `STORAGE_DRIVER` | Yes | `s3` in production (`local` only for development) |
| `S3_ENDPOINT` | R2/S3-compatible | e.g. `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_REGION` | Yes | `auto` for R2 |
| `S3_BUCKET` | Yes | e.g. `trustlink-uploads` |
| `S3_ACCESS_KEY_ID` | Yes | R2 API token / S3 access key |
| `S3_SECRET_ACCESS_KEY` | Yes | Corresponding secret |
| `S3_PUBLIC_BASE_URL` | Yes | CDN or public bucket base URL, no trailing slash |

Steps:
1. Create the bucket.
2. Create an API token limited to that bucket (`Object Read & Write`).
3. Set the five `S3_*` values and `S3_PUBLIC_BASE_URL`.
4. Configure bucket CORS: `GET`/`HEAD` from the admin origin and the mobile apps (or `*` for public images).
5. Test rider KYC upload → admin review image; POD upload → customer proof.

Without durable object storage, KYC and POD images disappear on redeploy.

---

## 7. Google Maps Platform (optional for R1)

The current fare engine uses the Abuja area coordinate table and does not call Google. Add Maps only when you need live geocoding, route distance, or a map view:

| Key | APIs | Where |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` (backend, secret) | Geocoding, Distance Matrix | API environment |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (mobile, public) | Maps SDK for Android/iOS | EAS build env |

Restrict the backend key by IP and the mobile key by Android package/iOS bundle ID. Until then, no Maps key is required.

---

## 8. KYC verification (optional)

R1 uses **manual admin review**; uploaded documents are stored and an admin approves/rejects. If you buy VerifyMe or Seamfix later:

| Variable | Notes |
|---|---|
| `KYC_PROVIDER` | `verifyme` / `seamfix` |
| `KYC_API_KEY` | Provider key |
| `KYC_BASE_URL` | Provider endpoint |

Not needed for the pilot.

---

## 9. Expo / EAS / stores

| Account | Required | Notes |
|---|---|---|
| Expo account | Yes | `eas login`; `eas init` writes `extra.eas.projectId` into `app.config.ts` — commit it |
| Google Play Console | Android | One-time $25 registration; create the app + internal testing track |
| Apple Developer Program | iOS | $99/year; App Store Connect access |
| Android keystore | Yes | Let EAS generate and store it; never commit it |
| Apple certificates/profiles | iOS | EAS can generate them with your Apple login |
| Privacy policy URL | Both stores | Host `docs/legal/PRIVACY_POLICY.md` publicly |
| Support URL/email | Both stores | Use a real monitored address |

---

## 10. Optional operations

| Variable | Purpose |
|---|---|
| `REDIS_URL` / `REDIS_HOST` | Future Redis throttling/cache; not currently used |
| `SENTRY_DSN` | Error tracking (not wired yet) |
| `SMTP_*` | Email notifications (not wired yet) |
| `THROTTLE_LIMIT` | Requests/minute/IP; default 120 |
| `CORS_ORIGINS` | Comma-separated admin origin(s) |

---

## 11. Where each secret lives

| Secret | Local | Production | Mobile app |
|---|---|---|---|
| JWT/OTP secrets | `backend/.env` | API env | Never |
| Termii key | `backend/.env` | API env | Never |
| Paystack secret | `backend/.env` | API env | Never |
| S3/R2 secret | `backend/.env` | API env | Never |
| API base URL | `apps/*/.env` | `eas.json` `EXPO_PUBLIC_API_URL` | Public |
| Data source | `apps/*/.env` | `eas.json` `EXPO_PUBLIC_DATA_SOURCE=api` | Public |

`.env` files are git-ignored. Never paste a live key into chat, a screenshot, or the repository. Rotate a key immediately if it is exposed.

---

## 12. Quick “minimum to launch” list

1. `DATABASE_URL` + `DB_SSL=true` + `DB_SYNCHRONIZE=false` + `DB_MIGRATIONS_RUN=true`
2. `JWT_SECRET`, `OTP_HASH_SECRET`
3. Termii API key + approved sender ID
4. Paystack live secret key + webhook URL
5. R2/S3 bucket + five `S3_*` values + `S3_PUBLIC_BASE_URL`
6. `PUBLIC_BASE_URL`, `CORS_ORIGINS`
7. Admin seed credentials
8. Expo account + EAS project IDs + Google Play / Apple Developer accounts

Everything else (Flutterwave, Maps, KYC provider, Sentry, Redis) can follow after the pilot.
