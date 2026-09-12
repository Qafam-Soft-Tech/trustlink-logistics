import { useState } from 'react';

const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phone: '080 1234 5678', role: 'customer', status: 'active', createdAt: '2024-01-10', deliveries: 12 },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '080 2345 6789', role: 'customer', status: 'active', createdAt: '2024-01-12', deliveries: 8 },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', phone: '080 3456 7890', role: 'customer', status: 'suspended', createdAt: '2024-01-08', deliveries: 3 },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', phone: '080 4567 8901', role: 'customer', status: 'active', createdAt: '2024-01-15', deliveries: 15 },
  { id: '5', name: 'Charlie Davis', email: 'charlie@example.com', phone: '080 5678 9012', role: 'customer', status: 'active', createdAt: '2024-01-05', deliveries: 0 },
  { id: '6', name: 'Eve Johnson', email: 'eve@example.com', phone: '080 6789 0123', role: 'customer', status: 'active', createdAt: '2024-01-14', deliveries: 6 },
];

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'customer', label: 'Customer' },
  { value: 'rider', label: 'Rider' },
  { value: 'admin', label: 'Admin' },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const itemsPerPage = 10;

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.phone.includes(search);
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleToggleStatus = (user: any) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const confirmToggle = () => {
    if (selectedUser) {
      console.log('Toggle status for:', selectedUser.id);
      setShowModal(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">Manage customer accounts</p>
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
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '44px' }}
              />
            </div>
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ maxWidth: '150px' }}
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ maxWidth: '150px' }}
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
          {paginatedUsers.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--spacing-xxl)' }}>
              <div className="empty-state-icon">👥</div>
              <h3 className="empty-state-title">No users found</h3>
              <p className="empty-state-message">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Deliveries</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => {
                    return (
                      <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar avatar-sm" style={{ backgroundColor: 'var(--color-navy)' }}>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="user-name">{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td><span className="badge badge-primary">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></td>
                      <td>
                        <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td>{user.deliveries}</td>
                      <td className="text-secondary">{user.createdAt}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn btn-ghost btn-sm" onClick={() => handleToggleStatus(user)} title={user.status === 'active' ? 'Suspend' : 'Activate'}>
                            {user.status === 'active' ? '🔒' : '✅'}
                          </button>
                          <button className="btn btn-ghost btn-sm" title="View Details">👁</button>
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
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </span>
          </div>
        )}
      </div>

      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setSelectedUser(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedUser.status === 'active' ? 'Suspend User' : 'Activate User'}</h3>
              <button className="modal-close" onClick={() => { setShowModal(false); setSelectedUser(null); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to <strong>{selectedUser.status === 'active' ? 'suspend' : 'activate'}</strong> <strong>{selectedUser.name}</strong>?</p>
              <p className="text-secondary" style={{ marginTop: 'var(--spacing-sm)' }}>
                {selectedUser.status === 'active' 
                  ? 'The user will not be able to create new deliveries but their history will remain intact.'
                  : 'The user will regain full access to their account.'}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setShowModal(false); setSelectedUser(null); }}>Cancel</button>
              <button className={`btn ${selectedUser.status === 'active' ? 'btn-danger' : 'btn-primary'}`} onClick={confirmToggle}>
                {selectedUser.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}