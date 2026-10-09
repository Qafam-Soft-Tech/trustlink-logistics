import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminData } from '../data/AdminDataContext';
import { NGN, type DeliveryStatus } from '../data/types';
import { EmptyRow, PageHeader, StatusBadge, shortDate } from '../components/ui';

const STATUS_OPTIONS: Array<{ value: DeliveryStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'requested', label: 'Requested' },
  { value: 'searching', label: 'Searching' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'picked_up', label: 'Picked up' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'returned', label: 'Returned' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAGE_SIZE = 10;

export function DeliveriesPage() {
  const { state } = useAdminData();
  const [status, setStatus] = useState<DeliveryStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.deliveries.filter((delivery) => {
      if (status !== 'all' && delivery.status !== status) return false;
      if (!q) return true;
      return [delivery.trackingNumber, delivery.customerName, delivery.customerPhone, delivery.recipientName, delivery.pickupArea, delivery.dropoffArea]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [state.deliveries, status, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Deliveries"
        subtitle={`${filtered.length} of ${state.deliveries.length} deliveries`}
        actions={
          <>
            <input
              className="form-input"
              placeholder="Search tracking, customer, area…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              style={{ minWidth: 240 }}
            />
            <select
              className="form-select"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as DeliveryStatus | 'all');
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </>
        }
      />

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tracking</th>
                <th>Customer</th>
                <th>Route</th>
                <th>Package</th>
                <th>Rider</th>
                <th>Fare</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <EmptyRow colSpan={9} message="No deliveries match those filters." />
              ) : (
                rows.map((delivery) => {
                  const rider = state.riders.find((r) => r.id === delivery.riderId);
                  return (
                    <tr key={delivery.id}>
                      <td><Link to={`/deliveries/${delivery.id}`}>{delivery.trackingNumber}</Link></td>
                      <td>{delivery.customerName}</td>
                      <td>{delivery.pickupArea} → {delivery.dropoffArea}</td>
                      <td>{delivery.packageType} · {delivery.packageWeight} kg</td>
                      <td>{rider ? `${rider.firstName} ${rider.lastName}` : '—'}</td>
                      <td>{NGN(delivery.fare)}</td>
                      <td><span className={`badge ${delivery.paymentStatus === 'success' ? 'badge-success' : 'badge-warning'}`}>{delivery.paymentStatus}</span></td>
                      <td><StatusBadge status={delivery.status} /></td>
                      <td>{shortDate(delivery.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 ? (
          <div className="pagination" style={{ display: 'flex', gap: 'var(--spacing-xs)', padding: 'var(--spacing-md)', justifyContent: 'center' }}>
            {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
              <button key={number} className={`pagination-btn ${number === current ? 'active' : ''}`} onClick={() => setPage(number)}>
                {number}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
