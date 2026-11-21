import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import Dashboard from './components/Dashboard';

const LoadingScreen = () => (
  <div style={{
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#0f1520',
    color: '#f6d365',
    fontSize: '1.2rem',
    fontFamily: 'sans-serif',
  }}>
    💪 Loading FitTrack...
  </div>
);

// Protected route – redirects to /login or /verify-email if not authenticated & email-verified
const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) {
    if (user && !user.email_confirmed_at) {
      return <Navigate to="/verify-email" state={{ email: user.email }} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public route – redirects to /dashboard only if authenticated & email-verified
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Root route – waits for Supabase auth callback params (?code=... / #access_token=...) before redirecting
const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Navigate
      to={{
        pathname: '/login',
        search: window.location.search,
        hash: window.location.hash,
      }}
      replace
    />
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"        element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register"     element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected routes */}
          <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/"             element={<RootRedirect />} />
          <Route path="*"             element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;