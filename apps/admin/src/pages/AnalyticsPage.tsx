import { useState } from 'react';

const overviewStats = [
  { label: 'Total Deliveries', value: '12,450', change: '+18.2%', trend: 'up' },
  { label: 'Completed', value: '11,230', change: '+15.7%', trend: 'up' },
  { label: 'Cancelled', value: '620', change: '-2.1%', trend: 'down' },
  { label: 'Success Rate', value: '90.2%', change: '+1.3%', trend: 'up' },
  { label: 'Avg Delivery Time', value: '32 min', change: '-4 min', trend: 'down' },
  { label: 'Avg Rating', value: '4.7', change: '+0.1', trend: 'up' },
];

const revenueData = [
  { month: 'Aug', revenue: 1850000, deliveries: 1240 },
  { month: 'Sep', revenue: 2100000, deliveries: 1420 },
  { month: 'Oct', revenue: 2350000, deliveries: 1580 },
  { month: 'Nov', revenue: 2680000, deliveries: 1790 },
  { month: 'Dec', revenue: 2950000, deliveries: 1950 },
  { month: 'Jan', revenue: 2400000, deliveries: 1650 },
];

const topAreas = [
  { area: 'Wuse 2', deliveries: 2340, revenue: 5200000 },
  { area: 'Maitama', deliveries: 1890, revenue: 4800000 },
  { area: 'Garki', deliveries: 1670, revenue: 3900000 },
  { area: 'Asokoro', deliveries: 1450, revenue: 3500000 },
  { area: 'Jabi', deliveries: 1230, revenue: 2800000 },
];

const riderPerformance = [
  { name: 'Mike Johnson', deliveries: 156, rating: 4.9, earnings: 450000, onTime: 98 },
  { name: 'Lisa Anderson', deliveries: 203, rating: 4.7, earnings: 580000, onTime: 95 },
  { name: 'Sarah Williams', deliveries: 89, rating: 4.8, earnings: 280000, onTime: 97 },
  { name: 'James Wilson', deliveries: 67, rating: 4.6, earnings: 210000, onTime: 92 },
  { name: 'David Brown', deliveries: 45, rating: 4.5, earnings: 150000, onTime: 90 },
];

const statusDistribution = [
  { status: 'Delivered', count: 11230, color: '#10b981' },
  { status: 'In Transit', count: 340, color: '#3b82f6' },
  { status: 'Assigned', count: 280, color: '#8b5cf6' },
  { status: 'Searching', count: 150, color: '#f59e0b' },
  { status: 'Cancelled', count: 320, color: '#ef4444' },
  { status: 'Failed', count: 180, color: '#dc2626' },
  { status: 'Returned', count: 120, color: '#6b7280' },
];

