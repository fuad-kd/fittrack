import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const email     = location.state?.email || '';

  const [resending, setResending]   = useState(false);
  const [resent, setResent]         = useState(false);
  const [cooldown, setCooldown]     = useState(0);
  const [error, setError]           = useState('');

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setError('');

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    setResending(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setResent(true);

    // 60 second cooldown before allowing resend again
    let seconds = 60;
    setCooldown(seconds);
    const timer = setInterval(() => {
      seconds -= 1;
      setCooldown(seconds);
      if (seconds <= 0) {
        clearInterval(timer);
        setResent(false);
      }
    }, 1000);
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
              One click away from unlocking your full fitness dashboard — plans, logs, and progress tracking.
            </p>
          </div>

          <div className="verify-bullets">
            <div className="verify-bullet">
              <span className="vb-icon">🏋️</span>
              <span>Build personalised workout plans</span>
            </div>
            <div className="verify-bullet">
              <span className="vb-icon">📅</span>
              <span>Log every session with notes & duration</span>
            </div>
            <div className="verify-bullet">
              <span className="vb-icon">📊</span>
              <span>Track body metrics & progress photos</span>
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

          <p className="form-eyebrow">Account Setup</p>
          <h2 className="form-title">Check<br />Your Email</h2>
          <div className="gold-rule" />

          {/* Email display */}
          <div className="verify-email-box">
            <span className="verify-email-icon">📧</span>
            <div>
              <p className="verify-sent-text">We sent a confirmation link to</p>
              {email && <p className="verify-email-addr">{email}</p>}
            </div>
          </div>

          <p className="verify-instruction">
            Click the link in that email to verify your account and start your fitness journey.
          </p>
          <p className="verify-spam-note">
            Don't see it? Check your spam or junk folder.
          </p>

          {error  && <div className="error-banner">⚠️ {error}</div>}
          {resent && <div className="success-banner">✅ Confirmation email resent!</div>}

          <div className="verify-actions">
            <button
              className="btn-submit"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
            >
              {resending
                ? 'Sending…'
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : 'Resend Email'}
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
