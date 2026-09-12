import { useState } from 'react';

const mockRiders = [
  { id: '1', name: 'Mike Johnson', email: 'mike@example.com', phone: '080 1111 2222', vehicleType: 'motorcycle', vehiclePlate: 'ABC 123 XY', kycStatus: 'approved', status: 'online', rating: 4.9, deliveries: 156, earnings: 450000, createdAt: '2023-11-15' },
  { id: '2', name: 'Sarah Williams', email: 'sarah@example.com', phone: '080 2222 3333', vehicleType: 'van', vehiclePlate: 'XYZ 789 AB', kycStatus: 'approved', status: 'offline', rating: 4.8, deliveries: 89, earnings: 280000, createdAt: '2023-12-01' },
  { id: '3', name: 'David Brown', email: 'david@example.com', phone: '080 3333 4444', vehicleType: 'motorcycle', vehiclePlate: 'DEF 456 CD', kycStatus: 'pending', status: 'offline', rating: 0, deliveries: 0, earnings: 0, createdAt: '2024-01-10' },
  { id: '4', name: 'James Wilson', email: 'james@example.com', phone: '080 4444 5555', vehicleType: 'truck', vehiclePlate: 'GHI 789 EF', kycStatus: 'rejected', status: 'offline', rating: 0, deliveries: 0, earnings: 0, createdAt: '2024-01-12' },
  { id: '5', name: 'Lisa Anderson', email: 'lisa@example.com', phone: '080 5555 6666', vehicleType: 'motorcycle', vehiclePlate: 'JKL 012 GH', kycStatus: 'approved', status: 'online', rating: 4.7, deliveries: 203, earnings: 580000, createdAt: '2023-10-20' },
];

