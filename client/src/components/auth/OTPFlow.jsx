import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowBigLeft } from "lucide-react";

export function PhoneInput({ phoneDigits, setPhoneDigits, onSubmit, loading }) {
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 9) {
      setPhoneDigits(value);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-6">
        <Label className="block text-gray-700 font-medium mb-2">
          Phone Number
        </Label>
        <div className="flex items-center gap-2">
          <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-medium text-gray-700">
            +254
          </span>
          <Input
            type="tel"
            value={phoneDigits}
            onChange={handlePhoneChange}
            placeholder="712345678"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            required
            maxLength="9"
            pattern="[0-9]{9}"
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Enter 9 digits (no spaces)
        </p>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Sending...' : 'Send OTP'}
      </Button>
    </form>
  );
}

export function OTPInput({ otp, setOTP, phoneDigits, onSubmit, onBack, loading }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="mb-6">
        <Label className="block text-gray-700 font-medium mb-2">
          Enter OTP
        </Label>
        <Input
          type="text"
          value={otp}
          onChange={(e) => setOTP(e.target.value)}
          placeholder="123456"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-widest"
          required
          maxLength="6"
          pattern="[0-9]{6}"
        />
        <p className="text-sm text-gray-500 mt-1 text-center">
          OTP sent to +254{phoneDigits}
        </p>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 mb-3 font-medium"
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </Button>

      <Button
        type="button"
        onClick={onBack}
        className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2"
      >
        <ArrowBigLeft /> Back
      </Button>
    </form>
  );
}