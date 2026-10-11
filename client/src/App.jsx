import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import Dashboard from './components/Dashboard';

// Protected route – redirects to /login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
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
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Public route – redirects to /dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <Navigate to="/dashboard" replace /> : children;
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
          <Route path="/"             element={<Navigate to="/login" replace />} />
          <Route path="*"             element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;