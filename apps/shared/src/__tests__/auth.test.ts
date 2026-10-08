import { describe, it, expect } from 'vitest';
import { MockStore } from '../data/mock';
import { buildScenario } from '../data/mock/scenarios';
import { DEMO_OTP } from '../domain/constants';

const RETURNING = '08031234567'; // fixture customer Amina Bello
const NEW_USER = '08099998888';
const LOCKED_ACCOUNT = '08000000000';

function store(): MockStore {
  return new MockStore(buildScenario('happy'));
}

describe('mock auth — new vs returning', () => {
  it('signup with a new phone issues an OTP', () => {
    const s = store();
    expect(s.authRequestOtp({ phone: NEW_USER, purpose: 'signup' })).toMatchObject({ message: 'OTP sent to phone number' });
  });

  it('login with an unknown phone → "No account found"', () => {
    const s = store();
    expect(() => s.authRequestOtp({ phone: NEW_USER, purpose: 'login' })).toThrowError('No account found for this number');
  });

  it('signup with the returning phone → "already exists"', () => {
    const s = store();
    expect(() => s.authRequestOtp({ phone: RETURNING, purpose: 'signup' })).toThrowError('An account already exists for this number');
  });

  it('login with the returning phone is allowed', () => {
    const s = store();
    expect(s.authRequestOtp({ phone: RETURNING, purpose: 'login' })).toMatchObject({ userId: 'cust-amina' });
  });

  it('verifying the returning phone signs in as Amina Bello', () => {
    const s = store();
    s.authRequestOtp({ phone: RETURNING, purpose: 'login' });
    const session = s.authVerifyOtp({ phone: RETURNING, code: DEMO_OTP });
    expect(session.user.id).toBe('cust-amina');
    expect(session.user.firstName).toBe('Amina');
  });

  it('verifying a new phone creates a new customer and setupProfile names it', () => {
    const s = store();
    s.authRequestOtp({ phone: NEW_USER, purpose: 'signup' });
    const session = s.authVerifyOtp({ phone: NEW_USER, code: DEMO_OTP });
    expect(session.user.phone).toBe(NEW_USER);
    expect(session.user.id).toBe(`new-${NEW_USER}`);
    const done = s.setupProfile({ phone: NEW_USER, firstName: 'Ngozi', lastName: 'Okafor', role: 'customer' });
    expect(done.user.firstName).toBe('Ngozi');
  });
});

describe('mock auth — wrong codes, lock, expiry', () => {
  it('rejects a wrong 6-digit code with attempts left', () => {
    const s = store();
    s.authRequestOtp({ phone: RETURNING, purpose: 'login' });
    expect(() => s.authVerifyOtp({ phone: RETURNING, code: '000000' })).toThrowError('Incorrect code. 2 attempt(s) left.');
  });

  it('locks after 3 wrong codes and rejects even the correct code', () => {
    const s = store();
    s.authRequestOtp({ phone: RETURNING, purpose: 'login' });
    expect(() => s.authVerifyOtp({ phone: RETURNING, code: '111111' })).toThrowError('Incorrect code. 2 attempt(s) left.');
    expect(() => s.authVerifyOtp({ phone: RETURNING, code: '222222' })).toThrowError('Incorrect code. 1 attempt(s) left.');
    expect(() => s.authVerifyOtp({ phone: RETURNING, code: '333333' })).toThrowError(/Account locked/);
    expect(() => s.authVerifyOtp({ phone: RETURNING, code: DEMO_OTP })).toThrowError(/Account locked/);
  });

  it('refuses a new OTP request while the phone is locked', () => {
    const s = store();
    s.authRequestOtp({ phone: RETURNING, purpose: 'login' });
    for (const c of ['111111', '222222', '333333']) {
      try { s.authVerifyOtp({ phone: RETURNING, code: c }); } catch { /* expected */ }
    }
    expect(() => s.authRequestOtp({ phone: RETURNING, purpose: 'login' })).toThrowError(/Account locked/);
  });

  it('resend resets attempts (wrong then resend then correct works)', () => {
    const s = store();
    s.authRequestOtp({ phone: RETURNING, purpose: 'login' });
    expect(() => s.authVerifyOtp({ phone: RETURNING, code: '000000' })).toThrowError(/2 attempt/);
    s.authResendOtp({ phone: RETURNING, purpose: 'login' });
    const session = s.authVerifyOtp({ phone: RETURNING, code: DEMO_OTP });
    expect(session.user.id).toBe('cust-amina');
  });

  it('expiry: expireOtpNow() then verify → expired', () => {
    const s = store();
    s.authRequestOtp({ phone: RETURNING, purpose: 'login' });
    s.expireOtpNow();
    expect(() => s.authVerifyOtp({ phone: RETURNING, code: DEMO_OTP })).toThrowError('OTP expired. Resend a new code.');
  });

  it('locked account phone is rejected at request time', () => {
    const s = store();
    expect(() => s.authRequestOtp({ phone: LOCKED_ACCOUNT, purpose: 'login' })).toThrowError('This account is locked. Contact support.');
  });

  it('rejects an invalid phone format', () => {
    const s = store();
    expect(() => s.authRequestOtp({ phone: '080312', purpose: 'signup' })).toThrowError(/11-digit/);
  });
});
