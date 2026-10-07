/** Display formatters. Pure TS. Naira only (no Intl, no kobo). */
import { toCanonicalPhone } from '../validation';

export function formatNaira(amount: number): string {
  const value = Number.isFinite(amount) ? Math.round(amount) : 0;
  const sign = value < 0 ? '-' : '';
  const digits = Math.abs(value).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}\u20A6${grouped}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${formatDate(d)}, ${hh}:${mm}`;
}

/** Display form: 0803 123 4567 for canonical 11-digit input. */
export function formatPhone(input: string): string {
  const c = toCanonicalPhone(input);
  if (c.length !== 11) return input;
  return `${c.slice(0, 4)} ${c.slice(4, 7)} ${c.slice(7)}`;
}
