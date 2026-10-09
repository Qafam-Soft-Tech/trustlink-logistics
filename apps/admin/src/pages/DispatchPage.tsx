import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminData } from '../data/AdminDataContext';
import { eligibleRiders, needsRedelivery, reassignable, unassigned } from '../data/mock';
import { NGN } from '../data/types';
import { Feedback, PageHeader, Panel, StatusBadge, shortDate } from '../components/ui';

export function DispatchPage() {
  const { state, assignRider, reassignRider, scheduleRedelivery } = useAdminData();
  const [message, setMessage] = useState<string | null>(null);

  const queue = unassigned(state);
  const assigned = reassignable(state);
  const failed = needsRedelivery(state);

  return (
    <div>
      <PageHeader title="Dispatch board" subtitle="Manual dispatch — assign a rider, reassign an active job, or schedule a redelivery." />
      <Feedback message={message} />

      <Panel title={`Unassigned (${queue.length})`}>
        {queue.length === 0 ? (
          <p style={{ color: 'var(--color-text-tertiary)' }}>No deliveries waiting for a rider.</p>
        ) : (
          queue.map((delivery) => {
            const candidates = eligibleRiders(state, delivery);
            return (
              <div key={delivery.id} className="card" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      <Link to={`/deliveries/${delivery.id}`}>{delivery.trackingNumber}</Link> · {delivery.pickupArea} → {delivery.dropoffArea}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      {delivery.packageType} · {delivery.packageWeight} kg · {NGN(delivery.fare)} · requested {shortDate(delivery.createdAt)}
                    </div>
                  </div>
                  <StatusBadge status={delivery.status} />
                </div>

                <div className="table-container" style={{ marginTop: 'var(--spacing-md)' }}>
                  <table className="table">
                    <thead>
                      <tr><th>Eligible rider</th><th>Vehicle</th><th>Zone</th><th>Distance</th><th>ETA</th><th></th></tr>
                    </thead>
                    <tbody>
                      {candidates.length === 0 ? (
                        <tr><td colSpan={6} style={{ color: 'var(--color-text-tertiary)' }}>No approved riders are online right now.</td></tr>
                      ) : (
                        candidates.slice(0, 4).map(({ rider, distanceKm, etaMinutes }) => (
                          <tr key={rider.id}>
                            <td>{rider.firstName} {rider.lastName} · ★ {rider.rating.toFixed(1)}</td>
                            <td>{rider.vehicleType} · {rider.vehiclePlate}</td>
                            <td>{rider.zone}</td>
                            <td>{distanceKm} km</td>
                            <td>~{etaMinutes} min</td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  assignRider(delivery.id, rider.id);
                                  setMessage(`${delivery.trackingNumber} assigned to ${rider.firstName} ${rider.lastName}.`);
                                }}
                              >
                                Assign
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </Panel>

      <Panel title={`Active jobs (${assigned.length})`}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Tracking</th><th>Route</th><th>Current rider</th><th>Status</th><th>Reassign</th></tr>
            </thead>
            <tbody>
              {assigned.length === 0 ? (
                <tr><td colSpan={5} style={{ color: 'var(--color-text-tertiary)' }}>Nothing assigned right now.</td></tr>
              ) : (
                assigned.map((delivery) => {
                  const current = state.riders.find((r) => r.id === delivery.riderId);
                  const candidates = eligibleRiders(state, delivery).filter((c) => c.rider.id !== delivery.riderId);
                  return (
                    <tr key={delivery.id}>
                      <td><Link to={`/deliveries/${delivery.id}`}>{delivery.trackingNumber}</Link></td>
                      <td>{delivery.pickupArea} → {delivery.dropoffArea}</td>
                      <td>{current ? `${current.firstName} ${current.lastName}` : '—'}</td>
                      <td><StatusBadge status={delivery.status} /></td>
                      <td>
                        <select
                          className="form-select"
                          defaultValue=""
                          onChange={(event) => {
                            const riderId = event.target.value;
                            if (!riderId) return;
                            reassignRider(delivery.id, riderId, 'dispatcher reassignment');
                            const rider = state.riders.find((r) => r.id === riderId);
                            setMessage(`${delivery.trackingNumber} reassigned to ${rider?.firstName} ${rider?.lastName}.`);
                            event.target.value = '';
                          }}
                        >
                          <option value="">Choose a rider…</option>
                          {candidates.map(({ rider, distanceKm }) => (
                            <option key={rider.id} value={rider.id}>
                              {rider.firstName} {rider.lastName} · {distanceKm} km
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title={`Failed — awaiting redelivery (${failed.length})`}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Tracking</th><th>Route</th><th>Attempts</th><th>Last rider</th><th></th></tr>
            </thead>
            <tbody>
              {failed.length === 0 ? (
                <tr><td colSpan={5} style={{ color: 'var(--color-text-tertiary)' }}>No failed deliveries.</td></tr>
              ) : (
                failed.map((delivery) => {
                  const last = state.riders.find((r) => r.id === delivery.riderId);
                  return (
                    <tr key={delivery.id}>
                      <td><Link to={`/deliveries/${delivery.id}`}>{delivery.trackingNumber}</Link></td>
                      <td>{delivery.pickupArea} → {delivery.dropoffArea}</td>
                      <td>{delivery.redeliveryAttempts} of 2</td>
                      <td>{last ? `${last.firstName} ${last.lastName}` : '—'}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          disabled={delivery.redeliveryAttempts >= 2}
                          onClick={() => {
                            scheduleRedelivery(delivery.id);
                            setMessage(`${delivery.trackingNumber} returned to the dispatch queue for redelivery.`);
                          }}
                        >
                          {delivery.redeliveryAttempts >= 2 ? 'Max attempts reached' : 'Schedule redelivery'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
