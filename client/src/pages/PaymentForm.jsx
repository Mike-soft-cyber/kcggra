import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CreditCard, Building2, Loader2, Phone } from 'lucide-react';
import API from '@/api';
import { toast } from 'sonner';

export default function PaymentForm({ type = 'subscription', projectId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [bankSlip, setBankSlip] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [polling, setPolling] = useState(false);
  
  const MONTHLY_SUBSCRIPTION = 5000;
  
  const [formData, setFormData] = useState({
    amount: type === 'subscription' ? MONTHLY_SUBSCRIPTION : '',
    mpesa_phone: '',
    bank_name: '',
    reference_number: '',
    deposit_date: '',
    notes: '',
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large. Max size: 5MB');
        return;
      }
      
      setBankSlip(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // ✅ M-Pesa STK Push
  const handleMpesaPayment = async (e) => {
    e.preventDefault();

    const phone = formData.mpesa_phone.startsWith('254') 
      ? formData.mpesa_phone 
      : `254${formData.mpesa_phone.replace(/^0/, '')}`;

    if (phone.length !== 12) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!formData.amount || formData.amount < 1) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      const response = await API.post('/payments/mpesa/initiate', {
        phone,
        amount: parseInt(formData.amount),
        payment_type: type,
        project_id: projectId,
      });

      toast.success('Check your phone for M-Pesa prompt! 📱');
      
      // Start polling for payment status
      pollPaymentStatus(response.data.payment.checkoutRequestID);
      
    } catch (error) {
      console.error('M-Pesa error:', error);
      toast.error(error.response?.data?.message || 'Payment failed');
      setLoading(false);
    }
  };

  // Poll payment status
  const pollPaymentStatus = (checkoutRequestID) => {
  setPolling(true);
  let attempts = 0;
  const maxAttempts = 24; // 2 minutes (24 * 5 seconds)

  const interval = setInterval(async () => {
    try {
      attempts++;

      const response = await API.get(`/payments/mpesa/status/${checkoutRequestID}`);
      const { payment } = response.data;

      // ✅ SUCCESS
      if (payment.status === 'verified') {
        clearInterval(interval);
        setLoading(false);
        setPolling(false);
        toast.success('Payment successful! 🎉');
        if (onSuccess) onSuccess(payment);
      } 
      // ❌ FAILED
      else if (payment.status === 'failed') {
        clearInterval(interval);
        setLoading(false);
        setPolling(false);
        
        const reason = payment.rejection_reason || 'Payment was not completed';
        
        if (reason.includes('insufficient') || reason.includes('Insufficient')) {
          toast.error('Insufficient funds. Please check your M-Pesa balance.');
        } else if (reason.includes('cancel') || reason.includes('Cancel')) {
          toast.error('Payment cancelled.');
        } else {
          toast.error(`Payment failed: ${reason}`);
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setLoading(false);
        setPolling(false);
        toast.error('Timed out. Please check your payment status.');
      }
    } catch (error) {
      console.error('Poll error:', error);
    }
  }, 5000);
};

  // Bank Payment
  const handleBankPayment = async (e) => {
    e.preventDefault();

    if (!formData.bank_name || !formData.reference_number) {
      toast.error('Please fill in all bank details');
      return;
    }

    if (!bankSlip) {
      toast.error('Please upload bank slip photo');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('payment_type', type);
      
      if (type === 'capex') {
        formDataToSend.append('project_id', projectId);
      }

      formDataToSend.append('bank_name', formData.bank_name);
      formDataToSend.append('reference_number', formData.reference_number);
      formDataToSend.append('deposit_date', formData.deposit_date || new Date().toISOString());
      formDataToSend.append('bank_slip', bankSlip);

      if (formData.notes) {
        formDataToSend.append('notes', formData.notes);
      }

      const response = await API.post('/payments/bank', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(response.data.message);
      
      if (onSuccess) onSuccess(response.data.payment);
      
      // Reset form
      setFormData({
        amount: type === 'subscription' ? MONTHLY_SUBSCRIPTION : '',
        mpesa_phone: '',
        bank_name: '',
        reference_number: '',
        deposit_date: '',
        notes: '',
      });
      setBankSlip(null);
      setPreviewUrl(null);
      
    } catch (error) {
      console.error('Bank payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (paymentMethod === 'mpesa') {
      handleMpesaPayment(e);
    } else {
      handleBankPayment(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount */}
      <div>
        <Label htmlFor="amount">
          Amount (KES) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          value={formData.amount}
          onChange={handleInputChange}
          placeholder={type === 'subscription' ? '5000' : 'Enter amount'}
          min="1"
          required
          className="mt-1"
        />
        {type === 'subscription' && formData.amount < MONTHLY_SUBSCRIPTION && formData.amount > 0 && (
          <p className="text-xs text-orange-600 mt-1">
            ⚠️ Partial payment: Balance KES {MONTHLY_SUBSCRIPTION - formData.amount} remaining
          </p>
        )}
        {type === 'subscription' && (
          <p className="text-xs text-gray-500 mt-1">
            Monthly subscription: KES 5,000. You can pay in parts.
          </p>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <Label>Payment Method <span className="text-red-500">*</span></Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mpesa">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                M-Pesa
              </div>
            </SelectItem>
            <SelectItem value="bank">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Bank Transfer (Requires Verification)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* M-Pesa Fields */}
      {paymentMethod === 'mpesa' && (
        <div>
          <Label htmlFor="mpesa_phone">M-Pesa Phone Number <span className="text-red-500">*</span></Label>
          <div className="flex gap-2 mt-1">
            <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
              +254
            </span>
            <Input
              id="mpesa_phone"
              name="mpesa_phone"
              type="tel"
              value={formData.mpesa_phone}
              onChange={(e) => setFormData({...formData, mpesa_phone: e.target.value.replace(/\D/g, '').slice(0, 9)})}
              placeholder="712345678"
              maxLength={9}
              required
              className="flex-1"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            You'll receive an Mpesa prompt on this number
          </p>
        </div>
      )}

      {/* Bank Fields */}
      {paymentMethod === 'bank' && (
        <>
          <div>
            <Label htmlFor="bank_name">Bank Name <span className="text-red-500">*</span></Label>
            <Select
              value={formData.bank_name}
              onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Equity Bank">Equity Bank</SelectItem>
                <SelectItem value="KCB">KCB</SelectItem>
                <SelectItem value="Co-operative Bank">Co-operative Bank</SelectItem>
                <SelectItem value="Standard Chartered">Standard Chartered</SelectItem>
                <SelectItem value="Barclays">Barclays</SelectItem>
                <SelectItem value="NCBA">NCBA</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reference_number">Reference/Slip Number <span className="text-red-500">*</span></Label>
            <Input
              id="reference_number"
              name="reference_number"
              value={formData.reference_number}
              onChange={handleInputChange}
              placeholder="Bank slip reference number"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="deposit_date">Deposit Date</Label>
            <Input
              id="deposit_date"
              name="deposit_date"
              type="date"
              value={formData.deposit_date}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              className="mt-1"
            />
          </div>

          {/* Bank Slip Upload */}
          <div>
            <Label htmlFor="bank_slip">Upload Bank Slip <span className="text-red-500">*</span></Label>
            <div className="mt-1">
              <label
                htmlFor="bank_slip"
                className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition"
              >
                <div className="text-center">
                  {previewUrl ? (
                    <div>
                      <img
                        src={previewUrl}
                        alt="Bank slip preview"
                        className="max-h-40 mx-auto mb-2 rounded"
                      />
                      <p className="text-sm text-green-600">✓ Bank slip uploaded</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Click to upload bank slip photo
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG or PDF up to 5MB
                      </p>
                    </>
                  )}
                </div>
              </label>
              <input
                id="bank_slip"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                required
              />
            </div>
          </div>
        </>
      )}

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows="3"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Any additional information..."
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading || polling}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {loading || polling ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {polling ? 'Waiting for payment...' : 'Processing...'}
          </span>
        ) : (
          `${paymentMethod === 'mpesa' ? 'Send' : 'Submit Payment'} - KES ${formData.amount}`
        )}
      </Button>

      {paymentMethod === 'mpesa' && (
        <p className="text-xs text-gray-500 text-center">
          You'll receive a prompt on your phone. Enter M-Pesa PIN to complete.
        </p>
      )}

      {paymentMethod === 'bank' && (
        <p className="text-xs text-gray-500 text-center">
          Your payment will be verified by admin within 24 hours
        </p>
      )}
    </form>
  );
}