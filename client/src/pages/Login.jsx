/**
 * Login.jsx — replaces both Login.jsx and Signup.jsx
 * /login and /signup both point here
 *
 * Google fix: reads VITE_API_URL from .env — NOT hardcoded localhost
 * Make sure your .env has:
 *   VITE_API_URL=https://kcggra-production.up.railway.app/api
 */

import { useState } from 'react';
import API from '@/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [phoneDigits, setPhone] = useState('');
  const [otp, setOTP]           = useState('');
  const [focused, setFocused]   = useState('');
  const [profile, setProfile]   = useState({ username: '', email: '', street: '' });

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (phoneDigits.length !== 9) { toast.error('Please enter 9 digits'); return; }
    setLoading(true);
    try {
      const res = await API.post('/auth/request-otp', { phone: `254${phoneDigits}` });
      toast.success(res.data.message);
      if (res.data.otp) toast.info(`Dev OTP: ${res.data.otp}`, { duration: 10000 });
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Please enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const res = await API.post('/auth/verify-otp', { phone: `254${phoneDigits}`, otp });
      const { user } = res.data;
      if (user.username.startsWith('User_')) { setStep(3); return; }
      if (user.role === 'guard') navigate('/guard/dashboard', { replace: true });
      else                       navigate('/dashboard',       { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    if (!profile.username || !profile.street) {
      toast.error('Please enter your name and address');
      return;
    }
    setLoading(true);
    try {
      await API.patch('/auth/update-profile', {
        username: profile.username,
        email:    profile.email,
        street:   profile.street,
      });
      toast.success('Welcome to KCGGRA!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally { setLoading(false); }
  };

  // ✅ FIXED: reads env var, never hardcoded localhost
  const handleGoogle = () => {
    const base = import.meta.env.VITE_API_URL?.replace('/api', '')
      || 'http://localhost:5000';
    window.location.href = `${base}/auth/google`;
  };

  const inputCls = (name) => [
    'w-full px-4 py-3.5 border rounded-xl bg-[#F8FAFC] text-[#0F172A]',
    'text-sm outline-none placeholder:text-[#94A3B8] transition-all duration-200',
    focused === name
      ? 'border-[#7F77DD] ring-2 ring-[#7F77DD]/20'
      : 'border-[#E2E8F0] hover:border-[#CBD5E1]',
  ].join(' ');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#FDE9AB]/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#7F77DD]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0F172A] rounded-2xl flex items-center justify-center
            mx-auto mb-4 shadow-xl shadow-[#0F172A]/20 hover:scale-105 transition-transform duration-300">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">KCGGRA</h1>
          <p className="text-[#64748B] text-sm mt-1">Community Portal</p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${
              s === step ? 'w-8 bg-[#0F172A]' : s < step ? 'w-4 bg-[#0F172A]/40' : 'w-4 bg-[#E2E8F0]'
            }`} />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          <div className="bg-[#0F172A] px-6 py-5 relative overflow-hidden">
            <div className="absolute -bottom-1 left-0 right-0 opacity-10">
              <svg viewBox="0 0 400 40" className="w-full">
                <path d="M0,20 Q100,0 200,20 T400,20 L400,40 L0,40 Z" fill="#FDE9AB" />
              </svg>
            </div>
            <h2 className="text-[#FDE9AB] text-xl font-bold relative">
              {step === 1 ? 'Welcome' : step === 2 ? 'Verify code' : 'Almost done'}
            </h2>
            <p className="text-[#94A3B8] text-sm mt-1 relative">
              {step === 1 ? 'Enter your phone to continue' :
               step === 2 ? `Code sent to +254${phoneDigits}` :
               'Just your name and address'}
            </p>
          </div>

          <div className="p-6">

            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div>
                  <label className="text-[#0F172A] font-semibold text-sm block mb-2">Phone Number</label>
                  <div className={[
                    'flex items-center border rounded-xl bg-[#F8FAFC] overflow-hidden transition-all duration-200',
                    focused === 'phone'
                      ? 'border-[#7F77DD] ring-2 ring-[#7F77DD]/20'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1]',
                  ].join(' ')}>
                    <div className="px-4 py-3.5 border-r border-[#E2E8F0] bg-white flex-shrink-0">
                      <span className="text-[#0F172A] font-semibold text-sm">+254</span>
                    </div>
                    <input
                      type="tel"
                      value={phoneDigits}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      placeholder="712 345 678"
                      className="flex-1 px-4 py-3.5 bg-transparent outline-none text-[#0F172A] text-sm placeholder:text-[#94A3B8]"
                      onFocus={() => setFocused('phone')}
                      onBlur={() => setFocused('')}
                    />
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1.5">Works for new and existing accounts</p>
                </div>

                {/* Rose expand button — Send OTP */}
                <RoseButton loading={loading} loadingText="Sending…">
                  Send OTP
                </RoseButton>

                <Divider />

                <GoogleExpandButton onClick={handleGoogle} />

                <p className="text-center text-xs text-[#94A3B8] pt-1">
                  New or returning — this works for both
                </p>
              </form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="text-[#0F172A] font-semibold text-sm block mb-2">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={e => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    maxLength={6}
                    autoFocus
                    className={[
                      'w-full px-4 py-5 border rounded-xl bg-[#F8FAFC] text-[#0F172A]',
                      'text-center text-3xl font-bold tracking-[0.6em] outline-none',
                      'placeholder:text-[#E2E8F0] transition-all duration-200',
                      focused === 'otp'
                        ? 'border-[#7F77DD] ring-2 ring-[#7F77DD]/20'
                        : 'border-[#E2E8F0]',
                    ].join(' ')}
                    onFocus={() => setFocused('otp')}
                    onBlur={() => setFocused('')}
                  />
                  <p className="text-xs text-[#94A3B8] mt-2 text-center">Sent to +254{phoneDigits}</p>
                </div>

                {/* Rose expand button — Verify */}
                <RoseButton loading={loading} loadingText="Verifying…">
                  Verify Code
                </RoseButton>

                <BackButton onClick={() => { setStep(1); setOTP(''); }}>
                  ← Change number
                </BackButton>
              </form>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <form onSubmit={handleCompleteProfile} className="space-y-4">
                {[
                  { key: 'username', label: 'Full Name',      placeholder: 'John Kamau',              required: true  },
                  { key: 'email',    label: 'Email',           placeholder: 'john@example.com',         required: false },
                  { key: 'street',   label: 'Street Address',  placeholder: 'House 15, Gituamba Lane',  required: true  },
                ].map(({ key, label, placeholder, required }) => (
                  <div key={key}>
                    <label className="text-[#0F172A] font-semibold text-sm block mb-2">
                      {label} {required && <span className="text-[#A76059]">*</span>}
                    </label>
                    <input
                      type={key === 'email' ? 'email' : 'text'}
                      value={profile[key]}
                      onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      required={required}
                      autoCapitalize={key === 'email' ? 'none' : 'words'}
                      className={inputCls(key)}
                      onFocus={() => setFocused(key)}
                      onBlur={() => setFocused('')}
                    />
                  </div>
                ))}

                <div className="flex gap-2.5 bg-[#EEEDFE] rounded-xl p-3.5">
                  <span className="flex-shrink-0">ℹ️</span>
                  <p className="text-[#3C3489] text-xs leading-relaxed">
                    Your account is set up as a <strong>resident</strong>. Contact your admin for different access.
                  </p>
                </div>

                <RoseButton loading={loading} loadingText="Saving…">
                  Complete Setup
                </RoseButton>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#94A3B8] mt-6">KCGGRA Gated Community Management</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ROSE EXPAND BUTTON  (SmookyDev style, adapted to navy/gold)
// A small dark point expands to fill the button on hover.
// after: pseudo-element starts at bottom-left, scales up.
// ─────────────────────────────────────────────────────────
function RoseButton({ children, loading, loadingText, type = 'submit', onClick }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="
        relative w-full px-8 py-3.5 z-10
        bg-[#0F172A] rounded-xl
        text-[#FDE9AB] font-bold text-sm tracking-wide
        overflow-hidden
        after:absolute after:h-1 after:w-1
        after:bg-[#1E293B]
        after:left-5 after:bottom-0
        after:translate-y-full after:rounded-full
        after:-z-10
        after:hover:scale-[300]
        after:hover:transition-all after:hover:duration-700
        after:transition-all after:duration-700
        transition-all duration-700
        hover:shadow-lg hover:shadow-[#0F172A]/40
        [text-shadow:0px_1px_3px_rgba(15,23,42,0.5)]
        hover:[text-shadow:0px_1px_4px_rgba(253,233,171,0.8)]
        active:scale-[0.98]
        disabled:opacity-60 disabled:cursor-not-allowed
      "
    >
      <span className="relative flex items-center justify-center gap-2">
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" />{loadingText}</>
          : children}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// SLIDING ARROW BACK BUTTON  (AKAspidey01 style)
// ─────────────────────────────────────────────────────────
function BackButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        relative w-full bg-white border border-[#E2E8F0]
        text-[#0F172A] rounded-xl h-12
        font-semibold text-sm group overflow-hidden
        transition-all duration-300 hover:border-[#0F172A]
      "
    >
      <div className="
        bg-[#0F172A] rounded-lg h-10 w-10
        flex items-center justify-center
        absolute left-1 top-1
        group-hover:w-[calc(100%-8px)] z-10
        transition-all duration-500
      ">
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#FDE9AB]"
          fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </div>
      <span className="relative z-0 translate-x-4 text-[#64748B] group-hover:text-[#94A3B8] transition-colors duration-300">
        {children}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// GOOGLE EXPAND BUTTON  (Mubashir222 circle-expand style)
// ─────────────────────────────────────────────────────────
function GoogleExpandButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        relative w-full flex items-center justify-center gap-2.5
        px-8 py-3.5 overflow-hidden tracking-wide
        text-[#0F172A] bg-white
        border border-[#E2E8F0] rounded-xl
        font-semibold text-sm
        group transition-all duration-300
        hover:border-[#0F172A] hover:shadow-sm
        active:scale-[0.98]
      "
    >
      <span className="
        absolute w-0 h-0 transition-all duration-500 ease-out
        bg-[#F1F5F9] rounded-full
        group-hover:w-[120%] group-hover:h-[400%]
      " />
      <FcGoogle className="text-xl relative z-10 flex-shrink-0" />
      <span className="relative z-10 group-hover:translate-x-0.5 transition-transform duration-200">
        Continue with Google
      </span>
    </button>
  );
}

function Divider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[#E2E8F0]" />
      </div>
      <div className="relative flex justify-center">
        <span className="px-3 bg-white text-[#94A3B8] text-xs">or</span>
      </div>
    </div>
  );
}