import { Link } from 'react-router-dom';
import { useAdminData } from '../data/AdminDataContext';
import { ACTIVE_STATUSES, kpis, unassigned } from '../data/mock';
import { NGN } from '../data/types';
import { KpiCard, PageHeader, Panel, StatusBadge, percent, shortDate } from '../components/ui';

export function DashboardPage() {
  const { state } = useAdminData();
  const summary = kpis(state);
  const dispatchQueue = unassigned(state);
  const active = state.deliveries.filter((d) => ACTIVE_STATUSES.includes(d.status)).slice(0, 6);
  const kycQueue = state.riders.filter((r) => r.kycStatus === 'pending');
  const openIssues = state.issues.filter((i) => i.status === 'open' || i.status === 'in_progress');

  return (
    <div>
      <PageHeader
        title="Control tower"
        subtitle={`${summary.active} active deliveries · ${summary.ridersOnline} riders online of ${summary.ridersTotal}`}
        actions={
          <>
            <Link className="btn btn-primary" to="/dispatch">Open dispatch board</Link>
            <Link className="btn btn-outline" to="/reports">Reports</Link>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <KpiCard label="Awaiting dispatch" value={summary.awaitingDispatch} hint="requested or searching" />
        <KpiCard label="Active" value={summary.active} hint="requested → in transit" />
        <KpiCard label="Delivered" value={summary.delivered} hint={`${percent(summary.completionRate)} of closed jobs`} />
        <KpiCard label="Revenue" value={NGN(summary.revenue)} hint="paid deliveries (mock)" />
        <KpiCard label="KYC pending" value={summary.kycPending} hint="riders waiting for review" />
        <KpiCard label="Open issues" value={summary.openIssues} hint={`${percent(summary.cancellationRate)} cancellation rate`} />
      </div>

      <Panel title="Needs a rider" actions={<Link className="btn btn-sm btn-outline" to="/dispatch">Go to dispatch</Link>}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Tracking</th><th>Route</th><th>Package</th><th>Fare</th><th>Requested</th><th>Status</th></tr>
            </thead>
            <tbody>
              {dispatchQueue.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Everything is assigned.</td></tr>
              ) : (
                dispatchQueue.slice(0, 5).map((delivery) => (
                  <tr key={delivery.id}>
                    <td><Link to={`/deliveries/${delivery.id}`}>{delivery.trackingNumber}</Link></td>
                    <td>{delivery.pickupArea} → {delivery.dropoffArea}</td>
                    <td>{delivery.packageType} · {delivery.packageWeight} kg</td>
                    <td>{NGN(delivery.fare)}</td>
                    <td>{shortDate(delivery.createdAt)}</td>
                    <td><StatusBadge status={delivery.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Active deliveries" actions={<Link className="btn btn-sm btn-outline" to="/deliveries">All deliveries</Link>}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Tracking</th><th>Customer</th><th>Route</th><th>Rider</th><th>Status</th></tr>
            </thead>
            <tbody>
              {active.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No active deliveries.</td></tr>
              ) : (
                active.map((delivery) => {
                  const rider = state.riders.find((r) => r.id === delivery.riderId);
                  return (
                    <tr key={delivery.id}>
                      <td><Link to={`/deliveries/${delivery.id}`}>{delivery.trackingNumber}</Link></td>
                      <td>{delivery.customerName}</td>
                      <td>{delivery.pickupArea} → {delivery.dropoffArea}</td>
                      <td>{rider ? `${rider.firstName} ${rider.lastName}` : '—'}</td>
                      <td><StatusBadge status={delivery.status} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
        <Panel title="KYC review queue" actions={<Link className="btn btn-sm btn-outline" to="/riders">Review</Link>}>
          {kycQueue.length === 0 ? (
            <p style={{ color: 'var(--color-text-tertiary)' }}>No riders waiting for review.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--spacing-sm)' }}>
              {kycQueue.map((rider) => (
                <li key={rider.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{rider.firstName} {rider.lastName} · {rider.vehicleType}</span>
                  <span className="badge badge-warning">pending</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Open issues" actions={<Link className="btn btn-sm btn-outline" to="/issues">Triage</Link>}>
          {openIssues.length === 0 ? (
            <p style={{ color: 'var(--color-text-tertiary)' }}>No open issues.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--spacing-sm)' }}>
              {openIssues.slice(0, 5).map((issue) => (
                <li key={issue.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <span>{issue.title} · {issue.priority}</span>
                  <StatusBadge status={issue.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
