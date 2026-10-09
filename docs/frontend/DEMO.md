# TrustLink — Demo Guide

Investor-demo guide for the Customer app (mock data source). Runner: `cd apps/customer && npx expo start`, then open in **Expo Go** (see "Running on a phone").

---

## 1. Running on a phone (Expo Go)
```
cd apps/customer
npx expo start
```
- Android: Expo Go → **Scan QR**. iOS: Camera → open in Expo Go.
- If the LAN QR fails (firewall / different subnet): `npx expo start --tunnel`.
- The app defaults to the **mock** data source, so no backend is required. In demo mode you'll see a **“Demo OTP: 482913”** chip on the auth screens.

## 2. Auth demo cheat-sheet

**Only `482913` is accepted.** Any other 6-digit code is *wrong*; **3 wrong codes lock the phone** until **Demo menu → Reset data**.

| Phone | Behaviour |
|---|---|
| **08031234567** | Returning customer (**Amina Bello**). **Log in** works; **Sign up** shows “An account already exists for this number”. |
| Any other valid 11-digit (e.g. **08099998888**) | **New user**. **Sign up** works (→ ProfileSetup → AccountReady); **Log in** shows “No account found for this number”. |
| **08000000000** | **Locked account** — any request shows “This account is locked. Contact support.” |
| Invalid format (e.g. `080312`) | “Enter a valid 11-digit Nigerian phone number”. |

**Auth states and how to trigger them**

| State | How to reach it |
|---|---|
| New user (sign up) | PhoneEntry → Sign up → `08099998888` → OTP `482913` → ProfileSetup |
| Returning user (log in) | PhoneEntry → Log in → `08031234567` → OTP `482913` |
| Wrong code / attempts left | Enter any 6-digit code ≠ `482913` (shows “Incorrect code. N attempt(s) left.”) |
| Locked | Enter a wrong code **3 times** (or use phone `08000000000`) → “Account locked…” |
| Expired | Let the **5:00** countdown reach 0, **or** Demo menu → **Expire OTP now**, then verify |
| No account found | Log in with `08099998888` |
| Account already exists | Sign up with `08031234567` |
| Session expired | (API mode) any 401 → the SessionExpired sheet |
| Session survives restart | Sign in, kill the app, reopen → lands on Main |

## 3. Demo menu (all builds, incl. Expo Go)
Open it by **long-pressing the version text** on **Welcome** (“Version 0.1.0 · demo build”) or **Account** (“TrustLink Customer · Version 0.1.0”), or tap **“Open demo menu”** on Account.

Items: **Scenario** chips · **Advance** active deliveries + **recipient codes** · **Theme** (System/Light/Dark) · **Reset data** · **Expire OTP now** · **Reset session & onboarding** (clears SecureStore token/user + onboarding flag + query cache, returns to Splash) · **Open Design Gallery** (dev only).

## 4. Deep links

The customer app declares `"scheme": "trustlink"` and registers prefixes **`[Linking.createURL('/'), 'trustlink://']`** (expo-linking). Routes: `track/:trackingNumber` (→ Home → Track-by-number) and `delivery/:deliveryId` (→ Tracking).

**Expo Go** (dev server running; note the URL printed by `npx expo start`, e.g. `exp://192.168.0.152:8081`):
```
npx uri-scheme open "exp://192.168.0.152:8081/--/track/TLK-2026-001" --android
npx uri-scheme open "exp://192.168.0.152:8081/--/delivery/del-005" --android
```
(On iOS use `--ios`. Replace the host/port with your own dev URL.)

**Development / release build** (after `npx expo run:android` or `eas build`):
```
npx uri-scheme open "trustlink://track/TLK-2026-001" --android
npx uri-scheme open "trustlink://delivery/del-005" --android
```

In-app equivalents (no URL needed): Home → **Track by number**, and Deliveries/Alerts → a delivery.

## 5. Consent links
The PhoneEntry consent line now opens the **in-app** Terms of Service and Privacy Policy screens (Phase 11); no external URL is used. Both are real drafts marked "Draft for legal review" (SC-34).

## 6. Rider demo (Phase 12–13)
Sign in with a rider phone that is in the KYC state you want to demo (OTP `482913`):

