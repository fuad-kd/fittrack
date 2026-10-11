import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [agree, setAgree]                   = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [showPass, setShowPass]             = useState(false);

  // Username availability state: 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  const [usernameStatus, setUsernameStatus] = useState('idle');
  // useRef so the timer never causes re-renders or stale closures
  const usernameTimerRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');

    if (name === 'username') {
      checkUsernameDebounced(value);
    }
  };

  // Debounced username availability check (500 ms)
  const checkUsernameDebounced = (value) => {
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);

    const trimmed = value.trim().toLowerCase();

    if (trimmed.length < 3) {
      setUsernameStatus(trimmed.length === 0 ? 'idle' : 'invalid');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');

    usernameTimerRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', trimmed)
          .maybeSingle();

        if (error) {
          // Can't reach DB — assume available; unique constraint protects on insert
          console.warn('Username check error:', error.message);
          setUsernameStatus('available');
          return;
        }
        setUsernameStatus(data ? 'taken' : 'available');
      } catch (err) {
        console.warn('Username check failed:', err);
        setUsernameStatus('available');
      }
    }, 500);
  };

  const usernameHint = () => {
    switch (usernameStatus) {
      case 'checking':   return <span className="hint checking">Checking availability...</span>;
      case 'available':  return <span className="hint available">✓ Username available</span>;
      case 'taken':      return <span className="hint taken">✕ Username already taken</span>;
      case 'invalid':    return <span className="hint invalid">3+ chars, alphanumeric &amp; underscores only</span>;
      default:           return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    // Username format check (always runs regardless of background check status)
    const trimmedUsername = form.username.trim().toLowerCase();
    if (trimmedUsername.length < 3 || !/^[a-z0-9_]+$/.test(trimmedUsername)) {
      setError('Username must be 3+ characters (letters, numbers, underscores only).');
      return;
    }
    if (usernameStatus === 'taken') {
      setError('That username is already taken. Please choose another.');
      return;
    }
    if (usernameStatus === 'invalid') {
      setError('Username must be 3+ characters (letters, numbers, underscores only).');
      return;
    }
    if (usernameStatus === 'checking') {
      setError('Still checking username availability — please wait a moment and try again.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create auth user with Supabase, passing profile data in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            username: trimmedUsername,
            phone: form.phone.trim() || null,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error('Failed to create account. Please try again.');

      // The profiles table insert is now handled securely by a database trigger 
      // (handle_new_user) on the Supabase backend to avoid RLS violations.

      // 2. Navigate to verification screen
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* ── LEFT HERO PANEL ── */}
      <div className="auth-left register-left">
        <div className="left-overlay" />

        <div className="left-content">
          <div className="left-brand">
            <span className="brand-line" />
            <span className="brand-name">FITTRACK</span>
          </div>

          <div className="left-hero-text">
            <h1 className="hero-heading">
              Elevate Your<br /><em>Standard</em>
            </h1>
            <p className="hero-sub">
              Join a curated community dedicated to peak performance, disciplined tracking, and timeless transformation.
            </p>
          </div>

          <div className="perks-list">
            <div className="perk-item">
              <span className="perk-icon">✦</span>
              <div>
                <h4>Precision Tracking</h4>
                <p>Monitor volume, intensity, and progression seamlessly</p>
              </div>
            </div>
            <div className="perk-item">
              <span className="perk-icon">✦</span>
              <div>
                <h4>Custom Protocols</h4>
                <p>Access curated routines and video guides</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Framing */}
        <div className="corner-tl" />
        <div className="corner-br" />
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="auth-right">
        <div className="form-container register-form-container">

          {/* Mobile brand header */}
          <div className="mobile-logo">
            <span className="brand-line" />
            <span>FITTRACK</span>
          </div>

          <p className="form-eyebrow">Exclusive Access</p>
          <h2 className="form-title">Create<br />Account.</h2>
          <div className="gold-rule" />

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="field">
              <label htmlFor="username">Username</label>
              <div className="input-wrap">
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="e.g. alex_vance"
                  value={form.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  className={
                    usernameStatus === 'available' ? 'input-available' :
                    usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'input-taken' : ''
                  }
                />
              </div>
              {usernameHint()}
            </div>

            {/* Email */}
            <div className="field">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrap">
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="field">
              <label htmlFor="phone">
                Phone Number <span className="label-optional">(optional)</span>
              </label>
              <div className="input-wrap">
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Password */}
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap input-wrap--password">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div className="field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrap">
                <input
                  id="confirmPassword"
                  type={showPass ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className={
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? 'input-taken' : ''
                  }
                />
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <span className="hint taken">Passwords do not match</span>
              )}
            </div>

            {/* Agreement */}
            <div className="terms-wrap">
              <label className="checkbox-wrap">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={() => setAgree(!agree)}
                  required
                />
                <span>
                  I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
                </span>
              </label>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </span>
              ) : 'Complete Membership'}
            </button>
          </form>

          <div className="form-footer">
            <span>Already a member? </span>
            <Link to="/login">Sign In →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;