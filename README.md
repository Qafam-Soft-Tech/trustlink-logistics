# TrustLink Logistics

Secure. Swift. Strategic.

Last-mile parcel and document delivery for Abuja, Nigeria. R1 scope is parcels and documents only — food, groceries, live GPS tracking, rider earnings, and automatic dispatch are deliberately deferred (see `docs/REQUIREMENTS.md` §9).

---

## Stack

| Piece | Stack |
|---|---|
| Backend | NestJS 11, TypeORM, PostgreSQL, Redis |
| Customer / Rider | Expo SDK 57, React Native 0.86, TypeScript |
| Admin | React 19, Vite, React Router, TanStack Query |
| Shared | `apps/shared` — theme, primitives, domain logic, data ports/adapters |

The repository is an **npm workspace** covering `apps/*`. `backend/` is a separate npm project with its own lockfile.

---

## Prerequisites

- Node.js 20+ (`.nvmrc` is provided)
- npm
- Docker Desktop (Postgres + Redis)
- Android device or emulator for the mobile apps
- `eas-cli` only when producing installable builds (see `docs/release/BUILD.md`)

---

## Install

Install apps from the **repo root** — never inside an app directory:

```bash
npm install
```

`@trustlink/shared` resolves as a workspace dependency and there is one root `package-lock.json`.

Install the backend separately:

```bash
cd backend
npm install
```

> On Windows this machine exports `NODE_ENV=production` globally. npm then skips dev dependencies. Run installs with `NODE_ENV=development` (PowerShell: `$env:NODE_ENV='development'`). Do **not** set it for build/export commands.

---

## Configure

```bash
cd backend
cp .env.example .env
```

Fill in the values you have. Missing payment, SMS, maps, KYC, or storage keys are tolerated in development — the relevant services fall back to local behavior. Real values are never committed; `.env` is git-ignored.

The mobile apps and console read their data source from the environment:

| App | Variables |
|---|---|
| Customer | `EXPO_PUBLIC_DATA_SOURCE=mock\|api`, `EXPO_PUBLIC_API_URL` |
| Rider | `EXPO_PUBLIC_DATA_SOURCE=mock\|api`, `EXPO_PUBLIC_API_URL` |
| Admin | `VITE_DATA_SOURCE=mock\|api`, `VITE_API_URL` |

Development defaults to `mock`; non-development builds must set the variable explicitly. See each app's `.env.example`.

---

## Run

```bash
# 1. Infrastructure
docker compose up -d --wait

# 2. Backend (from backend/)
npm run start:dev
# API:      http://localhost:3000/api
# Swagger:  http://localhost:3000/api/docs
# Health:   http://localhost:3000/api/health

# 3. Customer app (from apps/customer/)
npx expo start

# 4. Rider app (from apps/rider/, second terminal)
npx expo start

# 5. Admin console (from apps/admin/)
npm run dev
# http://localhost:5173
```

For tester APKs and EAS profiles, follow `docs/release/BUILD.md`. The mobile apps no longer rely on Expo Go for release testing.

### Demo credentials (mock data mode only)

| App | Credential |
|---|---|
| Customer | `08031234567` / OTP `482913` |
| Rider | `08050000001` / OTP `482913` |
| Admin | `admin@trustlink.ng` / `trustlink-demo` |

These are fixtures, not real accounts. The API-backed admin login arrives with the backend hardening milestone.

---

## Test

```bash
# Backend (from backend/)
npm run test:unit          # fast, no database required
npm run test:integration   # real Postgres (Docker); no suites yet
npm run test:e2e           # HTTP end-to-end; uses Postgres

# Shared domain/data tests
npm test --workspace @trustlink/shared

# Typechecks (all workspaces that define one)
npm run typecheck

# Admin build
npm run build
```

`npm test` at the root runs the shared suite plus the backend unit suite. Integration and e2e intentionally need Docker.

---

## Project structure

```
/
├── AGENTS.md
├── docs/
│   ├── REQUIREMENTS.md          # source of truth for what to build
│   ├── DEVELOPMENT_ROADMAP.md   # phased build plan
│   ├── frontend/                # frontend contract ledger, hand-off, phase reports
│   └── release/BUILD.md         # EAS build and install instructions
├── apps/
│   ├── customer/                # Expo app
│   ├── rider/                   # Expo app
│   ├── admin/                   # React + Vite console
│   └── shared/                  # design system + domain + data layer
├── backend/                     # NestJS API
└── docker-compose.yml           # Postgres + Redis
```

---

## Key commands

| Task | Command |
|---|---|
| Install apps | `npm install` (repo root) |
| Install backend | `cd backend && npm install` |
| Backend dev server | `cd backend && npm run start:dev` |
| Backend build | `cd backend && npm run build` |
| Backend unit tests | `cd backend && npm run test:unit` |
| Backend e2e tests | `cd backend && npm run test:e2e` |
| Backend lint | `cd backend && npm run lint` |
| Shared tests | `npm test --workspace @trustlink/shared` |
| Admin dev / build | `cd apps/admin && npm run dev` / `npm run build` |
| Customer app | `cd apps/customer && npx expo start` |
| Rider app | `cd apps/rider && npx expo start` |
| Infrastructure | `docker compose up -d --wait` / `docker compose down` |

---

## API documentation

Swagger UI is served at `http://localhost:3000/api/docs` while the backend runs. It will be disabled in production.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Install skips dev dependencies | Set `NODE_ENV=development` for the install |
| Backend cannot connect to Postgres over SSL | Run with `NODE_ENV=development`, not `production` |
| Backend unreachable from a physical phone | Set `EXPO_PUBLIC_API_URL` to your machine's LAN address, e.g. `http://192.168.1.20:3000/api` |
| OTP not received | Check the Termii API key and that `SMS_SENDER_ID` is approved |
| Metro port in use | Expo picks the next port (8082, 8083, …) |
| Console shows demo data | Set `VITE_DATA_SOURCE=api` and `VITE_API_URL` for a real backend |
| `npm install` inside an app recreates a lockfile | Delete that lockfile; always install from the repo root |

---

## Documentation

- `docs/REQUIREMENTS.md` — functional/non-functional requirements, data model, state machine
- `docs/DEVELOPMENT_ROADMAP.md` — phased delivery plan and test strategy
- `docs/frontend/CONTRACT_LEDGER.md` — spec conflicts and client↔backend contract status
- `docs/frontend/HANDOFF.md` — what the backend still owes the clients
- `docs/release/BUILD.md` — installable builds with EAS

---

## License

Proprietary — TrustLink Logistics 2026
