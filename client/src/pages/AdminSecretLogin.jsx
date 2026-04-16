/**
 * AdminSecretLogin.jsx
 *
 * This page is ONLY accessible at a secret URL you define in your router:
 *   <Route path="/portal/[YOUR_SECRET_SLUG]" element={<AdminSecretLogin />} />
 *
 * Example slug: /portal/k9x2m-kcggra-admin
 * - Not linked anywhere in the app
 * - Not visible in the navbar or any menu
 * - Uses password login, not OTP (separate credential from residents)
 * - Wrong password shows no hint about what this page is
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/api';
import { toast } from 'sonner';

export default function AdminSecretLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const passwordRef = useRef(null);

  // ── Lockout timer countdown ──
  useEffect(() => {
    if (!locked) return;
    const interval = setInterval(() => {
      setLockTimer(t => {
        if (t <= 1) { setLocked(false); setAttempts(0); clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (locked) return;

    setLoading(true);
    try {
      const res = await API.post('/auth/admin-login', { email, password });

      if (res.data.user.role !== 'admin') {
        // Deliberately vague — don't reveal this is an admin-only page
        toast.error('Invalid credentials');
        handleFailedAttempt();
        return;
      }

      // Success — go straight to admin dashboard
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      handleFailedAttempt();
    } finally {
      setLoading(false);
    }
  };

  const handleFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    // Lock for increasing durations: 30s, 60s, 120s
    if (newAttempts >= 3) {
      const lockSeconds = Math.min(30 * Math.pow(2, newAttempts - 3), 120);
      setLocked(true);
      setLockTimer(lockSeconds);
      toast.error(`Too many attempts. Try again in ${lockSeconds}s`);
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    // Deliberately minimal — looks like a generic internal tool, not "KCGGRA Admin"
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">

      {/* Subtle background texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FDE9AB]/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#7F77DD]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* No logo, no KCGGRA branding — just a generic lock icon */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#FDE9AB]/10 border border-[#FDE9AB]/20 rounded-2xl
            flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#FDE9AB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-[#94A3B8] text-sm">Restricted access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              autoComplete="username"
              onKeyDown={(e) => e.key === 'Enter' && passwordRef.current?.focus()}
              className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl
                text-white text-sm placeholder:text-[#475569] outline-none
                focus:border-[#FDE9AB]/40 focus:bg-white/8 focus:ring-1 focus:ring-[#FDE9AB]/20
                transition-all duration-200"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              ref={passwordRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3.5 pr-12 bg-white/5 border border-white/10 rounded-xl
                text-white text-sm placeholder:text-[#475569] outline-none
                focus:border-[#FDE9AB]/40 focus:bg-white/8 focus:ring-1 focus:ring-[#FDE9AB]/20
                transition-all duration-200"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#475569] hover:text-[#94A3B8] transition-colors">
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              )}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || locked}
            className="relative w-full overflow-hidden py-3.5 rounded-xl font-semibold text-sm
              bg-[#FDE9AB] text-[#0F172A] hover:bg-[#FDE9AB]/90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 active:scale-[0.98]
              group"
          >
            <span className="relative z-10">
              {locked
                ? `Locked (${lockTimer}s)`
                : loading
                ? 'Authenticating…'
                : 'Continue'}
            </span>
          </button>
        </form>

        {/* Attempt indicator — subtle, no explanation */}
        {attempts > 0 && attempts < 3 && (
          <div className="mt-4 flex justify-center gap-1.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                i < attempts ? 'bg-[#A76059]' : 'bg-white/10'
              }`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}