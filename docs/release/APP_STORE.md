# Apple App Store submission — TrustLink Customer & Rider

## 1. Before you start

- Apple Developer Program membership ($99/year).
- App Store Connect access for the team.
- A Mac is not required: EAS Build can build iOS in the cloud; EAS Submit can upload it.
- The API is live over HTTPS and the apps point at it.
- Privacy policy URL, support URL/email, screenshots, and review account.

## 2. Bundle identifiers

Already set in `app.config.ts`:

| App | Bundle ID |
|---|---|
| Customer | `com.qafam.trustlink` |
| Rider | `com.qafam.trustlink.rider` |

Preview variants use `.preview`. Do not change the production IDs after the first submission.

`ios.config.usesNonExemptEncryption` is set to `false` (standard HTTPS only), so the export-compliance prompt should be answered “No”/exempt.

## 3. Build and upload

```powershell
cd apps/customer
npx eas login
npx eas init          # first time only
npx eas build --platform ios --profile production
npx eas submit --platform ios
```

Repeat in `apps/rider`.

EAS will ask for your Apple ID, generate certificates/profiles, and upload to App Store Connect. Keep the credentials in EAS; do not commit them.

## 4. App Store Connect setup

1. **My Apps → + → New App**.
2. Platform iOS; name `TrustLink` / `TrustLink Rider`; primary language English (Nigeria/UK).
3. Bundle ID: select the ID above.
4. SKU: `trustlink-customer` / `trustlink-rider`.
5. Fill:
   - App Privacy (see §6)
   - Pricing: Free
   - Category: Business (or Productivity for rider)
   - Age rating: 18+ / no unrestricted content
   - Support URL and privacy policy URL
   - Screenshots (6.9"/6.7" iPhone required; iPad if `supportsTablet` stays true)

## 5. TestFlight

1. Build → EAS uploads the build.
2. App Store Connect → TestFlight → add internal testers.
3. Install via TestFlight and run the full customer/rider journey.
4. Fix issues before submitting to App Review.

## 6. App Privacy answers

- **Data linked to you:** contact info (name, phone, email), delivery addresses, photos (KYC/POD), payment info (processed by Paystack; card numbers are not stored), identifiers (account ID), diagnostics.
- **Data not linked to you:** aggregated diagnostics if enabled.
- **Tracking:** No.
- **Data use:** app functionality, payments, fraud prevention, customer support.
- **Retention/deletion:** in-app Account → Delete account and the privacy policy.
- **Encryption:** HTTPS in transit.

## 7. Review account and OTP

The App Review team cannot receive a real Nigerian SMS. Use the same controlled review path as Play:

1. Set `REVIEW_PHONE` and `REVIEW_OTP` in the production API environment.
2. Create the review customer account; for the rider app, create and approve a review rider.
3. In App Review Information → **Sign-In Information**, provide the phone and fixed OTP.
4. Add a note:
   > This is a delivery marketplace for Abuja, Nigeria. Use the provided phone and fixed review OTP. KYC for the review rider is already approved. Account deletion is under Account → Delete account.
5. Remove the review env vars after approval.

## 8. Screenshots

Same shot list as Play (`PLAY_STORE.md` §9). Apple needs a 6.9"/6.7" iPhone set; if `supportsTablet` remains true, it also asks for iPad screenshots. Either supply them or set `ios.supportsTablet: false` before building if the app is phone-only.

## 9. App Review notes

- Delivery marketplace, Abuja only.
- Review phone/OTP.
- Payments via Paystack; a real charge may occur if using live keys. Prefer a test/sandbox note if possible.
- KYC is manual and the review rider is approved.
- Account deletion path.
- No ads, no tracking.

## 10. Common rejection causes

- Missing privacy policy or inconsistent App Privacy answers.
- “Sign in required” without working review credentials/OTP.
- Screenshots showing placeholder or broken images.
- iPad support declared without iPad screenshots.
- Account deletion not available in-app.
- Requesting camera/photos without a clear purpose (KYC/POD only).
- Using a preview bundle ID or a development API URL.

## 11. Release

1. Submit for review.
2. Choose manual release after approval.
3. Release to the store, then monitor crash reports and API health.
4. Increment `ios.buildNumber` (or let EAS manage it) for every upload.

## 12. iOS-specific limitations

- The current R1 pilot is Android-first; iOS builds should still work because the app is Expo-managed and uses no Android-only modules.
- Apple may ask why the app is limited to Abuja; state the pilot launch area and the expansion plan.
- If Apple rejects the rider app for “business-only” access, submit it as an internal business tool or provide a demo video; the customer app is the consumer-facing listing.