| Phone | Rider | KYC state |
|---|---|---|
| `08050000001` | Emeka Nwosu | approved → can go online and run jobs |
| `08050000005` | Ibrahim Sani | pending / not started → KYC intro flow |
| `08050000007` | Yusuf Musa | rejected → reason + resubmit |

Job execution needs an assigned job: the rider's queue is seeded (assigned / picked up / in transit / delivered). To exercise the redelivery path, use the **customer** app's Demo menu → **Advance** on a failed delivery (it assigns the first eligible rider), then run the job as the rider and fail it a second time.

**POD code:** the backend never generates a recipient OTP, so the demo code is the fixture value (`482913`) — revealed inside the customer app's Demo menu under **recipient codes**. The rider POD screen rejects a wrong code.

## 7. Admin console demo (Phase 14)
```
cd apps/admin
npm run dev        # http://localhost:5173
```
Sign in with:
- **Email:** `admin@trustlink.ng`
- **Password:** `trustlink-demo`

The backend has no `/auth/admin/login` route (SC-14), so the console authenticates locally against these credentials (`apps/admin/src/data/adminCredentials.ts`) and runs on an admin-local mock world (same Abuja data as the apps — SC-40).

Try: **Dispatch** → assign a rider to an unassigned delivery, reassign an active one, or **Schedule redelivery** on a failed job; **Riders** → open the KYC queue, view documents, approve or reject with a reason; **Users** → suspend/activate; **Issues** → assign and change status; **Pricing** → edit values and watch the fare preview; **Reports** → toggle per day/week.

## 8. The demo script

> **The three apps do not share live data.** Each app runs its **own in-memory mock**, so a delivery created in the customer app does **not** appear in the admin console or the rider app. The script is therefore **three independent chapters**, each starting from the seeded data of its own app. The seed tracking numbers line up (`TLK-2026-003/005/008/011`) so the story still reads as one platform. For a single-process, joined-up run of the same rules, use `cd apps/shared && npm test` (`demoScript.test.ts`) — that test is single-process and does **not** prove cross-app sync either.

### Chapter A — Customer (≈5 min)

Seeded start: Home has an active *Searching* delivery; Deliveries has one of every status.

| # | Do | Should see |
|---|---|---|
| 1 | `cd apps/customer && npx expo start -c`, Expo Go, sign in `08031234567` / `482913` | Splash → Home greeting “Amina” + the yellow **Demo data** strip |
| 2 | **Send a package** → **Home** (Wuse 2) → **Office** (CBD), recipient “Chinedu Obi” `08060000001` → **Parcel ≤5 kg** → sender prefilled → Review | Fare breakdown (base ₦500, distance, weight, minimum ₦1,000) + ETA |
| 3 | **Accept fare** → **Pay** → **Card** → **Pay** | Processing (Back blocked) → **Request confirmed** with a `TLK-…` number → **Track this delivery** |
| 4 | Watch the tracking screen | “Assigning your rider”, timeline, recipient-code card, route + ETA |
| 5 | Demo menu (long-press the version text) → **Advance** repeatedly | Rider assigned → picked up → in transit → delivered; headline, badge and timeline change each time |
| 6 | Deliveries → the delivery | **Delivered** screen: POD card, receipt (**Share**, **Email receipt**, **Get PDF receipt**), **Send again** |
| 7 | Optional | **Cancel delivery** on a *Searching* delivery (fee ₦0, full refund); Demo menu → **offline** to show the offline banner |

### Chapter B — Rider (≈4 min)

Seeded start for the approved rider `08050000001`: **`TLK-2026-005` is *assigned*** and **`TLK-2026-008` is *picked up*** (plus delivered history).

| # | Do | Should see |
|---|---|---|
| 1 | `cd apps/rider && npx expo start -c`, sign in `08050000001` / `482913` | Home: online toggle, queue count, the yellow **Demo data** strip |
| 2 | **Jobs → Active** → `TLK-2026-008` → **Continue delivery** → **Start trip** → **Arrived** → **Report a problem** → *Recipient unavailable* | “Delivery unsuccessful” with the redelivery notice (attempt 1 of 2) |
| 3 | **Jobs → Queue** → `TLK-2026-005` → **Accept job** → confirm → **Navigate with maps** → **Confirm pickup** → **Start trip** → **Arrived** | Stepper advances; the maps link opens the device maps app |
| 4 | **Complete delivery** → photo → type `000000` → then `482913` | `000000` is rejected (“Recipient code does not match”); `482913` delivers; the rider returns to **Online** |
| 5 | Optional (KYC chapter) | Sign out → `08050000005` = pending (intro flow) · `08050000007` = rejected (reason + resubmit) |

