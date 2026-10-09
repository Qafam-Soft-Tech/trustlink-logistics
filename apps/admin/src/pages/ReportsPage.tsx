import { useState } from 'react';
import { useAdminData } from '../data/AdminDataContext';
import { kpis, report } from '../data/mock';
import { NGN } from '../data/types';
import { EmptyRow, KpiCard, PageHeader, Panel, percent } from '../components/ui';

export function ReportsPage() {
  const { state } = useAdminData();
  const [range, setRange] = useState<'day' | 'week'>('day');
  const rows = report(state, range);
  const summary = kpis(state);

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Delivery volume, completion and cancellation rate, and paid revenue."
        actions={
          <div className="tabs" style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
            <button className={`tab ${range === 'day' ? 'active' : ''}`} onClick={() => setRange('day')}>Per day</button>
            <button className={`tab ${range === 'week' ? 'active' : ''}`} onClick={() => setRange('week')}>Per week</button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <KpiCard label="Deliveries" value={summary.total} hint="all time (mock)" />
        <KpiCard label="Completion rate" value={percent(summary.completionRate)} hint="delivered ÷ closed jobs" />
        <KpiCard label="Cancellation rate" value={percent(summary.cancellationRate)} hint="cancelled ÷ all deliveries" />
        <KpiCard label="Revenue" value={NGN(summary.revenue)} hint="paid deliveries" />
      </div>

      <Panel title={range === 'day' ? 'Daily breakdown' : 'Weekly breakdown'}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{range === 'day' ? 'Day' : 'Week'}</th>
                <th>Deliveries</th>
                <th>Delivered</th>
                <th>Cancelled</th>
                <th>Completion</th>
                <th>Cancellation</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <EmptyRow colSpan={7} message="No activity to report yet." />
              ) : (
                rows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.deliveries}</td>
                    <td>{row.delivered}</td>
                    <td>{row.cancelled}</td>
                    <td>{percent(row.completionRate)}</td>
                    <td>{percent(row.cancellationRate)}</td>
                    <td>{NGN(row.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Status mix">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-md)' }}>
          {(['requested', 'searching', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned', 'cancelled'] as const).map((status) => {
            const count = state.deliveries.filter((d) => d.status === status).length;
            const share = state.deliveries.length ? count / state.deliveries.length : 0;
            return (
              <div key={status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                  <span>{status.replace('_', ' ')}</span>
                  <span>{count}</span>
                </div>
                <div style={{ height: 8, background: 'var(--color-background-secondary, #eef0f4)', borderRadius: 4, marginTop: 4 }}>
                  <div style={{ width: `${Math.round(share * 100)}%`, height: 8, background: 'var(--color-navy)', borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
