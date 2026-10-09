import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAdminData } from '../data/AdminDataContext';
import { eligibleRiders } from '../data/mock';
import { NGN } from '../data/types';
import { Feedback, PageHeader, Panel, StatusBadge, shortDate } from '../components/ui';

export function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, reassignRider, scheduleRedelivery } = useAdminData();
  const [message, setMessage] = useState<string | null>(null);

  const delivery = state.deliveries.find((d) => d.id === id);

  if (!delivery) {
    return (
      <div>
        <PageHeader title="Delivery not found" subtitle={`No delivery matches ${id}.`} actions={<Link className="btn btn-outline" to="/deliveries">Back to deliveries</Link>} />
      </div>
    );
  }

  const rider = state.riders.find((r) => r.id === delivery.riderId);
  const candidates = eligibleRiders(state, delivery).filter((c) => c.rider.id !== delivery.riderId);
  const canReassign = delivery.status === 'assigned' || delivery.status === 'picked_up';
  const canRedeliver = delivery.status === 'failed' && delivery.redeliveryAttempts < 2;

  return (
    <div>
      <PageHeader
        title={delivery.trackingNumber}
        subtitle={`${delivery.pickupArea} → ${delivery.dropoffArea} · created ${shortDate(delivery.createdAt)}`}
        actions={
          <>
            <StatusBadge status={delivery.status} />
            <Link className="btn btn-outline" to="/deliveries">All deliveries</Link>
          </>
        }
      />
      <Feedback message={message} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
        <Panel title="Route & package">
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--spacing-sm) var(--spacing-md)', margin: 0 }}>
            <dt>Pickup</dt><dd style={{ margin: 0 }}>{delivery.pickupStreet}, {delivery.pickupArea}</dd>
            <dt>Drop-off</dt><dd style={{ margin: 0 }}>{delivery.dropoffStreet}, {delivery.dropoffArea}</dd>
            <dt>Package</dt><dd style={{ margin: 0 }}>{delivery.packageType} · {delivery.packageWeight} kg{delivery.packageDescription ? ` · ${delivery.packageDescription}` : ''}</dd>
            <dt>Recipient</dt><dd style={{ margin: 0 }}>{delivery.recipientName} · {delivery.recipientPhone}</dd>
            <dt>Sender</dt><dd style={{ margin: 0 }}>{delivery.senderName} · {delivery.senderPhone}</dd>
            <dt>Customer</dt><dd style={{ margin: 0 }}>{delivery.customerName} · {delivery.customerPhone}</dd>
          </dl>
        </Panel>

        <Panel title="Payment">
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--spacing-sm) var(--spacing-md)', margin: 0 }}>
            <dt>Fare</dt><dd style={{ margin: 0 }}>{NGN(delivery.fare)}</dd>
            <dt>Status</dt><dd style={{ margin: 0 }}><span className={`badge ${delivery.paymentStatus === 'success' ? 'badge-success' : 'badge-warning'}`}>{delivery.paymentStatus}</span></dd>
            <dt>Reference</dt><dd style={{ margin: 0 }}>{delivery.paymentReference ?? '—'}</dd>
            <dt>Attempts</dt><dd style={{ margin: 0 }}>{delivery.redeliveryAttempts} of 2</dd>
          </dl>
        </Panel>
      </div>

      <Panel title="Rider">
        {rider ? (
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--spacing-sm) var(--spacing-md)', margin: 0 }}>
            <dt>Name</dt><dd style={{ margin: 0 }}>{rider.firstName} {rider.lastName} · ★ {rider.rating.toFixed(1)}</dd>
            <dt>Contact</dt><dd style={{ margin: 0 }}>{rider.phone}</dd>
            <dt>Vehicle</dt><dd style={{ margin: 0 }}>{rider.vehicleType} · {rider.vehiclePlate}</dd>
            <dt>Zone</dt><dd style={{ margin: 0 }}>{rider.zone}</dd>
          </dl>
        ) : (
          <p style={{ color: 'var(--color-text-tertiary)' }}>No rider assigned yet.</p>
        )}

        {canReassign ? (
          <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              defaultValue=""
              onChange={(event) => {
                const riderId = event.target.value;
                if (!riderId) return;
                reassignRider(delivery.id, riderId, 'dispatcher reassignment');
                const next = state.riders.find((r) => r.id === riderId);
                setMessage(`Reassigned to ${next?.firstName} ${next?.lastName}.`);
                event.target.value = '';
              }}
            >
              <option value="">Reassign to…</option>
              {candidates.map(({ rider: candidate, distanceKm }) => (
                <option key={candidate.id} value={candidate.id}>{candidate.firstName} {candidate.lastName} · {distanceKm} km</option>
              ))}
            </select>
          </div>
        ) : null}

        {canRedeliver ? (
          <button
            className="btn btn-outline"
            style={{ marginTop: 'var(--spacing-md)' }}
            onClick={() => {
              scheduleRedelivery(delivery.id);
              setMessage(`${delivery.trackingNumber} returned to the dispatch queue for redelivery.`);
            }}
          >
            Schedule redelivery
          </button>
        ) : null}
      </Panel>

      <Panel title="Timeline">
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--spacing-sm)' }}>
          {delivery.events.map((event) => (
            <li key={event.id} style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
              <span className="badge badge-gray" style={{ minWidth: 96, textAlign: 'center' }}>{event.status}</span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {new Date(event.at).toLocaleString('en-NG')}
                {event.note ? ` — ${event.note}` : ''}
              </span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title="Proof of delivery">
        {delivery.pod ? (
          <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
            <div className="card" style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background-secondary, #f6f7f9)', color: 'var(--color-text-tertiary)' }}>
              {delivery.pod.photoUrl}
            </div>
            <div>Received by {delivery.pod.recipientName} · {delivery.pod.recipientPhone}</div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {new Date(delivery.pod.deliveredAt).toLocaleString('en-NG')}{delivery.pod.notes ? ` — ${delivery.pod.notes}` : ''}
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-tertiary)' }}>No proof of delivery recorded for this delivery.</p>
        )}
      </Panel>
    </div>
  );
}
