import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Login.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading]       = useState(false);
  const [cooldown, setCooldown]     = useState(0);
  const [error, setError]           = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    let seconds = 60;
    setCooldown(seconds);
    timerRef.current = setInterval(() => {
      seconds -= 1;
      setCooldown(seconds);
      if (seconds <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cooldown > 0) return;

    setError('');
    setSuccessMsg('');

    const raw = identifier.trim();
    if (!raw) {
      setError('Please enter your email address or username.');
      return;
    }

    setLoading(true);

    try {
      let targetEmail = raw;

      if (!raw.includes('@')) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', raw.toLowerCase())
          .maybeSingle();

        if (profileError || !profile) {
          throw new Error('No account found with that username.');
        }

        const { data: resolvedEmail, error: emailError } = await supabase
          .rpc('get_email_by_id', { user_id: profile.id });

        if (emailError || !resolvedEmail) {
          throw new Error('Could not resolve account email. Please enter your email address directly.');
        }
        targetEmail = resolvedEmail;
      } else if (!EMAIL_REGEX.test(targetEmail)) {
        throw new Error('Please enter a valid email address.');
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: window.location.origin,
      });

      if (resetError) throw resetError;

      setSuccessMsg(
        `Password reset link sent to ${targetEmail}. Please check your inbox (and spam or junk folder) and click the link to set a new password.`
      );
      startCooldown();
    } catch (err) {
      setError(err.message || 'Could not send password reset email. Please try again.');
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
              Recover<br />Your <em>Access</em>
            </h1>
            <p className="hero-sub">
              Enter your account email or username and we will send you a secure FitTrack link to reset your password.
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

          <p className="form-eyebrow">Account Recovery</p>
          <h2 className="form-title">Forgot<br />Password.</h2>
          <div className="gold-rule" />

          {error && <div className="error-banner" role="alert">{error}</div>}
          {successMsg && <div className="success-banner" role="status">{successMsg}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="reset-identifier">Email Address or Username</label>
              <div className="input-wrap">
                <input
                  id="reset-identifier"
                  type="text"
                  placeholder="name@example.com or username"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={loading || cooldown > 0}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </span>
              ) : cooldown > 0 ? (
                `Resend in ${cooldown}s`
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="form-footer">
            <span>Remembered your password? </span>
            <Link to="/login">Back to Sign In →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
