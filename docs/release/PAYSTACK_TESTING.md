# Paystack test-mode setup and testing

## 1. Where the keys go

Only the **secret key** is used by this backend. The mobile app does not receive either key; it opens the `authorization_url` returned by the API.

Edit `backend/.env`:

```text
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...   # optional; not used by the current backend flow
PAYSTACK_CALLBACK_URL=            # optional; leave blank for the current browser-close flow
```

Never commit `.env` and never paste the secret key into chat, screenshots, or issue trackers.

Restart the backend after editing:

```powershell
cd backend
$env:NODE_ENV='development'
npm run start:dev
```

## 2. Verify the key before using the app

```powershell
cd backend
npm run check:paystack
```

The script creates a pending TEST transaction and prints the reference and Paystack checkout URL. It never prints the secret key.

- `Paystack key accepted` → the key is valid.
- `HTTP 401` → wrong/revoked key.
- `HTTP 400` → usually an invalid email/amount payload.

## 3. Test the full app flow

1. Start the backend and the customer app.
2. Sign up / log in, create a delivery, accept the fare.
3. On the payment sheet, choose Paystack and pay.
4. The app opens the Paystack test checkout. Use a Paystack test card from the dashboard/docs (for example `4084 0840 8408 4081`, any future expiry, CVV `408`, PIN `0000`, OTP `123456` — confirm the current test cards in your Paystack dashboard).
5. After success, return to the app. The app calls `POST /payments/verify/:reference`.
6. Check:
   - `payments.status = success`
   - `deliveries.status = searching`
   - the admin Dispatch board shows the delivery
7. Test a failed payment and confirm the retry flow.

## 4. Webhooks

The app flow verifies the payment directly, so a webhook is not required for the device test. To test the webhook locally:

1. Expose the API with a tunnel, e.g. `cloudflared tunnel --url http://localhost:3000` or `ngrok http 3000`.
2. Set the Paystack webhook URL to `https://<tunnel>/api/payments/webhook/paystack`.
3. Send a test event or complete a test payment.
4. The backend verifies the raw-body HMAC and updates the payment.

For production, set the webhook to `https://api.yourdomain.com/api/payments/webhook/paystack`.

## 5. Test vs live

- `sk_test_` → Paystack test mode only; use test cards.
- `sk_live_` → real money. Switch only after the test flow, webhook, and refund process are verified.
- The `check:paystack` script also creates a pending transaction with a live key; use it carefully.

## 6. Common issues

- **Timeout in the admin** → the API URL in `apps/admin/.env` points at an old IP; use `http://localhost:3000/api`.
- **APK cannot reach the API** → the tester APK points at the LAN URL `http://10.209.131.15:3000/api`; the phone must be on the same Wi-Fi. For mobile-data testing, deploy the API or use a tunnel and rebuild.
- **401 from Paystack** → wrong key, test key on live mode, or whitespace in `.env`.
- **Amount mismatch** → the payment amount must equal the server fare in kobo; the app sends `Math.round(delivery.fare * 100)`.
