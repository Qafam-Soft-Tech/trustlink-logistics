import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminData } from '../data/AdminDataContext';
import type { IssueStatus } from '../data/types';
import { EmptyRow, Feedback, PageHeader, StatusBadge, shortDate } from '../components/ui';

const STATUSES: IssueStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

export function IssuesPage() {
  const { state, assignIssue, updateIssueStatus } = useAdminData();
  const [status, setStatus] = useState<IssueStatus | 'all'>('all');
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const issues = useMemo(
    () => state.issues.filter((issue) => status === 'all' || issue.status === status),
    [state.issues, status],
  );

  const admins = state.users.filter((user) => user.role === 'admin');

  return (
    <div>
      <PageHeader
        title="Issues"
        subtitle={`${issues.length} of ${state.issues.length} reported issues`}
        actions={
          <select className="form-select" value={status} onChange={(event) => setStatus(event.target.value as IssueStatus | 'all')}>
            <option value="all">All statuses</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>{value.replace('_', ' ')}</option>
            ))}
          </select>
        }
      />
      <Feedback message={message} />

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Issue</th><th>Delivery</th><th>Type</th><th>Priority</th><th>Reporter</th><th>Status</th><th>Assign</th><th>Resolution</th></tr>
            </thead>
            <tbody>
              {issues.length === 0 ? (
                <EmptyRow colSpan={8} message="No issues match that filter." />
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{issue.title}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{issue.description}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{shortDate(issue.createdAt)}</div>
                    </td>
                    <td><Link to={`/deliveries/${issue.deliveryId}`}>{issue.deliveryId}</Link></td>
                    <td>{issue.type.replace('_', ' ')}</td>
                    <td><span className={`badge ${issue.priority === 'urgent' || issue.priority === 'high' ? 'badge-error' : issue.priority === 'medium' ? 'badge-warning' : 'badge-gray'}`}>{issue.priority}</span></td>
                    <td>{issue.reporterName}</td>
                    <td>
                      <select
                        className="form-select"
                        value={issue.status}
                        onChange={(event) => {
                          const next = event.target.value as IssueStatus;
                          updateIssueStatus(issue.id, next, resolution[issue.id]);
                          setMessage(`${issue.title} marked ${next.replace('_', ' ')}.`);
                        }}
                      >
                        {STATUSES.map((value) => (
                          <option key={value} value={value}>{value.replace('_', ' ')}</option>
                        ))}
                      </select>
                      <div style={{ marginTop: 4 }}><StatusBadge status={issue.status} /></div>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={issue.assignedToId ?? ''}
                        onChange={(event) => {
                          const adminId = event.target.value;
                          if (!adminId) return;
                          assignIssue(issue.id, adminId);
                          const admin = admins.find((a) => a.id === adminId);
                          setMessage(`${issue.title} assigned to ${admin?.firstName} ${admin?.lastName}.`);
                        }}
                      >
                        <option value="">Unassigned</option>
                        {admins.map((admin) => (
                          <option key={admin.id} value={admin.id}>{admin.firstName} {admin.lastName}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="form-input"
                        placeholder="Resolution notes"
                        value={resolution[issue.id] ?? issue.resolution ?? ''}
                        onChange={(event) => setResolution((prev) => ({ ...prev, [issue.id]: event.target.value }))}
                        onBlur={(event) => {
                          const value = event.target.value.trim();
                          if (!value) return;
                          updateIssueStatus(issue.id, issue.status, value);
                          setMessage(`Resolution saved for ${issue.title}.`);
                        }}
                        style={{ minWidth: 180 }}
                      />
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
