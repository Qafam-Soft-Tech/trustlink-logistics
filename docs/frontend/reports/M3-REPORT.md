# M3 — Customer and Rider apps on the real API

**Branch:** `mvp-m3-client-api` (from `mvp-m2-backend-integrity` @ `9a802c5`)
**Scope:** shared data layer + the customer/rider app flows that touch the backend. Admin is M4.
**Plan:** `~/.commandcode/plans/mvp-delivery-roadmap.md` (M3).

---

## 1. Summary (≤5 lines)

- Both mobile apps now use the real backend when `EXPO_PUBLIC_DATA_SOURCE=api`; mock mode still works unchanged.
- Fare quotes send pickup/dropoff **areas** and the server computes the price; the payment amount comes from the delivery's stored server fare.
- Paystack sandbox checkout opens in a browser and is verified on return; the backend's mock checkout is skipped so local testing works without keys.
- KYC documents and POD photos upload through `POST /uploads`; the rider can resend the recipient OTP from the POD screen.
- Notifications use server-side read state and polling stops on terminal delivery states.

---

## 2. What changed

### 2.1 Shared data layer
- `HttpClient.upload` + `MultipartFile` for multipart uploads.
- `FilesPort` (`files.upload`) in `DataPorts`, implemented in the API and mock adapters (mock returns the local URI so images still render).
- `DeliveryPort.resendRecipientOtp`; `NotificationPort.markRead/markAllRead/unreadCount`.
- `PricingPort.calculate` accepts areas/coordinates (the client no longer has to supply a trusted distance).
- `delivery.deleteAddress` now calls `DELETE /deliveries/addresses/:id` instead of throwing `NotSupportedByBackendError`.
- Domain: `Delivery.distanceKm` and `Notification.readAt` added.

### 2.2 Customer app
- `FareScreen` / `PaySummaryScreen` quote by area (client distance stays for display/ETA only); the displayed amount uses the server fare from the create response.
- `PaySummaryScreen` opens the Paystack/Flutterwave `authorizationUrl` with `expo-web-browser` in api mode; mock checkout URLs are skipped.
- Payment confirmation polls `verify` (10 attempts × 2 s) instead of only reading the local payment row.
- Address deletion works in api mode.
- Alerts use server `readAt`; mark-one/mark-all call the API.
- `useDelivery` stops polling on delivered/failed/returned/cancelled.
- Removed the unconditional "simulated payment" copy in api mode.

### 2.3 Rider app
- KYC form uploads the four images (front/back/selfie/vehicle registration) before submitting; local URIs are no longer sent to the API.
- POD uploads the delivery photo before completing and verifies the real recipient OTP.
- POD has a **Resend code** action.
- KYC/POD upload progress disables the submit button while uploading.

### 2.4 Build config
- `expo-web-browser ~57.0.3` added to both apps.
- `eas.json` `preview-api`/`production` URLs now include `/api`.
- Local `.env` files (git-ignored) point both apps at `http://192.168.0.152:3000/api` with `EXPO_PUBLIC_DATA_SOURCE=api`.

### 2.5 Backend adjustment
- Payment verification maps gateway `pending`/`ongoing` to `processing` (not `failed`) and the customer app re-verifies, so a sandbox payment can settle after the browser closes.
- `InitializePaymentDto.email` is optional; the controller uses `<phone>@trustlink.ng` when the profile has no email.

---

## 3. Verification

```
root$ npm run typecheck                         → customer, rider, shared clean
root$ npm test --workspace @trustlink/shared    → 15 files / 151 tests passed
apps/customer$ npx expo export --platform android → 1564 modules, exported
apps/rider$    npx expo export --platform android → 1506 modules, exported
backend$ npm run build / lint / test:unit        → clean / 0 warnings / 143 passed
backend$ npm run test:e2e                        → 3 suites / 52 tests passed
```

---

## 4. How to test on a physical Android device

