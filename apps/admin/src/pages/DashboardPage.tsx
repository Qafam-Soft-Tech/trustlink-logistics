import React from 'react';
import { Link } from 'react-router-dom';

const stats = [
  { label: 'Total Deliveries', value: '1,234', change: '+12%', changeType: 'positive', icon: 'package' },
  { label: 'Active Riders', value: '56', change: '+3', changeType: 'positive', icon: 'truck' },
  { label: 'Total Customers', value: '2,890', change: '+8%', changeType: 'positive', icon: 'users' },
  { label: 'Revenue (Month)', value: '₦2.4M', change: '+15%', changeType: 'positive', icon: 'dollar' },
];

const recentDeliveries = [
  { id: 'TLK-2024-001', customer: 'John Doe', rider: 'Mike Johnson', status: 'delivered', amount: '₦2,500', time: '2 hours ago' },
  { id: 'TLK-2024-002', customer: 'Jane Smith', rider: 'Sarah Williams', status: 'in_transit', amount: '₦3,200', time: '3 hours ago' },
  { id: 'TLK-2024-003', customer: 'Bob Wilson', rider: 'David Brown', status: 'assigned', amount: '₦1,800', time: '4 hours ago' },
  { id: 'TLK-2024-004', customer: 'Alice Brown', rider: 'Mike Johnson', status: 'searching', amount: '₦2,100', time: '5 hours ago' },
  { id: 'TLK-2024-005', customer: 'Charlie Davis', rider: '', status: 'requested', amount: '₦1,500', time: '6 hours ago' },
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

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    package: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
    ),
    truck: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C22.7 10.6 20.6 9 18 9h-1.5V4c0-1-.7-1.7-1.5-1.9C14.7 1.6 12.6 0 10 0H9c-2.6 0-4.7 1.6-5.5 4.1C2.7 5.3 2 6 2 7v11c0 .6.4 1 1 1h2"></path>
        <circle cx="7" cy="17" r="2"></circle>
        <circle cx="17" cy="17" r="2"></circle>
      </svg>
    ),
    users: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    dollar: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
  };
  return icons[name] || icons.package;
}

export function DashboardPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your delivery operations</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card card">
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-navy)20', color: 'var(--color-navy)' }}>
              <Icon name={stat.icon} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className={`stat-change ${stat.changeType === 'positive' ? 'positive' : 'negative'}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {stat.changeType === 'positive' ? (
                    <polyline points="23 6 13.5 15.5 8.5 10.5"></polyline>
                  ) : (
                    <polyline points="17 18 10.5 10.5 15.5 15.5"></polyline>
                  )}
                </svg>
                <span>{stat.change} vs last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Deliveries</h2>
            <Link to="/deliveries" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Delivery ID</th>
                    <th>Customer</th>
                    <th>Rider</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeliveries.map((delivery) => {
                    const config = statusConfig[delivery.status];
                    return (
                      <tr key={delivery.id}>
                        <td><Link to={`/deliveries/${delivery.id}`} className="delivery-id">{delivery.id}</Link></td>
                        <td>{delivery.customer}</td>
                        <td>{delivery.rider || '—'}</td>
                        <td><span className={`badge ${config.className}`}>{config.label}</span></td>
                        <td>{delivery.amount}</td>
                        <td className="text-secondary">{delivery.time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="quick-actions">
              <Link to="/deliveries" className="quick-action-btn">
                <div className="quick-action-icon" style={{ backgroundColor: 'var(--color-navy)20', color: 'var(--color-navy)' }}>
                  <Icon name="package" />
                </div>
                <span>Manage Deliveries</span>
              </Link>
              <Link to="/users" className="quick-action-btn">
                <div className="quick-action-icon" style={{ backgroundColor: 'var(--color-success)20', color: 'var(--color-success)' }}>
                  <Icon name="users" />
                </div>
                <span>Manage Customers</span>
              </Link>
              <Link to="/riders" className="quick-action-btn">
                <div className="quick-action-icon" style={{ backgroundColor: 'var(--color-gold)20', color: 'var(--color-gold)' }}>
                  <Icon name="truck" />
                </div>
                <span>Manage Riders</span>
              </Link>
              <Link to="/analytics" className="quick-action-btn">
                <div className="quick-action-icon" style={{ backgroundColor: 'var(--color-info)20', color: 'var(--color-info)' }}>
                  <Icon name="bar-chart" />
                </div>
                <span>View Analytics</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}