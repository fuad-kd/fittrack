import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { evaluatePasswordRules } from '../utils/passwordRules';
import './Login.css';
import './Register.css';

const COUNTRY_PHONE_OPTIONS = [
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', example: '1712-345678' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', example: '(555) 234-5678' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', example: '7911 123456' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', example: '(416) 555-0192' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', example: '98765-43210' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', example: '301-2345678' },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', example: '50 123 4567' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', example: '50 123 4567' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', example: '12-345 6789' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', example: '8123 4567' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', example: '412 345 678' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', example: '151 23456789' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', example: '6 12 34 56 78' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', example: '312 345 6789' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', example: '612 34 56 78' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', example: '90-1234-5678' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', example: '10-1234-5678' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', example: '532 123 45 67' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    countryCode: 'BD',
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
  // Email availability state: 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'valid_unverified'
  const [emailStatus, setEmailStatus]       = useState('idle');

  const usernameTimerRef = useRef(null);
  const emailTimerRef = useRef(null);
  const latestUsernameRef = useRef('');
  const latestEmailRef = useRef('');

  useEffect(() => {
    return () => {
      if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
      if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    };
  }, []);

  const selectedCountry =
    COUNTRY_PHONE_OPTIONS.find((c) => c.code === form.countryCode) || COUNTRY_PHONE_OPTIONS[0];

  const passwordCheck = evaluatePasswordRules(form.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');

    if (name === 'username') {
      checkUsernameDebounced(value);
    } else if (name === 'email') {
      checkEmailDebounced(value);
    }
  };

  // Debounced username availability check (500 ms)
  const checkUsernameDebounced = (value) => {
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);

    const trimmed = value.trim().toLowerCase();
    latestUsernameRef.current = trimmed;

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

        if (latestUsernameRef.current !== trimmed) return;

        if (error) {
          console.warn('Username check error:', error.message);
          setUsernameStatus('available');
          return;
        }
        setUsernameStatus(data ? 'taken' : 'available');
      } catch (err) {
        if (latestUsernameRef.current !== trimmed) return;
        console.warn('Username check failed:', err);
        setUsernameStatus('available');
      }
    }, 500);
  };

  // Debounced email availability check (500 ms)
  const checkEmailDebounced = (value) => {
    if (emailTimerRef.current) clearTimeout(emailTimerRef.current);

    const trimmed = value.trim().toLowerCase();
    latestEmailRef.current = trimmed;

    if (!trimmed) {
      setEmailStatus('idle');
      return;
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailStatus('invalid');
      return;
    }

    setEmailStatus('checking');

    emailTimerRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('check_email_available', {
          email_input: trimmed,
        });

        if (latestEmailRef.current !== trimmed) return;

        if (error || typeof data !== 'boolean') {
          if (error) console.warn('Email availability check error:', error.message);
          setEmailStatus('valid_unverified');
          return;
        }

        setEmailStatus(data ? 'available' : 'taken');
      } catch (err) {
        if (latestEmailRef.current !== trimmed) return;
        console.warn('Email availability check failed:', err);
        setEmailStatus('valid_unverified');
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

  const emailHint = () => {
    switch (emailStatus) {
      case 'checking':         return <span className="hint checking">Checking email availability...</span>;
      case 'available':        return <span className="hint available">✓ Email available</span>;
      case 'taken':            return <span className="hint taken">✕ Email already registered — try signing in</span>;
      case 'invalid':          return <span className="hint invalid">Enter a valid email address (e.g. name@example.com)</span>;
      case 'valid_unverified': return <span className="hint neutral">✓ Valid email format</span>;
      default:                 return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = form.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (emailStatus === 'taken') {
      setError('This email is already registered. Please sign in instead.');
      return;
    }
    if (emailStatus === 'checking') {
      setError('Still checking email availability — please wait a moment and try again.');
      return;
    }

    if (!passwordCheck.allMet) {
      setError('Password must be at least 8 characters, include 1 uppercase letter, and 1 special character.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
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

    const rawPhone = form.phone.trim();
    if (rawPhone) {
      const digitsOnly = rawPhone.replace(/\D/g, '');
      if (digitsOnly.length < 6) {
        setError(`Please enter a valid phone number (e.g. ${selectedCountry.dialCode} ${selectedCountry.example}).`);
        return;
      }
    }

    const formattedPhone = rawPhone
      ? (rawPhone.startsWith('+') ? rawPhone : `${selectedCountry.dialCode} ${rawPhone}`)
      : null;

    setLoading(true);

    try {
      // 1. Create auth user with Supabase, passing profile data in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: form.password,
        options: {
          data: {
            username: trimmedUsername,
            phone: formattedPhone,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;

      const createdUser = authData?.user;
      if (!createdUser?.id) throw new Error('Failed to create account. Please try again.');

      // Supabase returns empty identities when email already exists and confirmation is enabled
      if (Array.isArray(createdUser.identities) && createdUser.identities.length === 0) {
        setEmailStatus('taken');
        throw new Error('An account with this email already exists. Please sign in instead.');
      }

      // Never allow an unverified user session into the dashboard
      if (authData?.session && !createdUser.email_confirmed_at) {
        await supabase.auth.signOut();
      }

      // 2. Navigate to verification confirmation screen
      navigate('/verify-email', {
        state: {
          email: trimmedEmail,
          justSignedUp: true,
        },
      });
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
                  className={
                    emailStatus === 'available' ? 'input-available' :
                    emailStatus === 'taken' || emailStatus === 'invalid' ? 'input-taken' : ''
                  }
                />
              </div>
              {emailHint()}
            </div>

            {/* Phone with Country Code Selector + Dynamic Example Number */}
            <div className="field">
              <label htmlFor="phone">
                Phone Number <span className="label-optional">(optional)</span>
              </label>
              <div className="phone-input-group">
                <select
                  id="countryCode"
                  name="countryCode"
                  aria-label="Country code"
                  value={form.countryCode}
                  onChange={handleChange}
                  className="country-code-select"
                >
                  {COUNTRY_PHONE_OPTIONS.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.code} ({country.dialCode})
                    </option>
                  ))}
                </select>
                <div className="input-wrap phone-number-wrap">
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder={`e.g. ${selectedCountry.example}`}
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel-national"
                  />
                </div>
              </div>
              <span className="phone-format-hint">
                Example ({selectedCountry.name}): {selectedCountry.dialCode} {selectedCountry.example}
              </span>
            </div>

            {/* Password */}
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap input-wrap--password">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Min 8 chars, 1 uppercase, 1 special char"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  aria-describedby="register-password-rules"
                  className={!passwordCheck.allMet ? 'input-taken' : 'input-available'}
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
              <ul id="register-password-rules" className="password-rules-list" aria-live="polite">
                {passwordCheck.results.map((rule) => (
                  <li key={rule.key} className={`password-rule-item ${rule.met ? 'met' : 'unmet'}`}>
                    <span className="rule-icon">{rule.met ? '✓' : '✕'}</span>
                    <span>{rule.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Confirm Password */}
            <div className="field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrap input-wrap--password">
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
                    form.confirmPassword
                      ? (form.password === form.confirmPassword ? 'input-available' : 'input-taken')
                      : ''
                  }
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
              {form.confirmPassword && (
                <span className={`hint ${form.password === form.confirmPassword ? 'available' : 'taken'}`}>
                  {form.password === form.confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                </span>
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