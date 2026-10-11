import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [remember, setRemember]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [showPass, setShowPass]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let email = identifier.trim();

      if (!email.includes('@')) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', email.toLowerCase())
          .maybeSingle();

        if (profileError || !profile) {
          throw new Error('No account found with that username.');
        }

        const { data: userData, error: userError } = await supabase
          .rpc('get_email_by_id', { user_id: profile.id });

        if (userError || !userData) {
          throw new Error('Could not find account. Try logging in with your email instead.');
        }
        email = userData;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          navigate('/verify-email', { state: { email } });
          return;
        }
        throw signInError;
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">

      {/* ── LEFT HERO PANEL ── */}
      <div className="auth-left">
        <div className="left-overlay" />

        <div className="left-content">
          <div className="left-brand">
            <span className="brand-line" />
            <span className="brand-name">FITTRACK</span>
          </div>

          <div className="left-hero-text">
            <h1 className="hero-heading">
              Forge Your<br /><em>Legacy</em>
            </h1>
            <p className="hero-sub">
              Elite fitness tracking for those who demand nothing but excellence.
            </p>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-num">10K+</span>
              <span className="stat-label">Elite Members</span>
            </div>
            <div className="stat-sep" />
            <div className="stat-item">
              <span className="stat-num">500+</span>
              <span className="stat-label">Expert Programs</span>
            </div>
            <div className="stat-sep" />
            <div className="stat-item">
              <span className="stat-num">95%</span>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>
        </div>

        {/* Corner decorations */}
        <div className="corner-tl" />
        <div className="corner-br" />
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="auth-right">
        <div className="form-container">

          {/* Mobile-only logo */}
          <div className="mobile-logo">
            <span className="brand-line" />
            <span>FITTRACK</span>
          </div>

          <p className="form-eyebrow">Member Login</p>
          <h2 className="form-title">Welcome<br />Back.</h2>
          <div className="gold-rule" />

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="identifier">Email or Username</label>
              <div className="input-wrap">
                <input
                  id="identifier"
                  type="text"
                  placeholder="Enter your email or username"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap input-wrap--password">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="options-row">
              <label className="checkbox-wrap">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="form-footer">
            <span>Don't have an account? </span>
            <Link to="/register">Create Account →</Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;