import { describe, expect, it } from 'vitest';
import { createApiAdapters } from '../data/api';
import type { HttpClient, MultipartFile } from '../data/http';

type Call =
  | { method: 'get'; path: string; config?: unknown }
  | { method: 'post'; path: string; body?: unknown; config?: unknown }
  | { method: 'put'; path: string; body?: unknown; config?: unknown }
  | { method: 'delete'; path: string; config?: unknown }
  | { method: 'upload'; path: string; file: MultipartFile };

function fakeHttp(): { http: HttpClient; calls: Call[] } {
  const calls: Call[] = [];
  const http: HttpClient = {
    get: async (path, config) => {
      calls.push({ method: 'get', path, config });
      return [] as never;
    },
    post: async (path, body, config) => {
      calls.push({ method: 'post', path, body, config });
      return {} as never;
    },
    put: async (path, body, config) => {
      calls.push({ method: 'put', path, body, config });
      return {} as never;
    },
    delete: async (path, config) => {
      calls.push({ method: 'delete', path, config });
      return undefined as never;
    },
    upload: async (path, file) => {
      calls.push({ method: 'upload', path, file });
      return { url: 'https://cdn.example/upload.jpg' } as never;
    },
  };
  return { http, calls };
}

describe('API adapter contract map', () => {
  it('posts a delivery to /deliveries', async () => {
    const { http, calls } = fakeHttp();
    const ports = createApiAdapters(http);

    await ports.delivery.create({
      pickupStreet: '1 Test Street',
      pickupArea: 'Wuse 2',
      dropoffStreet: '2 Test Street',
      dropoffArea: 'Maitama',
      packageType: 'document',
      packageWeight: 1,
      senderName: 'Sender',
      senderPhone: '08011111111',
      recipientName: 'Recipient',
      recipientPhone: '08022222222',
    });

    expect(calls[0]).toMatchObject({ method: 'post', path: '/deliveries' });
  });

  it('quotes fares from areas rather than a client distance', async () => {
    const { http, calls } = fakeHttp();
    const ports = createApiAdapters(http);

    await ports.pricing.calculate({
      pickupArea: 'Wuse 2',
      dropoffArea: 'Maitama',
      weightKg: 1,
      packageType: 'document',
    });

    expect(calls[0]).toMatchObject({
      method: 'post',
      path: '/pricing/calculate',
      body: { pickupArea: 'Wuse 2', dropoffArea: 'Maitama', weightKg: 1, packageType: 'document' },
    });
  });

  it('converts naira to kobo exactly once when initializing a payment', async () => {
    const { http, calls } = fakeHttp();
    const ports = createApiAdapters(http);

    await ports.payment.initialize({
      deliveryId: 'delivery-1',
      amountNaira: 1500.5,
      email: 'customer@example.com',
      phone: '08011111111',
      provider: 'paystack',
    });

    expect(calls[0]).toMatchObject({
      method: 'post',
      path: '/payments/initialize',
      body: { deliveryId: 'delivery-1', amount: 150050, provider: 'paystack' },
    });
  });

  it('uploads through /uploads', async () => {
    const { http, calls } = fakeHttp();
    const ports = createApiAdapters(http);

    await ports.files.upload({ uri: 'file:///id.jpg', name: 'id.jpg', type: 'image/jpeg' });

    expect(calls[0]).toEqual({
      method: 'upload',
      path: '/uploads',
      file: { uri: 'file:///id.jpg', name: 'id.jpg', type: 'image/jpeg' },
    });
  });

  it('maps the account, address, notification and recipient-OTP routes', async () => {
    const { http, calls } = fakeHttp();
    const ports = createApiAdapters(http);

    await ports.delivery.deleteAddress('address-1');
    await ports.delivery.resendRecipientOtp('delivery-1');
    await ports.notification.markAllRead();
    await ports.notification.unreadCount();

    expect(calls).toEqual([
      { method: 'delete', path: '/deliveries/addresses/address-1', config: undefined },
      { method: 'post', path: '/deliveries/delivery-1/recipient-otp/resend', body: undefined, config: undefined },
      { method: 'put', path: '/notifications/read-all', body: undefined, config: undefined },
      { method: 'get', path: '/notifications/unread-count', config: undefined },
    ]);
  });
});
