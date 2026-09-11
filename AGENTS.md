# AGENTS.md — TrustLink Logistics

## Project

TrustLink Logistics ("Secure. Swift. Strategic.") — a last-mile delivery platform launching in Abuja, Nigeria. R1 MVP scope: parcel & document delivery only (food and groceries are a deliberate later phase — see roadmap). Three clients: Customer app, Rider app, Admin dashboard, sharing one backend.

## Where everything else lives

- **`docs/REQUIREMENTS.md`** — the full specification: every functional requirement (with acceptance criteria), non-functional requirements, the data model, delivery state machine, and system architecture. This is the source of truth for *what* to build.
- **`docs/DEVELOPMENT_ROADMAP.md`** — the phased build plan: what order to build in, what to test at each phase, how regression testing works, plus CI/CD and deployment. This is the source of truth for *how and in what order* to build it. **Read this before starting any work, and check which phase is current before assuming what to do next.**

## Responsibility split

**OpenCode builds the entire system end-to-end: backend, Customer app, Rider app, and Admin web dashboard — including UI implementation.** There is no separate UI/UX design phase (no wireframe/mockup deliverable stage) — build functional, clean screens directly as part of each phase, guided by the brand direction below. Ilyas is a UI/UX designer himself and will review and give design feedback as phases complete; that's art direction and iteration, not a signal to skip building real screens.

## Brand direction (for UI you build)

- Name: **TrustLink Logistics** — tagline "Secure. Swift. Strategic."
- Colors: navy `#0b1f47` (primary), gold `#b8863a` (accent)
- Tone: clean, trustworthy, modern logistics/fintech feel — not playful or cluttered
- Logo file: place the provided TrustLink logo asset in `apps/*/assets/` for each client app

## Stack

- Backend: NestJS (Node/TypeScript), PostgreSQL, Redis
- Customer app / Rider app: React Native (Expo)
- Admin dashboard: React (web)
- Payments: Paystack / Flutterwave
- Maps/geocoding: Google Maps Platform
- SMS/OTP: Termii or Africa's Talking
- Rider KYC verification: VerifyMe or Seamfix

## Repo layout

```
/
├── AGENTS.md
├── docs/
│   ├── REQUIREMENTS.md
│   └── DEVELOPMENT_ROADMAP.md
├── apps/
│   ├── customer/     (Expo)
│   ├── rider/        (Expo)
│   └── admin/        (React web)
└── backend/          (NestJS — modules: auth, users, deliveries, payments, notifications)
```

## Commands

(Fill in exact commands here once Phase 1 scaffolding is complete — e.g. `npm run start:dev`, `npm run test`, `npm run test:e2e`, `npm run lint`. Keep this section current; it's the first thing every session needs.)

## Conventions

- Conventional commits: `feat:`, `fix:`, `test:`, `chore:`, `docs:`
- One feature branch per roadmap phase: `phase-N-short-description`
- PR + green CI required to merge to `main`
- All secrets via `.env` (git-ignored) — never hardcoded, never committed

## Ground rules

1. Don't start a phase before the previous one has passed its full regression run (per `docs/DEVELOPMENT_ROADMAP.md`).
2. Don't guess on ambiguous requirements — flag it as "Needs decision" instead of silently picking an answer.
3. Build real, functional UI for every phase's screens — not placeholders — using the brand direction above. Ilyas reviews design quality as a designer; that's iteration, not a reason to under-build.
4. "Regression" always means the full accumulated test suite from Phase 1 forward, not just the current phase's new tests.
5. If `docs/DEVELOPMENT_ROADMAP.md` and `docs/REQUIREMENTS.md` ever disagree, `REQUIREMENTS.md` wins — flag the conflict.
