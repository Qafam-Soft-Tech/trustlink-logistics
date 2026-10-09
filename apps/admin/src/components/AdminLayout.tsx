import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'home' },
  { name: 'Dispatch', href: '/dispatch', icon: 'navigation' },
  { name: 'Deliveries', href: '/deliveries', icon: 'package' },
  { name: 'Riders', href: '/riders', icon: 'truck' },
  { name: 'Users', href: '/users', icon: 'users' },
  { name: 'Issues', href: '/issues', icon: 'alert' },
  { name: 'Pricing', href: '/pricing', icon: 'tag' },
  { name: 'Reports', href: '/reports', icon: 'bar-chart' },
];

const TITLES: Array<[RegExp, string]> = [
  [/^\/dispatch/, 'Dispatch board'],
  [/^\/deliveries\/[^/]+/, 'Delivery details'],
  [/^\/deliveries/, 'Deliveries'],
  [/^\/riders/, 'Riders & KYC'],
  [/^\/users/, 'Users'],
  [/^\/issues/, 'Issues'],
  [/^\/pricing/, 'Pricing'],
  [/^\/reports/, 'Reports'],
  [/^\/(dashboard)?$/, 'Dashboard'],
];

function titleFor(pathname: string): string {
  return TITLES.find(([pattern]) => pattern.test(pathname))?.[1] ?? 'Dashboard';
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="logo">
            <div className="logo-icon">TL</div>
            <span className="logo-text">TrustLink</span>
          </div>
        )}
        <button className="sidebar-toggle" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
          </svg>
        </button>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink to={item.href} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} title={collapsed ? item.name : undefined}>
                <span className="nav-icon">
                  <Icon name={item.icon} />
                </span>
                {!collapsed && <span className="nav-text">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
    navigation: (
      <>
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </>
    ),
    package: (
      <>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </>
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    truck: (
      <>
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </>
    ),
    tag: (
      <>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </>
    ),
    'bar-chart': (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] ?? paths.home}
    </svg>
  );
}

function Header({ user, onLogout }: { user: { firstName: string; lastName: string; email: string } | null; onLogout: () => void }) {
  const { pathname } = useLocation();
  const [menu, setMenu] = useState<{ open: boolean; path: string }>({ open: false, path: pathname });
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when the route changes (adjusted during render — no effect needed).
  if (menu.path !== pathname) setMenu({ open: false, path: pathname });

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenu((prev) => ({ ...prev, open: false }));
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="admin-header">
      <div className="header-left">
        <h1 className="page-title">{titleFor(pathname)}</h1>
      </div>
      <div className="header-right">
        <div className="user-menu dropdown" ref={menuRef}>
          <button className="user-menu-trigger" aria-expanded={menu.open} aria-haspopup="true" onClick={() => setMenu((prev) => ({ ...prev, open: !prev.open }))}>
            <div className="avatar avatar-sm" style={{ backgroundColor: 'var(--color-navy)' }}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <span className="user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {menu.open ? (
            <div className="dropdown-menu" role="menu">
              <div className="dropdown-header" style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="user-info-name">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="user-info-email" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  {user?.email}
                </div>
              </div>
              <button className="dropdown-item danger" role="menuitem" onClick={onLogout}>
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="admin-layout">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="admin-main">
        <Header
          user={user}
          onLogout={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
