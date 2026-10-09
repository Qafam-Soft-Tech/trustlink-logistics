import { useState } from 'react';
import { useAdminData } from '../data/AdminDataContext';
import type { RiderProfile } from '../data/types';
import { Feedback, PageHeader, Panel } from '../components/ui';

const DOC_LABELS: Array<[keyof RiderProfile['documents'], string]> = [
  ['nin', 'NIN'],
  ['idFront', 'ID front'],
  ['idBack', 'ID back'],
  ['selfie', 'Selfie'],
  ['vehicleRegistration', 'Vehicle registration'],
];

function DocumentViewer({ rider }: { rider: RiderProfile }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
      {DOC_LABELS.map(([key, label]) => (
        <div key={key}>
          <div className="card" style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'var(--color-background-secondary, #f6f7f9)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-sm)' }}>
            <strong style={{ color: 'var(--color-text-secondary)' }}>{label}</strong>
            <span>{rider.documents[key]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RidersPage() {
  const { state, approveKyc, rejectKyc } = useAdminData();
  const [reviewing, setReviewing] = useState<RiderProfile | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = state.riders.filter((r) => r.kycStatus === 'pending');

  return (
    <div>
      <PageHeader title="Riders & KYC" subtitle={`${state.riders.length} riders · ${pending.length} waiting for review`} />
      <Feedback message={message} />

      <Panel title={`KYC review queue (${pending.length})`}>
        {pending.length === 0 ? (
          <p style={{ color: 'var(--color-text-tertiary)' }}>No riders waiting for review.</p>
        ) : (
          pending.map((rider) => (
            <div key={rider.id} className="card" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{rider.firstName} {rider.lastName}</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {rider.phone} · {rider.vehicleType} · {rider.vehiclePlate} · zone {rider.zone}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <button className="btn btn-sm btn-outline" onClick={() => { setReviewing(rider); setReason(''); setError(null); }}>Review documents</button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      approveKyc(rider.id);
                      setReviewing(null);
                      setMessage(`${rider.firstName} ${rider.lastName} approved — they can now go online.`);
                    }}
                  >
                    Approve
                  </button>
                </div>
              </div>

              {reviewing?.id === rider.id ? (
                <div style={{ marginTop: 'var(--spacing-md)', display: 'grid', gap: 'var(--spacing-md)' }}>
                  <DocumentViewer rider={rider} />
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" htmlFor={`reason-${rider.id}`}>Rejection reason (required to reject)</label>
                    <input
                      id={`reason-${rider.id}`}
                      className="form-input"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="e.g. The vehicle registration photo was unreadable"
                    />
                  </div>
                  {error ? <div className="badge badge-error">{error}</div> : null}
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        if (reason.trim().length < 5) {
                          setError('Add a short reason so the rider knows what to fix.');
                          return;
                        }
                        rejectKyc(rider.id, reason.trim());
                        setReviewing(null);
                        setMessage(`${rider.firstName} ${rider.lastName} rejected — the reason was recorded.`);
                      }}
                    >
                      Reject KYC
                    </button>
                    <button className="btn btn-ghost" onClick={() => setReviewing(null)}>Close</button>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </Panel>

      <Panel title="All riders">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Rider</th><th>Contact</th><th>Vehicle</th><th>Zone</th><th>Status</th><th>KYC</th><th>Rating</th><th>Deliveries</th><th></th></tr>
            </thead>
            <tbody>
              {state.riders.map((rider) => (
                <tr key={rider.id}>
                  <td>{rider.firstName} {rider.lastName}</td>
                  <td>{rider.phone}</td>
                  <td>{rider.vehicleType} · {rider.vehiclePlate}</td>
                  <td>{rider.zone}</td>
                  <td><span className={`badge ${rider.status === 'online' ? 'badge-success' : rider.status === 'on_trip' ? 'badge-primary' : 'badge-gray'}`}>{rider.status}</span></td>
                  <td>
                    <span className={`badge ${rider.kycStatus === 'approved' ? 'badge-success' : rider.kycStatus === 'rejected' ? 'badge-error' : 'badge-warning'}`}>{rider.kycStatus}</span>
                    {rider.kycStatus === 'rejected' && rider.kycRejectionReason ? (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{rider.kycRejectionReason}</div>
                    ) : null}
                  </td>
                  <td>{rider.rating ? `★ ${rider.rating.toFixed(1)}` : '—'}</td>
                  <td>{rider.totalDeliveries}</td>
                  <td>
                    {rider.kycStatus === 'pending' ? (
                      <button className="btn btn-sm btn-outline" onClick={() => { setReviewing(rider); setReason(''); setError(null); }}>Review</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
