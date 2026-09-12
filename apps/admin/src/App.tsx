import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DeliveriesPage } from './pages/DeliveriesPage';
import { UsersPage } from './pages/UsersPage';
import { RidersPage } from './pages/RidersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AdminLayout />}>
        <Route element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} path="/" />
        <Route element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} path="/dashboard" />
        <Route element={<ProtectedRoute><DeliveriesPage /></ProtectedRoute>} path="/deliveries" />
        <Route element={<ProtectedRoute><UsersPage /></ProtectedRoute>} path="/users" />
        <Route element={<ProtectedRoute><RidersPage /></ProtectedRoute>} path="/riders" />
        <Route element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} path="/analytics" />
        <Route element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} path="/settings" />
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
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;