1. **Backend + infrastructure**
   ```powershell
   cd "C:\Users\Qafams\Desktop\TrustLink Logistics"
   docker compose up -d --wait
   cd backend
   $env:NODE_ENV='development'
   npm run start:dev
   ```
   The API is at `http://192.168.0.152:3000/api` and Swagger at `http://localhost:3000/api/docs`.

2. **Environment**
   - `apps/customer/.env` and `apps/rider/.env` are already set to `EXPO_PUBLIC_DATA_SOURCE=api` and `http://192.168.0.152:3000/api`.
   - If the PC's Wi-Fi IP changes, update both `.env` files and restart Expo with `npx expo start -c`.
   - Allow Node.js through Windows Firewall on private networks if the phone cannot connect.

3. **OTP**
   - Without a Termii key the OTP is printed in the backend console (`[OTP] Phone: ..., Code: ...`).
   - With `SMS_PROVIDER_API_KEY` and an approved `SMS_SENDER_ID` in `backend/.env`, the SMS is real.

4. **Payments**
   - With a Paystack sandbox `PAYSTACK_SECRET_KEY`, the app opens the real sandbox checkout.
   - With a blank key, the app skips the mock checkout URL and the backend verifies it as success — useful for a pure device walkthrough.

5. **KYC approval before the rider can go online**
   ```powershell
   cd backend
   $env:NODE_ENV='development'; $env:ADMIN_EMAIL='admin@trustlink.ng'; $env:ADMIN_PASSWORD='admin-pass-123'; $env:ADMIN_PHONE='08000000001'
   npm run seed:admin
   ```
   Then use Swagger (`http://localhost:3000/api/docs`):
   - `POST /api/auth/admin/login` with the seeded email/password → copy the token, click **Authorize**.
   - `GET /api/kyc/pending` → find the rider's `userId`.
   - `PUT /api/kyc/{userId}/approve`.

6. **Dispatch**
   - The admin console is still mock until M4. Until then use Swagger:
     - `GET /api/dispatch/board`
     - `GET /api/dispatch/{deliveryId}/eligible-riders`
     - `PUT /api/dispatch/{deliveryId}/assign` with `{ "riderId": "<rider userId>" }`

7. **Run the apps**
   ```powershell
   cd apps/customer
   npx expo start -c
   # second terminal
   cd apps/rider
   npx expo start -c
   ```
   Scan the QR with Expo Go on the same Wi-Fi, or build an APK (M8).

8. **Journey**
   - Customer: sign up → OTP → profile → new delivery (Wuse 2 → Maitama) → fare → pay → tracking.
   - Rider: sign up → OTP → profile (vehicle) → KYC (4 uploads) → wait for approval → go online → job → acknowledge → pickup → in transit → POD (photo + recipient code) → delivered.
   - The rider should immediately be able to go online again (SC-43).

---

## 5. Known issues / next

1. **Admin console is still mock** — M4 wires login, dispatch, KYC, users, issues, pricing, and reports to the API.
2. **No OS push** — in-app + SMS only (decided).
3. **Rider vehicle badge** is still absent from the delivery payload (SC-22); the tracking card hides it in api mode.
4. **KYC verification is manual** — uploads are stored, but NIN checks are not automated.
5. **The recipient OTP is sent by SMS**; without a Termii key, read it from the backend console (or trigger **Resend code** and read the log).
6. **iOS/Apple Store:** the current build config is Android-only; iOS needs a bundle identifier, an Apple Developer account, and an EAS iOS build (M8/M9).

---

## 6. Proposed commit message

```
feat(apps): m3 customer and rider apps on the real api

- add files.upload + expo-web-browser; quote fares by areas and use the server
  fare for payment; open the Paystack checkout and re-verify on return
- upload KYC documents and POD photos before submitting; add recipient OTP resend
- move alerts to server read state, stop polling on terminal statuses, and call
  the real address-delete and notification endpoints
- point EAS api profiles at /api and add local api-mode env files
- map gateway pending payments to processing and make payment email optional

Co-authored-by: CommandCodeBot <noreply@commandcode.ai>
```
