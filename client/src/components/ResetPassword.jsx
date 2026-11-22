import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { evaluatePasswordRules } from '../utils/passwordRules';
import './Login.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { passwordRecovery, clearPasswordRecovery } = useAuth();

  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]               = useState(false);
  const [checkingLink, setCheckingLink]       = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [error, setError]                     = useState('');
  const [successMsg, setSuccessMsg]           = useState('');

  const passwordCheck = evaluatePasswordRules(password);

  useEffect(() => {
    let active = true;

    const initRecoverySession = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

      const urlError = searchParams.get('error_description') || hashParams.get('error_description');
      if (urlError) {
        if (active) {
          setError(decodeURIComponent(urlError.replace(/\+/g, ' ')));
          setHasRecoverySession(false);
          setCheckingLink(false);
        }
        return;
      }

      try {
        const code = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (code && typeof supabase.auth.exchangeCodeForSession === 'function') {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchErr) throw exchErr;
        } else if (tokenHash && type === 'recovery') {
          const { error: otpErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (otpErr) throw otpErr;
        }

        const { data: { session } = {} } = await supabase.auth.getSession();
        if (!active) return;

        if (session?.user || passwordRecovery) {
          setHasRecoverySession(true);
          // Clean sensitive recovery params from URL bar without reloading
          if (window.location.search || window.location.hash) {
            window.history.replaceState({}, document.title, '/reset-password');
          }
        } else {
          setHasRecoverySession(false);
          setError('This password reset link is invalid or has expired. Please request a new reset email.');
        }
      } catch (err) {
        if (!active) return;
        setHasRecoverySession(false);
        setError(err.message || 'This password reset link is invalid or has expired. Please request a new one.');
      } finally {
        if (active) setCheckingLink(false);
      }
    };

    initRecoverySession();

    return () => { active = false; };
  }, [passwordRecovery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!passwordCheck.allMet) {
      setError('Password must be at least 8 characters, include 1 uppercase letter, and 1 special character.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      clearPasswordRecovery();
      await supabase.auth.signOut();

      setSuccessMsg('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message: 'Password updated successfully! Please sign in with your new password.' },
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Could not update password. Please request a new reset link.');
    } finally {
      setSaving(false);
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
              Set A New<br /><em>Standard</em>
            </h1>
            <p className="hero-sub">
              Create a strong new password to secure your FitTrack training logs, plans, and progress.
            </p>
          </div>
        </div>

        <div className="corner-tl" />
        <div className="corner-br" />
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="auth-right">
        <div className="form-container">
          <div className="mobile-logo">
            <span className="brand-line" />
            <span>FITTRACK</span>
          </div>

          <p className="form-eyebrow">Security Update</p>
          <h2 className="form-title">Reset<br />Password.</h2>
          <div className="gold-rule" />

          {error && <div className="error-banner" role="alert">{error}</div>}
          {successMsg && <div className="success-banner" role="status">{successMsg}</div>}

          {checkingLink ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              Verifying your password reset link...
            </p>
          ) : hasRecoverySession ? (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="new-password">New Password</label>
                <div className="input-wrap input-wrap--password">
                  <input
                    id="new-password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min 8 chars, 1 uppercase, 1 special char"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
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
                <ul className="password-rules-list" aria-live="polite">
                  {passwordCheck.results.map((rule) => (
                    <li key={rule.key} className={`password-rule-item ${rule.met ? 'met' : 'unmet'}`}>
                      <span className="rule-icon">{rule.met ? '✓' : '✕'}</span>
                      <span>{rule.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="field">
                <label htmlFor="confirm-new-password">Confirm New Password</label>
                <div className="input-wrap input-wrap--password">
                  <input
                    id="confirm-new-password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
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
                {confirmPassword && (
                  <span
                    className={`hint ${password === confirmPassword ? 'available' : 'taken'}`}
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      marginTop: '0.45rem',
                      color: password === confirmPassword ? '#55B985' : '#E08888',
                    }}
                  >
                    {password === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                  </span>
                )}
              </div>

              <button type="submit" className="btn-submit" disabled={saving || Boolean(successMsg)}>
                {saving ? (
                  <span className="btn-loading">
                    <span className="dot" /><span className="dot" /><span className="dot" />
                  </span>
                ) : 'Update Password'}
              </button>
            </form>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              <Link
                to="/forgot-password"
                className="btn-submit"
                style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
              >
                Request New Reset Link
              </Link>
            </div>
          )}

          <div className="form-footer">
            <span>Return to account? </span>
            <Link to="/login">Back to Sign In →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
