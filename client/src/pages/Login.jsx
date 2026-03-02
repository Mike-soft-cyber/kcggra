import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import API from "@/api";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from 'react-icons/fc';
import { PhoneInput, OTPInput } from "@/components/auth/OTPFlow";

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: phone, 2: OTP
  const [loading, setLoading] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otp, setOTP] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    
    const fullPhone = `254${phoneDigits}`;
    
    if (phoneDigits.length !== 9) {
      toast.error('Please enter 9 digits');
      return;
    }

    setLoading(true);
    
    try {
      const response = await API.post('/auth/request-otp', { phone: fullPhone });
      toast.success(response.data.message);
      
      if (response.data.otp) {
        toast.success(`Dev OTP: ${response.data.otp}`, { duration: 10000 });
      }
      
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
  e.preventDefault();
  
  if (!otp || otp.length !== 6) {
    toast.error('Please enter a valid 6-digit OTP');
    return;
  }

  setLoading(true);

  try {
    const response = await API.post('/auth/verify-otp', {
      phone: `254${phoneDigits}`,
      otp,
    });

    toast.success('Login successful!');

    const userRole = response.data.user.role;
    
    if (userRole === 'admin') {
      navigate('/admin/dashboard');
    } else if (userRole === 'guard') {
      navigate('/guard/dashboard');
    } else {
      navigate('/dashboard');
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Verification failed');
  } finally {
    setLoading(false);
  }
};

  const handleGoogleLogin = () => {
    const BACKEND_URL = 'http://localhost:5000';
    window.location.href = `${BACKEND_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className='text-center'>{step === 1 ? 'Login' : 'Verify OTP'}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <>
              <PhoneInput
                phoneDigits={phoneDigits}
                setPhoneDigits={setPhoneDigits}
                onSubmit={handleRequestOTP}
                loading={loading}
              />

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <FcGoogle className="text-xl" /> Continue with Google
              </Button>

              <p className="text-center text-sm text-gray-600 mt-4">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="text-green-600 hover:text-green-700 font-medium underline"
                >
                  Sign up
                </button>
              </p>
            </>
          )}

          {step === 2 && (
            <OTPInput
              otp={otp}
              setOTP={setOTP}
              phoneDigits={phoneDigits}
              onSubmit={handleVerifyOTP}
              onBack={() => setStep(1)}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}