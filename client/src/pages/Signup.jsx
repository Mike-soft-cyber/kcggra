import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import API from "@/api";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, Shield, Users, UserCircle } from "lucide-react";
import { FcGoogle } from 'react-icons/fc';
import { PhoneInput, OTPInput } from "@/components/auth/OTPFlow";

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otp, setOTP] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'resident',
    street: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

      // Check if new user (needs profile completion)
      if (response.data.user.username.startsWith('User_')) {
        setStep(3);
        toast.success('OTP verified! Please complete your profile.');
      } else {
        toast.success('Welcome back! Redirecting...');
        
        if (response.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (response.data.user.role === 'guard') {
          navigate('/guard/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.street || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      await API.patch('/auth/update-profile', {
        username: formData.username,
        street: formData.street,
        email: formData.email,
        role: formData.role
      });

      toast.success('Profile updated successfully!');
      
      if (formData.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (formData.role === 'guard') {
        navigate('/guard/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const BACKEND_URL = 'http://localhost:5000';
    window.location.href = `${BACKEND_URL}/auth/google?role=${formData.role}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {step === 1 && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className='text-center'>Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
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
              onClick={handleGoogleSignup}
              className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <FcGoogle className="text-xl" /> Continue with Google
            </Button>

            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-green-600 hover:text-green-700 font-medium underline"
              >
                Login
              </button>
            </p>
          </CardContent>
        </Card>
      )}
      
      {step === 2 && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Verify OTP</CardTitle>
          </CardHeader>
          <CardContent>
            <OTPInput
              otp={otp}
              setOTP={setOTP}
              phoneDigits={phoneDigits}
              onSubmit={handleVerifyOTP}
              onBack={() => setStep(1)}
              loading={loading}
            />
          </CardContent>
        </Card>
      )}
      
      {step === 3 && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Complete Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCompleteProfile} className="space-y-4">
              {/* Full Name */}
              <div>
                <Label htmlFor="username">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  onChange={handleInputChange}
                  value={formData.username}
                  placeholder="John Kamau"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  onChange={handleInputChange}
                  value={formData.email}
                  placeholder="john@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="role">Select Your Role <span className="text-red-500">*</span></Label>
                <Select
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  value={formData.role}
                  disabled={loading}
                >
                  <SelectTrigger className='w-full mt-1'>
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="resident">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <div>
                            <p className="font-medium">Resident</p>
                            <p className="text-xs text-gray-500">Community member</p>
                          </div>
                        </div>
                      </SelectItem>
                      
                      <SelectItem value="guard">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <div>
                            <p className="font-medium">Security Guard</p>
                            <p className="text-xs text-gray-500">Security personnel</p>
                          </div>
                        </div>
                      </SelectItem>
                      
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <UserCircle className="w-4 h-4" />
                          <div>
                            <p className="font-medium">Administrator</p>
                            <p className="text-xs text-gray-500">Portal admin access</p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="street">Street Address <span className="text-red-500">*</span></Label>
                <Input
                  id="street"
                  name="street"
                  type="text"
                  onChange={handleInputChange}
                  value={formData.street}
                  placeholder="House 15, Gituamba Lane"
                  disabled={loading}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" />
                    <span>Completing...</span>
                  </span>
                ) : (
                  'Complete Signup'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}