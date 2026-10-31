import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ADMIN_DEMO_EMAIL, ADMIN_DEMO_PASSWORD } from '../data/adminCredentials';
import { readAdminDataSource } from '../data/dataSource';
import { adminApi } from '../api/adminApi';

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

const SESSION_KEY = 'trustlink.admin.session';
const TOKEN_KEY = 'trustlink.admin.token';
const NAME = 'Ilyas Adamu';

/**
 * Admin auth. In mock mode the console uses the documented demo credential; in api mode it
 * calls `POST /auth/admin/login` and stores the JWT from the seeded admin.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const source = readAdminDataSource();
    const session = localStorage.getItem(SESSION_KEY);
    const token = localStorage.getItem(TOKEN_KEY);

    if (session && (source === 'mock' || token)) {
      try {
        setUser(JSON.parse(session));
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    } else if (session) {
      localStorage.removeItem(SESSION_KEY);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const source = readAdminDataSource();

    if (source === 'api') {
      const result = await adminApi.login(email.trim(), password);
      const next: AdminUser = {
        id: result.user.id,
        email: result.user.email ?? email.trim(),
        firstName: result.user.firstName ?? 'TrustLink',
        lastName: result.user.lastName ?? 'Admin',
        role: 'admin',
      };
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setUser(next);
      return;
    }

    if (email.trim().toLowerCase() !== ADMIN_DEMO_EMAIL.toLowerCase() || password !== ADMIN_DEMO_PASSWORD) {
      throw new Error('Incorrect email or password. Use the demo credentials shown below.');
    }
    const [firstName, lastName] = NAME.split(' ');
    const next: AdminUser = { id: 'admin-1', email: ADMIN_DEMO_EMAIL, firstName, lastName, role: 'admin' };
    setUser(next);
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
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