### Chapter C — Admin (≈4 min)

Seeded start in the console's own world: **`TLK-2026-003` is *searching* (unassigned)** and **`TLK-2026-011` is *failed***.

| # | Do | Should see |
|---|---|---|
| 1 | `cd apps/admin && npm run dev` → `http://localhost:5173` → sign in `admin@trustlink.ng` / `trustlink-demo` | Dashboard KPIs + the yellow **Demo data** strip |
| 2 | **Dispatch** → `TLK-2026-003` → **Assign** the nearest eligible rider | Moves to *Active jobs*; the rider turns `on_trip`; the “Awaiting dispatch” KPI drops |
| 3 | **Dispatch → Failed** → `TLK-2026-011` → **Schedule redelivery** | Back in *Unassigned* at “1 of 2” |
| 4 | **Deliveries** → filter/search → open a delivered row | Timeline, payment panel, POD; reassign from the detail page |
| 5 | **Riders** → KYC queue → **Review documents** → **Approve** one, **Reject** another with a reason | Badges update; the approved rider becomes assignable |
| 6 | **Users** (suspend/activate) · **Issues** (assign, resolve) · **Pricing** (edit → fare preview → save) · **Reports** (per day / per week) | Each action changes visible state and shows a confirmation |
| 7 | Avatar menu → **Reset demo data** | The seeded world returns |

### 5-minute cut-down (one screen per app)

- **Customer:** sign in → Home → **Send a package** (Home → Office, Parcel ≤5 kg) → Review → **Accept fare** → **Pay** → Request confirmed → **Track**.
- **Admin:** sign in → **Dispatch** → assign the unassigned job → **Riders** → approve the pending rider → **Reports**.
- **Rider:** sign in `08050000001` → **Jobs → Queue** → **Accept job** → **Confirm pickup** → **Start trip** → **Arrived** → **Complete delivery** with `482913`.

**Optional beats:** wrong POD code (Chapter B step 4); a second failure → **Returned to sender**; customer Demo menu → **emptyAccount** for the empty states and **offline** for the offline banners.

## 9. What is real vs mocked

See `docs/frontend/HANDOFF.md` §2 for the full table. In one line: the **flows, state machine, validation, roles and call order are real**; the **data, providers, OTP codes, maps and money movement are mocked** (no real charge, no SMS, no push).

## 10. One-tap reset to a clean state

| App | Reset | What it restores |
|---|---|---|
| Customer | Demo menu (long-press the version text) → **Reset data** | Seeded deliveries/notifications/issues and the scenario |
| Customer | Demo menu → **Reset session & onboarding** | Clears the token, onboarding flag and query cache → back to Splash |
| Admin | Avatar menu → **Reset demo data** | The console's seeded mock world (dispatch board, KYC queue, issues, pricing) |
| Rider | Relaunch the app | Its mock is rebuilt on start (queue, KYC state, jobs) |

## 11. Known limits (say these out loud if asked)

- **The apps do not share live data.** Each app has its own in-memory mock; the three chapters in §8 are independent (the tracking numbers are chosen to match so the story reads as one platform).
- **A demo build says so**: a gold **Demo data** strip is visible on every screen while the source is mock, and a production build refuses to start without an explicit `EXPO_PUBLIC_DATA_SOURCE` / `VITE_DATA_SOURCE` (no silent default).
- No real payment, SMS or push: payments are simulated, OTPs are `482913`, and alerts are in-app only.
- Recipient codes are fixture values (the backend never issues them — SC-38).
- No maps/GPS: “Navigate” opens the device maps app with the address text.
- KYC documents are local file paths; no verification provider is wired (SC-35).
- Refunds are copy only — there is no refund action (SC-27).
- Riders are freed when a job ends **in the mock only** — the real backend never moves a rider from `on_trip` back to `online` (SC-43, high priority).
- The console is a mock control tower; nothing persists across a page reload.
- Legal text is a draft pending counsel (SC-34); support contact details are placeholders (SC-31).

## 12. Hand-off

`docs/frontend/HANDOFF.md` lists the open “Needs decision” rows, the real-vs-mocked map and the backend gaps to close, in priority order.
