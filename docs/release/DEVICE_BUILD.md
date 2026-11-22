# Physical-device APK builds

## EAS projects

Both apps are linked to Expo account `ilyas12`:

| App | EAS project ID |
|---|---|
| Customer | `3076f27c-5821-41f4-8553-5ddc5eb75ea2` |
| Rider | `15e1a905-d3ec-4d44-998d-cf3b404faeb9` |

The project IDs are in each app’s `app.config.ts` under `extra.eas.projectId`.

## Build the tester APKs

```powershell
cd apps/customer
npx eas-cli build --platform android --profile preview-api
# answer "yes" if EAS asks again about the Android keystore

cd ../rider
npx eas-cli build --platform android --profile preview-api
```

The `preview-api` profile:
- builds an APK (not an AAB),
- uses the real API,
- uses the current LAN URL `http://10.209.131.15:3000/api`.

Install from the build page/QR on the phone. `adb install -r <file>.apk` is also fine.

## Important: same Wi-Fi

The APK points at `http://10.209.131.15:3000/api`, so the phone and PC must be on the **same Wi-Fi** and the backend must be running. Windows Firewall must allow Node.js on private networks.

For testing on mobile data or from another location, you need a public API:
- deploy the backend (Render/Railway) and point `EXPO_PUBLIC_API_URL` at `https://api.yourdomain.com/api`, or
- start a temporary tunnel (`cloudflared tunnel --url http://localhost:3000`) and rebuild with that HTTPS URL.

Rebuild the APK after changing the URL; Expo public env values are baked in at build time.

## Test accounts

- Admin: `admin@trustlink.ng` / `trustlink-demo`
- Customer/rider: sign up with a phone; the OTP is printed in the backend console (`[OTP] ...`).
- POD recipient code: backend console (`[DEV] Recipient OTP ...`) when Termii is not configured.

## Production builds

- Android store: `npx eas-cli build --platform android --profile production` → AAB → Play Console.
- iOS: `npx eas-cli build --platform ios --profile production` → App Store Connect.
- Replace the production API URL in `eas.json` before either build.
