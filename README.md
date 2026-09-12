# TrustLink Logistics

**Secure. Swift. Strategic.**

A last-mile delivery platform for Abuja, Nigeria. R1 MVP scope: parcel & document delivery only.

## Architecture

```
/
├── apps/
│   ├── customer/     (Expo React Native)
│   ├── rider/        (Expo React Native)
│   ├── admin/        (React Web - Vite)
│   └── shared/       (Shared theme & components)
└── backend/          (NestJS + TypeORM + PostgreSQL + Redis)
```

## Tech Stack

- **Backend**: NestJS, TypeORM, PostgreSQL, Redis, JWT Auth
- **Mobile**: React Native (Expo), React Navigation, Shared Design System
- **Web Admin**: React 18, Vite, React Router, TanStack Query
- **Payments**: Paystack / Flutterwave
- **Maps**: Google Maps Platform
- **SMS/OTP**: Termii / Africa's Talking
- **KYC**: VerifyMe / Seamfix

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm or yarn

## Quick Start

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm run start:dev
```

Backend runs on http://localhost:3000
API Docs: http://localhost:3000/api/docs

### 3. Customer App

```bash
cd apps/customer
npm install
npm start
```

Scan QR code with Expo Go app (iOS/Android) or press `w` for web.

### 4. Rider App

```bash
cd apps/rider
npm install
npm start
```

### 5. Admin Dashboard

```bash
cd apps/admin
npm install
npm run dev
```

Admin runs on http://localhost:5173
Demo login: admin@trustlink.com / admin123

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=trustlink

REDIS_HOST=localhost
REDIS_PORT=6379

PAYSTACK_SECRET_KEY=
FLUTTERWAVE_SECRET_KEY=

GOOGLE_MAPS_API_KEY=

SMS_PROVIDER=termii
SMS_PROVIDER_API_KEY=
SMS_SENDER_ID=TrustLink

KYC_PROVIDER=verifyme
KYC_PROVIDER_API_KEY=
```

## API Endpoints

### Auth
- `POST /auth/signup` - Register new user
- `POST /auth/verify-otp` - Verify OTP for signup
- `POST /auth/login` - Request login OTP
- `POST /auth/verify-login-otp` - Verify login OTP
- `GET /auth/profile` - Get current user profile
- `PUT /auth/profile` - Update profile

### Health
- `GET /health` - Health check

## Development

### Running Tests

```bash
# Backend
cd backend
npm run test
npm run test:e2e

# Mobile apps
cd apps/customer && npm test
cd apps/rider && npm test

# Admin
cd apps/admin && npm test
```

### Linting

```bash
# Backend
cd backend && npm run lint

# Admin
cd apps/admin && npm run lint
```

### Database Migrations

```bash
cd backend
npm run migration:generate -- src/database/migrations/MigrationName
npm run migration:run
npm run migration:revert
```

## Project Structure

### Backend (NestJS)
```
backend/src/
├── main.ts                 # App entry point
├── app.module.ts           # Root module
├── health.controller.ts    # Health check
├── modules/
│   ├── auth/               # Authentication (OTP, JWT)
│   ├── users/              # User management
│   ├── deliveries/         # Delivery management
│   ├── payments/           # Payment processing
│   └── notifications/      # Push/SMS notifications
├── common/
│   ├── decorators/         # Custom decorators
│   ├── guards/             # Auth & Role guards
│   └── filters/            # Exception filters
└── config/
    ├── database.config.ts  # TypeORM config
    └── redis.config.ts     # Redis config
```

### Shared Design System
```
apps/shared/src/
├── theme/
│   └── index.ts           # Colors, spacing, typography
└── components/
    ├── primitives.tsx     # Button, Input, Card, Avatar, Badge
    └── layout.tsx         # Screen, Header, TabBar, Grid
```

### Customer App (Expo)
```
apps/customer/src/
├── App.tsx                # Root with providers
├── navigation/
│   ├── AppNavigator.tsx   # Main tab + stack navigator
│   └── AuthNavigator.tsx  # Auth flow navigator
├── screens/
│   ├── HomeScreen.tsx
│   ├── NewDeliveryScreen.tsx
│   ├── TrackingScreen.tsx
│   ├── HistoryScreen.tsx
│   ├── ProfileScreen.tsx
│   └── auth/
│       ├── PhoneEntryScreen.tsx
│       ├── OtpVerificationScreen.tsx
│       └── ProfileSetupScreen.tsx
```

### Rider App (Expo)
```
apps/rider/src/
├── App.tsx
├── navigation/
│   ├── AppNavigator.tsx
│   └── AuthNavigator.tsx
├── screens/
│   ├── HomeScreen.tsx
│   ├── JobsScreen.tsx
│   ├── EarningsScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── KycScreen.tsx
│   └── auth/
│       ├── PhoneEntryScreen.tsx
│       ├── OtpVerificationScreen.tsx
│       └── ProfileSetupScreen.tsx
```

### Admin Dashboard (React Web)
```
apps/admin/src/
├── main.tsx
├── App.tsx                # Routes + providers
├── context/
│   └── AuthContext.tsx    # Auth state management
├── components/
│   └── AdminLayout.tsx    # Sidebar + Header layout
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── DeliveriesPage.tsx
│   ├── UsersPage.tsx
│   ├── RidersPage.tsx
│   ├── AnalyticsPage.tsx
│   └── SettingsPage.tsx
└── styles/
    └── theme.css          # Design tokens + components
```

## Design System

### Colors
- **Primary Navy**: `#0b1f47`
- **Accent Gold**: `#b8863a`
- **Success**: `#10b981`
- **Warning**: `#f59e0b`
- **Error**: `#ef4444`
- **Info**: `#3b82f6`

### Components
All mobile apps use shared components from `@trustlink/shared`:
- `Button` - Primary, Secondary, Outline, Ghost, Danger variants
- `Input` - With label, error, helper text, icons
- `Card` - Elevation levels
- `Avatar` - With fallback initials
- `Badge` - Status variants
- `Screen`, `ScrollableScreen` - Layout containers
- `Header`, `TabBar` - Navigation chrome
- `Row`, `Column`, `Center` - Flexbox helpers

## Deployment

### Staging (Railway/Render)
1. Connect GitHub repo
2. Add environment variables
3. Deploy backend service
4. Deploy admin web to Vercel/Netlify
5. Build mobile apps with Expo EAS

### Production
1. Promote staging build
2. Update DNS
3. Configure SSL
4. Set up monitoring

## License

Proprietary - TrustLink Logistics