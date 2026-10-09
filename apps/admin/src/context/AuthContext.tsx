import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ADMIN_DEMO_EMAIL, ADMIN_DEMO_PASSWORD } from '../data/adminCredentials';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin';
}

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NAME = 'Ilyas Adamu';

/**
 * Mock-backed admin auth.
 * `POST /auth/admin/login` does not exist in the backend (SC-14) and the admin app runs on
 * mock data, so the console signs in against a documented demo credential (docs/frontend/DEMO.md).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('trustlink.admin.session');
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch {
        localStorage.removeItem('trustlink.admin.session');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    if (email.trim().toLowerCase() !== ADMIN_DEMO_EMAIL.toLowerCase() || password !== ADMIN_DEMO_PASSWORD) {
      throw new Error('Incorrect email or password. Use the demo credentials shown below.');
    }
    const [firstName, lastName] = NAME.split(' ');
    const next: AdminUser = { id: 'admin-1', email: ADMIN_DEMO_EMAIL, firstName, lastName, role: 'admin' };
    setUser(next);
    localStorage.setItem('trustlink.admin.session', JSON.stringify(next));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('trustlink.admin.session');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
