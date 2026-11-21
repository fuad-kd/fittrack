import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser, isAuthenticated } = useAuth();

  const initialEmail = location.state?.email || '';
  const initialDemoCode = location.state?.demoVerificationCode || '';
  const isDemoMode = !isSupabaseConfigured;

  const [email, setEmail]               = useState(initialEmail);
  const [otpCode, setOtpCode]           = useState('');
  const [demoCode, setDemoCode]         = useState(initialDemoCode);
  const [resending, setResending]       = useState(false);
  const [resent, setResent]             = useState(false);
  const [verifying, setVerifying]       = useState(false);
  const [checkingLink, setCheckingLink] = useState(false);
  const [cooldown, setCooldown]         = useState(0);
  const [error, setError]               = useState('');
  const [successMsg, setSuccessMsg]     = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // If user is already verified, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle incoming Supabase email confirmation link (?code=... or ?token_hash=... or #access_token=...)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

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
          setError('Verification link could not be confirmed. Please request a new email.');
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

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const targetEmail = email.trim();
    const cleanCode = otpCode.trim();

    if (!targetEmail) {
      setError('Please enter your registered email address.');
      return;
    }
    if (!/^\d{6}$/.test(cleanCode)) {
      setError('Please enter the valid 6-digit verification code.');
      return;
    }

    setVerifying(true);
    setError('');
    setSuccessMsg('');

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: cleanCode,
        type: 'signup',
      });

      if (verifyError) throw verifyError;

      const verifiedUser = data?.user || (await refreshUser());
      if (!verifiedUser?.email_confirmed_at) {
        throw new Error('Verification was not completed. Please try again.');
      }

      setSuccessMsg('Email verified! Taking you to your dashboard...');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCheckStatus = async () => {
    setCheckingLink(true);
    setError('');
    setSuccessMsg('');

    try {
      const latestUser = await refreshUser();
      if (latestUser?.email_confirmed_at) {
        setSuccessMsg('Email verified! Redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
      } else {
        setError('Your email is not verified yet. Please click the confirmation link sent to your inbox or enter your 6-digit code.');
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
    setSuccessMsg('');
    setResent(false);

    try {
      const { data, error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (resendError) throw resendError;

      if (isDemoMode && data?.verificationCode) {
        setDemoCode(data.verificationCode);
      }

      setResent(true);
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
              Verify your email address to activate your account and unlock workout plans, logs, and progress tracking.
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

          <p className="form-eyebrow">Account Verification Required</p>
          <h2 className="form-title">
            Verify<br />Your Email
          </h2>
          <div className="gold-rule" />

          {/* Email display or input if missing */}
          {initialEmail ? (
            <div className="verify-email-box">
              <span className="verify-email-icon">📧</span>
              <div>
                <p className="verify-sent-text">
                  {isDemoMode
                    ? 'Verification required for'
                    : 'We sent a verification link / code to'}
                </p>
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

          {isDemoMode ? (
            <div className="demo-verify-notice">
              <p className="demo-verify-title">Local Verification Code Required</p>
              <p className="demo-verify-desc">
                No Supabase SMTP project is connected in <code>.env</code>, so external inbox delivery is unavailable.
                {demoCode ? (
                  <>
                    {' '}Enter your 6-digit sandbox verification code <strong className="demo-otp-badge">{demoCode}</strong> below to confirm your email.
                  </>
                ) : (
                  ' Click "Resend Code" below to generate a 6-digit verification code and enter it to verify.'
                )}
              </p>
            </div>
          ) : (
            <>
              <p className="verify-instruction">
                Click the confirmation link in your email <strong>or</strong> enter the 6-digit verification code sent to your inbox. You cannot access the dashboard until verification is complete.
              </p>
              <p className="verify-spam-note">
                Don't see it? Check your spam or junk folder.
              </p>
            </>
          )}

          {error && <div className="error-banner" role="alert">⚠️ {error}</div>}
          {successMsg && <div className="success-banner" role="status">✅ {successMsg}</div>}
          {resent && !successMsg && (
            <div className="success-banner" role="status">
              {isDemoMode
                ? '✅ New 6-digit verification code generated!'
                : '✅ Confirmation email resent! Please check your inbox.'}
            </div>
          )}

          {/* 6-Digit Code Verification Form */}
          <form className="verify-otp-form" onSubmit={handleVerifyCode}>
            <div className="verify-field">
              <label htmlFor="otp-code-input">6-Digit Verification Code</label>
              <input
                id="otp-code-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="verify-otp-input"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(digitsOnly);
                  setError('');
                }}
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={verifying || checkingLink || otpCode.trim().length !== 6}
            >
              {verifying ? 'Verifying Code…' : 'Verify Code & Continue'}
            </button>
          </form>

          <div className="verify-actions">
            {!isDemoMode && (
              <button
                type="button"
                className="btn-secondary-verify"
                onClick={handleCheckStatus}
                disabled={checkingLink || verifying}
              >
                {checkingLink ? 'Checking Status…' : "I've Clicked the Email Link"}
              </button>
            )}

            <button
              type="button"
              className="btn-secondary-verify"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
            >
              {resending
                ? 'Sending…'
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : isDemoMode
                ? 'Resend Verification Code'
                : 'Resend Verification Email'}
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