const kycStatusOptions = [
  { value: '', label: 'All KYC Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
];

const vehicleOptions = [
  { value: '', label: 'All Vehicles' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
];

const kycConfig: Record<string, { label: string; className: string }> = {
  approved: { label: 'Approved', className: 'badge-success' },
  pending: { label: 'Pending', className: 'badge-warning' },
  rejected: { label: 'Rejected', className: 'badge-error' },
};

export function RidersPage() {
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedRider, setSelectedRider] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const itemsPerPage = 10;

  const filteredRiders = mockRiders.filter(rider => {
    const matchesSearch = rider.name.toLowerCase().includes(search.toLowerCase()) ||
      rider.email.toLowerCase().includes(search.toLowerCase()) ||
      rider.phone.includes(search) ||
      rider.vehiclePlate.includes(search);
    const matchesKyc = !kycFilter || rider.kycStatus === kycFilter;
    const matchesStatus = !statusFilter || rider.status === statusFilter;
    const matchesVehicle = !vehicleFilter || rider.vehicleType === vehicleFilter;
    return matchesSearch && matchesKyc && matchesStatus && matchesVehicle;
  });

  const paginatedRiders = filteredRiders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredRiders.length / itemsPerPage);

  const handleKycAction = (rider: any, _action: 'approve' | 'reject') => {
    setSelectedRider(rider);
    setShowModal(true);
    setRejectionReason('');
  };

  const confirmKycAction = () => {
    if (selectedRider) {
      console.log('KYC action for:', selectedRider.id);
      setShowModal(false);
      setSelectedRider(null);
      setRejectionReason('');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Riders</h1>
        <p className="page-subtitle">Manage rider accounts and KYC verification</p>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="filters">
            <div className="input-group" style={{ maxWidth: '300px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="form-input"
                placeholder="Search riders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '44px' }}
              />
            </div>
            <select
              className="form-select"
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              style={{ maxWidth: '160px' }}
            >
              {kycStatusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ maxWidth: '140px' }}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              className="form-select"
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              style={{ maxWidth: '140px' }}
            >
              {vehicleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {paginatedRiders.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--spacing-xxl)' }}>
              <div className="empty-state-icon">🏍️</div>
              <h3 className="empty-state-title">No riders found</h3>
              <p className="empty-state-message">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Contact</th>
                    <th>Vehicle</th>
                    <th>KYC Status</th>
                    <th>Status</th>
                    <th>Rating</th>
                    <th>Deliveries</th>
                    <th>Earnings</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRiders.map((rider) => {
                    const kyc = kycConfig[rider.kycStatus];
                    return (
                      <tr key={rider.id}>
                        <td>
                          <div className="user-cell">
                            <div className="avatar avatar-sm" style={{ backgroundColor: 'var(--color-navy)' }}>
                              {rider.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="user-name">{rider.name}</span>
                          </div>
                        </td>
                        <td>
                          <div>{rider.email}</div>
                          <div className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>{rider.phone}</div>
                        </td>
                        <td>
                          <div>{rider.vehicleType.charAt(0).toUpperCase() + rider.vehicleType.slice(1)}</div>
                          <div className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>{rider.vehiclePlate}</div>
                        </td>
                        <td><span className={`badge ${kyc.className}`}>{kyc.label}</span></td>
                        <td>
                          <span className={`status-indicator ${rider.status === 'online' ? 'online' : 'offline'}`}>
                            <span className="status-dot"></span>
                            {rider.status.charAt(0).toUpperCase() + rider.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          {rider.rating > 0 ? (
                            <span className="rating">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-gold)" stroke="var(--color-gold)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                              {rider.rating}
                            </span>
                          ) : (
                            <span className="text-tertiary">—</span>
                          )}
                        </td>
                        <td>{rider.deliveries}</td>
                        <td>₦{rider.earnings.toLocaleString()}</td>
                        <td>
                          <div className="action-buttons">
                            {rider.kycStatus === 'pending' && (
                              <>
                                <button className="btn btn-success btn-sm" onClick={() => handleKycAction(rider, 'approve')} title="Approve KYC">✅</button>
                                <button className="btn btn-error btn-sm" onClick={() => handleKycAction(rider, 'reject')} title="Reject KYC">❌</button>
                              </>
                            )}
                            {rider.kycStatus === 'rejected' && (
                              <button className="btn btn-primary btn-sm" onClick={() => handleKycAction(rider, 'approve')} title="Re-review KYC">🔄</button>
                            )}
                            <button className="btn btn-ghost btn-sm" title="View Profile">👁</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="card-footer">
            <div className="pagination">
              <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
            <span className="pagination-info">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRiders.length)} of {filteredRiders.length} riders
            </span>
          </div>
        )}
      </div>

      {showModal && selectedRider && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setSelectedRider(null); setRejectionReason(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedRider.kycStatus === 'rejected' ? 'Re-review KYC' : 'KYC Verification'}</h3>
              <button className="modal-close" onClick={() => { setShowModal(false); setSelectedRider(null); setRejectionReason(''); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>Rider: <strong>{selectedRider.name}</strong></p>
              <p className="text-secondary" style={{ marginTop: 'var(--spacing-sm)' }}>
                Vehicle: {selectedRider.vehicleType} ({selectedRider.vehiclePlate})
              </p>
              
              {selectedRider.kycStatus === 'pending' && (
                <>
                  <p style={{ marginTop: 'var(--spacing-md)' }}>Choose action:</p>
                  <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                    <button className="btn btn-success" onClick={() => { handleKycAction(selectedRider, 'approve'); confirmKycAction(); }} style={{ flex: 1 }}>Approve</button>
                    <button className="btn btn-error" onClick={() => {}} style={{ flex: 1 }}>Reject</button>
                  </div>
                </>
              )}
              
              {selectedRider.kycStatus === 'rejected' && (
                <>
                  <p style={{ marginTop: 'var(--spacing-md)' }}>Previous rejection reason: {selectedRider.rejectionReason || 'Not specified'}</p>
                  <div className="form-group" style={{ marginTop: 'var(--spacing-md)' }}>
                    <label className="form-label">Rejection Reason (required for rejection)</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Enter rejection reason..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                    <button className="btn btn-success" onClick={() => { handleKycAction(selectedRider, 'approve'); confirmKycAction(); }} style={{ flex: 1 }}>Approve</button>
                    <button className="btn btn-error" onClick={() => { if (rejectionReason) confirmKycAction(); }} style={{ flex: 1 }} disabled={!rejectionReason}>Reject</button>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setShowModal(false); setSelectedRider(null); setRejectionReason(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}