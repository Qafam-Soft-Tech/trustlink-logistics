import { useMemo, useState } from 'react';
import { useAdminData } from '../data/AdminDataContext';
import type { UserRole } from '../data/types';
import { EmptyRow, Feedback, PageHeader, shortDate } from '../components/ui';

export function UsersPage() {
  const { state, toggleUserActive } = useAdminData();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<UserRole | 'all'>('all');
  const [message, setMessage] = useState<string | null>(null);

  const users = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.users.filter((user) => {
      if (role !== 'all' && user.role !== role) return false;
      if (!q) return true;
      return [user.firstName, user.lastName, user.phone, user.email ?? ''].join(' ').toLowerCase().includes(q);
    });
  }, [state.users, query, role]);

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${users.length} of ${state.users.length} users`}
        actions={
          <>
            <input
              className="form-input"
              placeholder="Search name, phone or email…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={{ minWidth: 240 }}
            />
            <select className="form-select" value={role} onChange={(event) => setRole(event.target.value as UserRole | 'all')}>
              <option value="all">All roles</option>
              <option value="customer">Customers</option>
              <option value="rider">Riders</option>
              <option value="admin">Admins</option>
            </select>
          </>
        }
      />
      <Feedback message={message} />

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Email</th><th>Role</th><th>Created</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <EmptyRow colSpan={7} message="No users match those filters." />
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.phone}</td>
                    <td>{user.email ?? '—'}</td>
                    <td><span className={`badge ${user.role === 'admin' ? 'badge-primary' : user.role === 'rider' ? 'badge-info' : 'badge-gray'}`}>{user.role}</span></td>
                    <td>{shortDate(user.createdAt)}</td>
                    <td><span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>{user.isActive ? 'active' : 'suspended'}</span></td>
                    <td>
                      {user.role === 'admin' ? (
                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>—</span>
                      ) : (
                        <button
                          className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-outline'}`}
                          onClick={() => {
                            toggleUserActive(user.id);
                            setMessage(`${user.firstName} ${user.lastName} ${user.isActive ? 'suspended' : 'reactivated'}.`);
                          }}
                        >
                          {user.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
