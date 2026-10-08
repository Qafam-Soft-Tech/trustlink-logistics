/** Auth/session constants. Pure TS. */
export const OTP_LENGTH = 6;
/** Spec (D4): OTP is valid for 5 minutes. */
export const OTP_EXPIRY_SECONDS = 300;
/** Fixed demo OTP shown as a hint only in demo (mock) mode. */
export const DEMO_OTP = '482913';
export const MAX_OTP_ATTEMPTS = 3;

/** How long a fare quote stays valid before the customer must refresh it. */
export const QUOTE_TTL_SECONDS = 300;

/** R1 launch-city service areas (Abuja). Single source of truth — fixtures and the request flow both read this. */
export const SERVICE_AREAS = [
  'Wuse 2',
  'Maitama',
  'Garki',
  'Jabi',
  'Utako',
  'Gwarinpa',
  'Kubwa',
  'Lugbe',
  'Asokoro',
  'CBD',
] as const;
export type ServiceArea = (typeof SERVICE_AREAS)[number];
