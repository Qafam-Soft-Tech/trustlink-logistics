import { useState } from 'react';

const mockDeliveries = [
  { id: 'TLK-2024-001', customer: 'John Doe', rider: 'Mike Johnson', pickup: 'Wuse 2, Abuja', dropoff: 'Garki, Abuja', status: 'delivered', amount: 2500, createdAt: '2024-01-15 10:00', completedAt: '2024-01-15 10:45' },
  { id: 'TLK-2024-002', customer: 'Jane Smith', rider: 'Sarah Williams', pickup: 'Maitama, Abuja', dropoff: 'Asokoro, Abuja', status: 'in_transit', amount: 3200, createdAt: '2024-01-15 09:30' },
  { id: 'TLK-2024-003', customer: 'Bob Wilson', rider: 'David Brown', pickup: 'Jabi, Abuja', dropoff: 'Utako, Abuja', status: 'assigned', amount: 1800, createdAt: '2024-01-15 09:00' },
  { id: 'TLK-2024-004', customer: 'Alice Brown', rider: 'Mike Johnson', pickup: 'Garki, Abuja', dropoff: 'Wuse 2, Abuja', status: 'searching', amount: 2100, createdAt: '2024-01-15 08:45' },
  { id: 'TLK-2024-005', customer: 'Charlie Davis', rider: null, pickup: 'Utako, Abuja', dropoff: 'Jabi, Abuja', status: 'requested', amount: 1500, createdAt: '2024-01-15 08:30' },
  { id: 'TLK-2024-006', customer: 'Eve Johnson', rider: 'Sarah Williams', pickup: 'Asokoro, Abuja', dropoff: 'Maitama, Abuja', status: 'cancelled', amount: 0, createdAt: '2024-01-14 16:00' },
  { id: 'TLK-2024-007', customer: 'Frank Wilson', rider: 'David Brown', pickup: 'Wuse 2, Abuja', dropoff: 'Maitama, Abuja', status: 'failed', amount: 2800, createdAt: '2024-01-14 14:30' },
  { id: 'TLK-2024-008', customer: 'Grace Lee', rider: 'Mike Johnson', pickup: 'Garki, Abuja', dropoff: 'Asokoro, Abuja', status: 'returned', amount: 3500, createdAt: '2024-01-14 12:00' },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  delivered: { label: 'Delivered', className: 'badge-success' },
  in_transit: { label: 'In Transit', className: 'badge-info' },
  picked_up: { label: 'Picked Up', className: 'badge-info' },
  assigned: { label: 'Assigned', className: 'badge-primary' },
  searching: { label: 'Searching', className: 'badge-warning' },
  requested: { label: 'Requested', className: 'badge-gray' },
  cancelled: { label: 'Cancelled', className: 'badge-error' },
  failed: { label: 'Failed', className: 'badge-error' },
  returned: { label: 'Returned', className: 'badge-warning' },
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'requested', label: 'Requested' },
  { value: 'searching', label: 'Searching' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
  { value: 'returned', label: 'Returned' },
];

export function DeliveriesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredDeliveries = mockDeliveries.filter(delivery => {
    const matchesSearch = delivery.id.toLowerCase().includes(search.toLowerCase()) ||
      delivery.customer.toLowerCase().includes(search.toLowerCase()) ||
      (delivery.rider && delivery.rider.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || delivery.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedDeliveries = filteredDeliveries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Deliveries</h1>
        <p className="page-subtitle">Manage and track all delivery orders</p>
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
                placeholder="Search deliveries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '44px' }}
              />
            </div>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ maxWidth: '200px' }}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {paginatedDeliveries.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--spacing-xxl)' }}>
              <div className="empty-state-icon">📦</div>
              <h3 className="empty-state-title">No deliveries found</h3>
              <p className="empty-state-message">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Delivery ID</th>
                    <th>Customer</th>
                    <th>Rider</th>
                    <th>Pickup → Dropoff</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDeliveries.map((delivery) => {
                    const config = statusConfig[delivery.status];
                    return (
                      <tr key={delivery.id}>
                        <td><span className="delivery-id">{delivery.id}</span></td>
                        <td>{delivery.customer}</td>
                        <td>{delivery.rider || <span className="text-tertiary">Unassigned</span>}</td>
                        <td>
                          <div className="route-info">
                            <span className="route-pickup">{delivery.pickup}</span>
                            <span className="route-arrow">→</span>
                            <span className="route-dropoff">{delivery.dropoff}</span>
                          </div>
                        </td>
                        <td><span className={`badge ${config.className}`}>{config.label}</span></td>
                        <td>₦{delivery.amount.toLocaleString()}</td>
                        <td className="text-secondary">{delivery.createdAt}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn btn-ghost btn-sm" title="View Details">👁</button>
                            <button className="btn btn-ghost btn-sm" title="Assign Rider">👤</button>
                            <button className="btn btn-ghost btn-sm" title="View Timeline">📋</button>
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
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDeliveries.length)} of {filteredDeliveries.length} deliveries
            </span>
          </div>
        )}
      </div>
    </div>
  );
}