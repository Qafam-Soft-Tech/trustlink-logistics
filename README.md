# TrustLink Logistics

Secure. Swift. Strategic.

Last-mile delivery platform for Abuja, Nigeria. Parcels & documents only (food/groceries out of scope for R1).

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- pnpm (or npm/yarn)

### 1. Clone & Install
```bash
git clone <repo-url>
cd TrustLink\ Logistics

# Backend
cd backend
npm install

# Customer app
cd ../apps/customer
npm install

# Rider app
cd ../rider
npm install

# Admin dashboard
cd ../admin
npm install
```

### 2. Configure Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your keys (see "Environment Variables" below)
```

**Required for full auth flow:**
```env
# SMS (Termii) - get from dashboard.termii.com
SMS_PROVIDER=termii
SMS_PROVIDER_API_KEY=TLSEK_xxxxxxxxxxxxxxxx
SMS_SENDER_ID=TrustLink    # Must match approved sender ID in Termii dashboard

# Payments (Paystack) - get from dashboard.paystack.co
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx

# Maps (Google Cloud Console)
GOOGLE_MAPS_API_KEY=AIza_xxx

# KYC (VerifyMe) - get from verifyme.ng
KYC_PROVIDER_API_KEY=xxx
```

### 3. Start Infrastructure
```bash
docker compose up -d
# Starts PostgreSQL (5432) + Redis (6379)
```

### 4. Run Backend
```bash
cd backend
npm run start:dev
# API: http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

### 5. Run Mobile Apps
```bash
# Customer app
cd apps/customer
npx expo start
# Scan QR with Expo Go (same WiFi)

# Rider app (separate terminal)
cd apps/rider
npx expo start
```

### 6. Run Admin Dashboard
```bash
cd apps/admin
npm run dev
# http://localhost:5173
```

---

## Environment Variables (backend/.env)

| Variable | Required | Source |
|----------|----------|--------|
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | ✅ | Docker Compose defaults |
| `REDIS_HOST`, `REDIS_PORT` | ✅ | Docker Compose defaults |
| `JWT_SECRET` | ✅ | Generate: `openssl rand -hex 32` |
| `SMS_PROVIDER_API_KEY` | ✅ | Termii dashboard → API Key |
| `SMS_SENDER_ID` | ✅ | Termii dashboard → **Sender ID** (must be pre-approved) |
| `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` | For payments | Paystack dashboard |
| `GOOGLE_MAPS_API_KEY` | For maps/autocomplete | Google Cloud Console |
| `KYC_PROVIDER_API_KEY` | For rider KYC | VerifyMe dashboard |

---

## SMS_SENDER_ID — How to Get It

1. **Sign up** at [termii.com](https://termii.com) → verify email/phone
2. Go to **Dashboard → Sender ID** (or "Sender IDs" under SMS)
3. **Request a Sender ID** — enter your brand name (e.g., `TrustLink`)
   - Must be 11 chars max, alphanumeric only
   - Termii reviews & approves (usually within minutes/hours)
4. Once **approved**, copy the exact Sender ID string (case-sensitive)
5. Paste into `.env`:
   ```env
   SMS_SENDER_ID=TrustLink
   SMS_PROVIDER_API_KEY=TLSEK_your_key_here
   SMS_PROVIDER=termii
   ```

> ⚠️ **Unapproved Sender IDs will fail** — OTP SMS won't send. Check Termii dashboard for status.

---

## Project Structure

```
TrustLink Logistics/
├── backend/           # NestJS API
│   ├── src/modules/
│   │   ├── auth/          # Phone + OTP, JWT
│   │   ├── users/         # Profiles, KYC
│   │   ├── deliveries/    # Requests, dispatch, execution, POD
│   │   ├── payments/      # Fare calc, Paystack/Flutterwave
│   │   └── notifications/ # Push/SMS
│   └── test/              # 133 unit/integration tests
├── apps/
│   ├── customer/    # Expo (React Native)
│   ├── rider/       # Expo (React Native)
│   └── admin/       # React + Vite (web)
├── docker-compose.yml
└── README.md
```

---

## Key Commands

| Task | Command |
|------|---------|
| Backend dev server | `cd backend && npm run start:dev` |
| Backend build | `cd backend && npm run build` |
| Backend tests | `cd backend && npm test` |
| Customer app | `cd apps/customer && npx expo start` |
| Rider app | `cd apps/rider && npx expo start` |
| Admin dev | `cd apps/admin && npm run dev` |
| Admin build | `cd apps/admin && npm run build` |
| Lint (admin) | `cd apps/admin && npm run lint` |
| Start DB/Redis | `docker compose up -d` |
| Stop DB/Redis | `docker compose down` |

---

## API Documentation

Swagger UI: `http://localhost:3000/api/docs` (when backend running)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Cannot POST /api/auth/signup" | Backend not running or wrong port |
| OTP not received | Check `SMS_PROVIDER_API_KEY`, `SMS_SENDER_ID` approved in Termii |
| Expo "Unable to resolve axios" | `cd apps/customer && npm install axios --legacy-peer-deps` (same for rider) |
| Metro port in use | Expo auto-picks next port (8082, 8083...) |
| Phone can't reach backend | Use `--tunnel` flag: `npx expo start --tunnel` |
| Admin login fails | Use `admin@trustlink.com` / `admin123` (dev only) |

---

## License

Proprietary — TrustLink Logistics 2026