export function AnalyticsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
  const maxDeliveries = Math.max(...topAreas.map(d => d.deliveries));

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Insights into your delivery operations</p>
        </div>
        <div className="page-header-right">
          <select
            className="form-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            style={{ maxWidth: '180px' }}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="stats-grid">
        {overviewStats.map((stat) => (
          <div key={stat.label} className="stat-card card">
            <div className="stat-icon" style={{ 
              backgroundColor: stat.trend === 'up' ? 'var(--color-success)20' : 'var(--color-error)20',
              color: stat.trend === 'up' ? 'var(--color-success)' : 'var(--color-error)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {stat.trend === 'up' ? (
                  <polyline points="23 6 13.5 15.5 8.5 10.5"></polyline>
                ) : (
                  <polyline points="17 18 10.5 10.5 15.5 15.5"></polyline>
                )}
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className={`stat-change ${stat.trend === 'up' ? 'positive' : 'negative'}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {stat.trend === 'up' ? (
                    <polyline points="23 6 13.5 15.5 8.5 10.5"></polyline>
                  ) : (
                    <polyline points="17 18 10.5 10.5 15.5 15.5"></polyline>
                  )}
                </svg>
                <span>{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Revenue & Deliveries Trend</h2>
          </div>
          <div className="card-body" style={{ height: '350px' }}>
            <div className="chart-container" style={{ height: '100%', display: 'flex', alignItems: 'flex-end', gap: 'var(--spacing-md)', padding: 'var(--spacing-md) 0' }}>
              {revenueData.map((data, _index) => (
                <div key={data.month} className="chart-bar-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-xs)', height: '100%' }}>
                  <div className="chart-bar-tooltip" style={{ position: 'absolute', bottom: 'calc(100% + 8px)', background: 'var(--color-gray-800)', color: 'white', padding: '4px 8px', borderRadius: 'var(--border-radius-sm)', fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap', opacity: 0, transition: 'opacity var(--transition-fast)', pointerEvents: 'none' }}>
                    ₦{data.revenue.toLocaleString()}
                  </div>
                  <div 
                    className="chart-bar" 
                    style={{ 
                      width: '100%', 
                      maxWidth: '40px', 
                      height: `${(data.revenue / maxRevenue) * 280}px`, 
                      background: 'linear-gradient(to top, var(--color-navy), var(--color-gold))',
                      borderRadius: 'var(--border-radius-sm) var(--border-radius-sm) 0 0',
                      transition: 'height var(--transition-normal)',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { const tooltip = e.currentTarget.querySelector('.chart-bar-tooltip'); if (tooltip) (tooltip as HTMLElement).style.opacity = '1'; }}
                    onMouseLeave={e => { const tooltip = e.currentTarget.querySelector('.chart-bar-tooltip'); if (tooltip) (tooltip as HTMLElement).style.opacity = '0'; }}
                  >
                    <div className="chart-bar-tooltip" style={{ position: 'absolute', bottom: 'calc(100% + 8px)', background: 'var(--color-gray-800)', color: 'white', padding: '4px 8px', borderRadius: 'var(--border-radius-sm)', fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap', opacity: 0, transition: 'opacity var(--transition-fast)', pointerEvents: 'none' }}>
                      ₦{data.revenue.toLocaleString()}
                    </div>
                  </div>
                  <span className="chart-label" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{data.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Status Distribution</h2>
          </div>
          <div className="card-body">
            <div className="status-distribution">
              {statusDistribution.map((item) => (
                <div key={item.status} className="status-dist-item">
                  <div className="status-dist-color" style={{ backgroundColor: item.color }} />
                  <div className="status-dist-info">
                    <span className="status-dist-label">{item.status}</span>
                    <span className="status-dist-count">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="status-dist-bar" style={{ flex: 1, height: '8px', background: 'var(--color-gray-200)', borderRadius: 'var(--border-radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${(item.count / 11230) * 100}%`, height: '100%', backgroundColor: item.color, borderRadius: 'var(--border-radius-full)' }} />
                  </div>
                  <span className="status-dist-percent">{((item.count / 11230) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Top Delivery Areas</h2>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Area</th>
                    <th>Deliveries</th>
                    <th>Revenue</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {topAreas.map((area, index) => (
                    <tr key={area.area}>
                      <td>
                        <div className="rank-cell">
                          <span className={`rank-badge ${index < 3 ? 'top-3' : ''}`}>#{index + 1}</span>
                          <span>{area.area}</span>
                        </div>
                      </td>
                      <td>{area.deliveries.toLocaleString()}</td>
                      <td>₦{area.revenue.toLocaleString()}</td>
                      <td>
                        <div className="progress-bar" style={{ width: '100px' }}>
                          <div style={{ width: `${(area.deliveries / maxDeliveries) * 100}%`, height: '100%', background: 'linear-gradient(to right, var(--color-navy), var(--color-gold))', borderRadius: 'var(--border-radius-full)' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Top Riders</h2>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Deliveries</th>
                    <th>Rating</th>
                    <th>On-Time %</th>
                    <th>Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {riderPerformance.map((rider, index) => (
                    <tr key={rider.name}>
                      <td>
                        <div className="rank-cell">
                          <span className={`rank-badge ${index < 3 ? 'top-3' : ''}`}>#{index + 1}</span>
                          <span>{rider.name}</span>
                        </div>
                      </td>
                      <td>{rider.deliveries}</td>
                      <td>
                        <span className="rating">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-gold)" stroke="var(--color-gold)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                          {rider.rating}
                        </span>
                      </td>
                      <td><span className="badge badge-success">{rider.onTime}%</span></td>
                      <td>₦{rider.earnings.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}