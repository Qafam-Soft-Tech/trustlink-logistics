import type { ReactNode } from 'react';
import { badgeClass, statusLabel } from '../data/types';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', color: 'var(--color-text)' }}>{title}</h2>
        {subtitle ? <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>{subtitle}</p> : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>{actions}</div> : null}
    </div>
  );
}

export function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card" style={{ padding: 'var(--spacing-md)' }}>
      <div style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)' }}>{label}</div>
      <div style={{ fontSize: 'var(--font-size-2xl, 28px)', fontWeight: 700, color: 'var(--color-navy)', marginTop: 4 }}>{value}</div>
      {hint ? <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>{hint}</div> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${badgeClass(status)}`}>{statusLabel(status as never) ?? status}</span>;
}

export function Pill({ text, tone = 'badge-gray' }: { text: string; tone?: string }) {
  return <span className={`badge ${tone}`}>{text}</span>;
}

export function Feedback({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="card" style={{ padding: 'var(--spacing-sm) var(--spacing-md)', borderLeft: '4px solid var(--color-success)', marginBottom: 'var(--spacing-md)' }}>
      {message}
    </div>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--spacing-lg)' }}>
        {message}
      </td>
    </tr>
  );
}

export function Panel({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>{title}</h3>
        {actions}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

export const percent = (value: number): string => `${Math.round(value * 100)}%`;

export const shortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' });
