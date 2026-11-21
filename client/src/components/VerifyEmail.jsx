import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser, isAuthenticated } = useAuth();

  const initialEmail = location.state?.email || '';
  const justSignedUp = Boolean(location.state?.justSignedUp);

  const [email, setEmail]               = useState(initialEmail);
  const [resending, setResending]       = useState(false);
  const [resent, setResent]             = useState(false);
  const [checkingLink, setCheckingLink] = useState(false);
  const [cooldown, setCooldown]         = useState(0);
  const [error, setError]               = useState('');
  const [successMsg, setSuccessMsg]     = useState(
    justSignedUp
      ? 'Account created! Please check your email inbox (and spam or junk folder) for the verification link from FitTrack.'
      : ''
  );
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Redirect automatically once email confirmation completes
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle incoming Supabase email confirmation callbacks if redirected here
  useEffect(() => {
    const handleEmailCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

      const urlError = searchParams.get('error_description') || hashParams.get('error_description');
      if (urlError) {
        setError(decodeURIComponent(urlError.replace(/\+/g, ' ')));
        return;
      }

      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') || 'signup';
      const hasHashToken = hashParams.has('access_token');

      if (!code && !tokenHash && !hasHashToken) return;

      setCheckingLink(true);
      setError('');

      try {
        if (code && typeof supabase.auth.exchangeCodeForSession === 'function') {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) throw exchangeErr;
        } else if (tokenHash) {
          const { error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          if (verifyErr) throw verifyErr;
        }

        const verifiedUser = await refreshUser();
        if (verifiedUser?.email_confirmed_at) {
          setSuccessMsg('Email verified successfully! Redirecting to your dashboard...');
          setTimeout(() => navigate('/dashboard', { replace: true }), 800);
        } else {
          setError('Verification link could not be confirmed. Please request a new confirmation email.');
        }
      } catch (err) {
        setError(err.message || 'Verification link is invalid or expired. Please request a new email.');
      } finally {
        setCheckingLink(false);
      }
    };

    handleEmailCallback();
  }, [navigate, refreshUser]);

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

  const handleCheckStatus = async () => {
    setCheckingLink(true);
    setError('');

    try {
      const latestUser = await refreshUser();
      if (latestUser?.email_confirmed_at) {
        setSuccessMsg('Email verified! Redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
      } else {
        setError(
          'Your email is not verified yet. Please click the confirmation link sent to your inbox (check spam/junk too) and then sign in.'
        );
      }
    } catch (err) {
      setError(err.message || 'Could not check verification status.');
    } finally {
      setCheckingLink(false);
    }
  };

  const handleResend = async () => {
    const targetEmail = email.trim();
    if (cooldown > 0) return;
    if (!targetEmail) {
      setError('Please enter your registered email address first.');
      return;
    }

    setResending(true);
    setError('');
    setResent(false);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (resendError) throw resendError;

      setResent(true);
      setSuccessMsg(
        `Verification link resent to ${targetEmail}! Please check your inbox and spam folder.`
      );
      startCooldown();
    } catch (err) {
      setError(err.message || 'Could not resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* ── Left hero panel ── */}
      <div className="auth-left">
        <div className="left-overlay" />
        <div className="corner-tl" />
        <div className="corner-br" />

        <div className="left-content">
          <div className="left-brand">
            <span className="brand-line" />
            <span className="brand-name">FitTrack</span>
          </div>

          <div className="left-hero-text">
            <h1 className="hero-heading">
              Almost There.<br />
              <em>Verify Your</em><br />
              Email.
            </h1>
            <p className="hero-sub">
              Confirm your email address via the link from FitTrack to activate your account and unlock your dashboard.
            </p>
          </div>

          <div className="verify-bullets">
            <div className="verify-bullet">
              <span className="vb-icon">🏋️</span>
              <span>Build personalised workout plans</span>
            </div>
            <div className="verify-bullet">
              <span className="vb-icon">📅</span>
              <span>Log every session with notes &amp; duration</span>
            </div>
            <div className="verify-bullet">
              <span className="vb-icon">📊</span>
              <span>Track body metrics &amp; progress photos</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right verify panel ── */}
      <div className="auth-right">
        <div className="form-container">
          {/* Mobile-only brand */}
          <div className="mobile-logo">
            <span className="brand-line" />
            <span>FitTrack</span>
          </div>

          <p className="form-eyebrow">Email Confirmation</p>
          <h2 className="form-title">
            Check<br />Your Inbox
          </h2>
          <div className="gold-rule" />

          {/* Email display or input if missing */}
          {initialEmail ? (
            <div className="verify-email-box">
              <span className="verify-email-icon">📧</span>
              <div>
                <p className="verify-sent-text">We sent a verification link from FitTrack to</p>
                <p className="verify-email-addr">{email}</p>
              </div>
            </div>
          ) : (
            <div className="verify-field">
              <label htmlFor="verify-email-input">Registered Email</label>
              <input
                id="verify-email-input"
                type="email"
                className="verify-text-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
              />
            </div>
          )}

          <p className="verify-instruction">
            Open your email inbox and click the verification link from <strong>FitTrack</strong> to confirm your account.
          </p>
          <p className="verify-spam-note">
            Don't see the email? Check your spam, promotions, or junk folder.
          </p>

          {error && <div className="error-banner" role="alert">⚠️ {error}</div>}
          {(successMsg || resent) && !error && (
            <div className="success-banner" role="status">
              ✅ {successMsg || 'Verification email resent! Please check your inbox and spam folder.'}
            </div>
          )}

          <div className="verify-actions">
            <button
              type="button"
              className="btn-submit"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
            >
              {resending
                ? 'Sending…'
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : 'Resend Verification Email'}
            </button>

            <button
              type="button"
              className="btn-secondary-verify"
              onClick={handleCheckStatus}
              disabled={checkingLink}
            >
              {checkingLink ? 'Checking Verification…' : "I've Clicked the Verification Link"}
            </button>

            <div className="form-footer">
              Already verified?
              <Link to="/login"> Back to Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
