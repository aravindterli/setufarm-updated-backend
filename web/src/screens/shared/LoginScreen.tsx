import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { Role } from '../../types';
import logo from '../../assets/logo.png';

type Step = 'email' | 'otp';

export default function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as { mode?: string; role?: Role } | null) ?? {};
  const isSignup = state.mode === 'signup';
  const presetRole = state.role;

  const { sendOtp, verifyOtp, isLoading, user } = useAuthStore();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(presetRole ?? 'buyer');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email'); return; }
    setError('');
    try {
      await sendOtp(email.trim());
      setStep('otp');
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to send OTP. Try again.');
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setError('');
    try {
      await verifyOtp(email, otpStr, role);
      // Redirect after login (user will be set in store)
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Invalid OTP. Try again.');
    }
  };

  // Redirect after successful login
  if (user) {
    if (!user.name) {
      navigate(`/register/${user.role}`, { replace: true });
    } else {
      navigate(`/${user.role}`, { replace: true });
    }
    return null;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <img src={logo} alt="SetuFarm Logo" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
        </div>

        {step === 'email' ? (
          <>
            <div className="auth-title">{isSignup ? 'Create Account' : 'Welcome Back'}</div>
            <div className="auth-sub">
              {isSignup
                ? 'Enter your email to receive an OTP and get started.'
                : 'Sign in to your SetuFarm account.'}
            </div>
            <form onSubmit={handleSendOtp}>
              {isSignup && (
                <div className="form-group">
                  <label className="form-label">I am a</label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                  >
                    <option value="farmer">👨‍🌾 Farmer</option>
                    <option value="buyer">🛒 Buyer</option>
                    <option value="driver">🚚 Driver</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              {!isSignup && (
                <div className="form-group">
                  <label className="form-label">Sign in as</label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                  >
                    <option value="farmer">👨‍🌾 Farmer</option>
                    <option value="buyer">🛒 Buyer</option>
                    <option value="driver">🚚 Driver</option>
                  </select>
                </div>
              )}
              {error && (
                <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>
              )}
              <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={isLoading}>
                {isLoading ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
              {isSignup ? (
                <>Already have an account?{' '}
                  <span style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => navigate('/login')}>Sign In</span>
                </>
              ) : (
                <>New to SetuFarm?{' '}
                  <span style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => navigate('/role-selection')}>Create Account</span>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="auth-title">Check your email</div>
            <div className="auth-sub">
              We sent a 6-digit OTP to <strong>{email}</strong>
            </div>
            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: 20 }}>
                <div className="form-label" style={{ marginBottom: 10 }}>Enter OTP</div>
                <div className="otp-inputs">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el; }}
                      className="otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    />
                  ))}
                </div>
              </div>
              {error && (
                <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>
              )}
              <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={isLoading}>
                {isLoading ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </form>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setStep('email'); setOtp(['','','','','','']); setError(''); }}>
                ← Change email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
