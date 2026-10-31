import { Test, TestingModule } from '@nestjs/testing';

import { RecipientOtp } from '../src/modules/deliveries/entities/recipient-otp.entity';
import { RecipientOtpService } from '../src/modules/deliveries/services/recipient-otp.service';
import { TermiiSmsService } from '../src/modules/auth/services/termii-sms.service';
import { MockDb, termiiSmsServiceMock } from './mock-db';

describe('M2: recipient OTP', () => {
  let module: TestingModule;
  let db: MockDb;
  let service: RecipientOtpService;
  let sms: TermiiSmsService;

  const deliveryId = 'delivery-otp-1';
  const phone = '08087654321';

  const extractCode = (): string => {
    const calls = (sms.sendMessage as jest.Mock).mock.calls;
    const message = calls[calls.length - 1][1] as string;
    const match = message.match(/\b\d{6}\b/);
    if (!match) throw new Error('No OTP found in SMS');
    return match[0];
  };

  beforeAll(async () => {
    db = new MockDb();
    module = await Test.createTestingModule({
      providers: [
        RecipientOtpService,
        ...db.providers([RecipientOtp]),
        termiiSmsServiceMock,
      ],
    }).compile();

    service = module.get<RecipientOtpService>(RecipientOtpService);
    sms = module.get<TermiiSmsService>(TermiiSmsService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    db.clear('RecipientOtp');
    (sms.sendMessage as jest.Mock).mockClear();
  });

  it('issues a code and accepts it exactly once', async () => {
    await service.issue(deliveryId, phone);
    const code = extractCode();

    expect(await service.verify(deliveryId, code)).toBe(true);
    expect(await service.verify(deliveryId, code)).toBe(false);
  });

  it('rejects a wrong code', async () => {
    await service.issue(deliveryId, phone);
    const code = extractCode();
    const wrong = code === '000000' ? '111111' : '000000';

    expect(await service.verify(deliveryId, wrong)).toBe(false);
    expect(await service.verify(deliveryId, code)).toBe(true);
  });

  it('rejects an expired code', async () => {
    await service.issue(deliveryId, phone);
    const code = extractCode();
    await db.repo('RecipientOtp').update({ deliveryId }, { expiresAt: new Date(Date.now() - 1000) });

    expect(await service.verify(deliveryId, code)).toBe(false);
  });

  it('locks after three wrong attempts', async () => {
    await service.issue(deliveryId, phone);
    const code = extractCode();
    const wrong = code === '000000' ? '111111' : '000000';

    expect(await service.verify(deliveryId, wrong)).toBe(false);
    expect(await service.verify(deliveryId, wrong)).toBe(false);
    expect(await service.verify(deliveryId, wrong)).toBe(false);
    expect(await service.verify(deliveryId, code)).toBe(false);
  });
});
