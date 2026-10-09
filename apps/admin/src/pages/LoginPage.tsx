import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ADMIN_DEMO_EMAIL, ADMIN_DEMO_PASSWORD } from '../data/adminCredentials';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(ADMIN_DEMO_EMAIL);
  const [password, setPassword] = useState(ADMIN_DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl)', background: 'var(--color-background-secondary, #f6f7f9)' }}>
      <form className="card" onSubmit={submit} style={{ width: '100%', maxWidth: 420, padding: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
          <div className="logo-icon">TL</div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>TrustLink Logistics</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Secure. Swift. Strategic.</div>
          </div>
        </div>

        <h1 style={{ margin: '0 0 var(--spacing-lg)', fontSize: 'var(--font-size-xl)' }}>Admin sign in</h1>

        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input id="password" className="form-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        </div>

        {error ? (
          <div className="card" style={{ padding: 'var(--spacing-sm) var(--spacing-md)', borderLeft: '4px solid var(--color-error)', marginBottom: 'var(--spacing-md)' }}>
            {error}
          </div>
        ) : null}

        <button className="btn btn-primary btn-lg" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p style={{ marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          Demo console (mock data): <strong>{ADMIN_DEMO_EMAIL}</strong> / <strong>{ADMIN_DEMO_PASSWORD}</strong>.
          The backend has no <code>/auth/admin/login</code> route, so the console signs in locally — see <code>docs/frontend/DEMO.md</code>.
        </p>
      </form>
    </div>
  );
}
