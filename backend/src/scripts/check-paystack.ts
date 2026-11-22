import 'dotenv/config';
import axios from 'axios';

/**
 * Safe Paystack key smoke test.
 * Creates a pending TEST transaction; it never prints the secret key.
 * Run: npm run check:paystack
 */
async function main(): Promise<void> {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();

  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is empty in backend/.env');
  }
  if (!/^sk_(test|live)_/.test(key)) {
    throw new Error('PAYSTACK_SECRET_KEY must start with sk_test_ or sk_live_');
  }

  console.log(key.startsWith('sk_test_') ? 'Using a Paystack TEST key.' : 'Using a Paystack LIVE key — this creates a real pending transaction.');

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: 'paystack-check@trustlink.ng',
        amount: 10000,
        currency: 'NGN',
        metadata: { purpose: 'trustlink-key-check' },
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      },
    );

    if (!response.data?.status || !response.data?.data?.authorization_url) {
      throw new Error(`Unexpected Paystack response: ${JSON.stringify(response.data)}`);
    }

    console.log('Paystack key accepted.');
    console.log(`Reference: ${response.data.data.reference}`);
    console.log(`Checkout URL: ${response.data.data.authorization_url}`);
    console.log('Open the checkout URL to complete the test payment, or use the app flow.');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Paystack check failed: HTTP ${error.response?.status ?? 'network error'}`);
      console.error(JSON.stringify(error.response?.data ?? error.message));
    } else {
      console.error(error instanceof Error ? error.message : error);
    }
    process.exitCode = 1;
  }
}

main();
