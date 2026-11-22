import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
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

// Protected route – redirects to /login, /verify-email, or /reset-password if not ready
const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, passwordRecovery, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (passwordRecovery) {
    return <Navigate to="/reset-password" replace />;
  }

  if (!isAuthenticated) {
    if (user && !user.email_confirmed_at) {
      return <Navigate to="/verify-email" state={{ email: user.email }} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public route – redirects to /dashboard only if authenticated & not in password recovery
const PublicRoute = ({ children }) => {
  const { isAuthenticated, passwordRecovery, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (passwordRecovery) {
    return <Navigate to="/reset-password" replace />;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Root route – waits for Supabase auth callback params (?code=... / #access_token=... / type=recovery) before redirecting
const RootRedirect = () => {
  const { isAuthenticated, passwordRecovery, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  const isRecoveryUrl =
    passwordRecovery ||
    window.location.hash.includes('type=recovery') ||
    window.location.search.includes('type=recovery');

  if (isRecoveryUrl) {
    return (
      <Navigate
        to={{
          pathname: '/reset-password',
          search: window.location.search,
          hash: window.location.hash,
        }}
        replace
      />
    );
  }

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
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  return (
    <AuthProvider>
      {mapsQuotaExceeded && (
        <div className="gmp-quota-banner" role="status">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register"        element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/verify-email"    element={<VerifyEmail />} />

          {/* Protected routes */}
          <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/"                element={<RootRedirect />} />
          <Route path="*"                element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;