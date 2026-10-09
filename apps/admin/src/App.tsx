import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DispatchPage } from './pages/DispatchPage';
import { DeliveriesPage } from './pages/DeliveriesPage';
import { DeliveryDetailPage } from './pages/DeliveryDetailPage';
import { UsersPage } from './pages/UsersPage';
import { RidersPage } from './pages/RidersPage';
import { IssuesPage } from './pages/IssuesPage';
import { PricingPage } from './pages/PricingPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminDataProvider } from './data/AdminDataContext';
import './styles/theme.css';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const protect = (element: React.ReactNode) => <ProtectedRoute>{element}</ProtectedRoute>;

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AdminLayout />}>
        <Route path="/" element={protect(<DashboardPage />)} />
        <Route path="/dashboard" element={protect(<DashboardPage />)} />
        <Route path="/dispatch" element={protect(<DispatchPage />)} />
        <Route path="/deliveries" element={protect(<DeliveriesPage />)} />
        <Route path="/deliveries/:id" element={protect(<DeliveryDetailPage />)} />
        <Route path="/riders" element={protect(<RidersPage />)} />
        <Route path="/users" element={protect(<UsersPage />)} />
        <Route path="/issues" element={protect(<IssuesPage />)} />
        <Route path="/pricing" element={protect(<PricingPage />)} />
        <Route path="/reports" element={protect(<ReportsPage />)} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AdminDataProvider>
            <AppRoutes />
          </AdminDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
