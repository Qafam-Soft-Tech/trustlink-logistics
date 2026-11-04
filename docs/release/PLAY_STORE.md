# Google Play submission — TrustLink Customer & Rider

## 1. Before you start

- Google Play Console account ($25 one-time).
- A public privacy-policy URL (host `docs/legal/PRIVACY_POLICY.md`; see §8).
- Support email and phone that you actually monitor.
- App icon 512×512 PNG (source `assets/icon.png`), feature graphic 1024×500, at least 2 phone screenshots per app.
- A review account path: see §6.
- The API is live and the apps’ `EXPO_PUBLIC_API_URL` points to it.

## 2. Build the Play bundle

```powershell
cd apps/customer
npx eas login
npx eas init          # first time only; writes extra.eas.projectId into app.config.ts
npx eas build --platform android --profile production
```

Repeat in `apps/rider`.

The `production` profile builds an **AAB** with:
- customer package `com.qafam.trustlink`
- rider package `com.qafam.trustlink.rider`
- SDK 58, API data source, production API URL.

Download the `.aab` from the build page. Do not upload the preview APK to Play.

## 3. Create the app in Play Console

1. **All apps → Create app**.
2. App name: `TrustLink` (customer) / `TrustLink Rider`.
3. Default language: English (Nigeria) or English (UK).
4. App or game: App. Free.
5. Accept the declarations.
6. **App content** → complete:
   - Privacy policy URL.
   - Ads: No.
   - App access: see §6.
   - Content rating questionnaire.
   - Target audience: 18+.
   - Data safety: see §5.
   - Government apps: No.
   - Financial features: payments for delivery services, not financial services.

## 4. Internal testing first

1. **Testing → Internal testing → Create new release**.
2. Upload the `.aab`.
3. Add your own Google account as a tester.
4. Roll out; install from the opt-in link; run the full journey.
5. Fix anything before promoting to closed/production.

## 5. Data safety answers (customer and rider)

- **Data collected:** name, phone number, email (optional), address, photos (KYC/POD), payment info (processed by Paystack; the app does not store card numbers), app diagnostics.
- **Purpose:** account management, delivery, payments, fraud prevention, support.
- **Shared with third parties:** payment processor, SMS provider, cloud storage/hosting. Not sold.
- **Encrypted in transit:** Yes.
- **Users can request deletion:** Yes — in-app Account → Delete account, or the support email.
- **Data deletion URL/email:** `[privacy@yourdomain.com]`.
- **Data retention:** as described in the privacy policy.

## 6. App access for reviewers

Reviewers cannot receive a real SMS to a Nigerian number. Use the controlled review account:

1. In the API environment set:
   ```text
   REVIEW_PHONE=08099990000
   REVIEW_OTP=<random 6 digits>
   ```
2. Create the review customer account once (signup with `REVIEW_PHONE`, enter `REVIEW_OTP`).
3. For the rider app, create a review rider account, submit KYC, and approve it in the admin console before submitting.
4. In Play Console → **App content → App access**, provide:
   - Phone: `08099990000`
   - OTP: the `REVIEW_OTP` value
   - A note that the code is a review-only fixed code.
5. After approval, **remove `REVIEW_PHONE`/`REVIEW_OTP`** and rotate/deactivate the review account if appropriate.

The review OTP is hashed in the database like every other OTP. The bypass only applies to that one phone and only while the env vars are set.

## 7. Store listing copy

See `STORE_LISTING.md`. Suggested short description (≤80 characters):

> Send parcels and documents across Abuja with verified riders and live tracking.

Full description: use the customer copy in `STORE_LISTING.md`. Rider listing: use the rider copy.

## 8. Privacy policy URL

Host the policy publicly, for example:
- GitHub Pages from the `docs/legal` folder (if the repo is public), or
- Vercel/Netlify static site, or
- A page on `yourdomain.com/privacy`.

The URL must be reachable without login and match the policy in the app.

## 9. Screenshots and graphics

Customer app shot list:
1. Welcome / value proposition
2. New delivery address selection
3. Fare breakdown
4. Live tracking
5. Delivery history/receipt
6. Alerts or support

Rider app:
1. Welcome
2. Online dashboard
3. Job details
4. Pickup/in-transit steps
5. Proof of delivery
6. Alerts/history

Use a clean test account and real-looking Abuja addresses. Do not show real customer phone numbers or KYC documents.

## 10. Review notes

Include:
- The app is a delivery marketplace operating in Abuja, Nigeria.
- Review phone + fixed OTP (above).
- Payment uses Paystack sandbox/live; if live, note that a real charge may occur.
- KYC is manual; the rider review account is already approved.
- Account deletion: Account → Delete account.

## 11. Production rollout

1. Complete **App content** and store listing 100%.
2. Create a production release with the AAB.
3. Use a staged rollout (e.g. 10% → 50% → 100%).
4. Watch crash/ANR reports and the API health/logs.
5. Bump `android.versionCode` in `app.config.ts` before every subsequent upload.

## 12. Common rejection causes

- Missing/incorrect privacy policy URL.
- Data safety answers inconsistent with the policy.
- App access missing or OTP instructions incomplete.
- Placeholder icons/screenshots or broken images.
- Requesting permissions without a clear use (camera/photos for KYC/POD only).
- Login that cannot be completed by the reviewer.
