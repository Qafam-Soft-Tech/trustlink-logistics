/** Auth/session constants. Pure TS. */
export const OTP_LENGTH = 6;
/** Spec (D4): OTP is valid for 5 minutes. */
export const OTP_EXPIRY_SECONDS = 300;
/** Fixed demo OTP shown as a hint only in demo (mock) mode. */
export const DEMO_OTP = '482913';
export const MAX_OTP_ATTEMPTS = 3;
