import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CreditCard, Building2, Loader2 } from 'lucide-react';
import API from '@/api';
import { toast } from 'sonner';

export default function PaymentForm({ type = 'subscription', projectId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [bankSlip, setBankSlip] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const MONTHLY_SUBSCRIPTION = 5000;
  
  const [formData, setFormData] = useState({
    amount: type === 'subscription' ? MONTHLY_SUBSCRIPTION : '',
    mpesa_receipt: '',
    mpesa_phone: '',
    bank_name: '',
    account_number: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (paymentMethod === 'mpesa' && !formData.mpesa_receipt) {
      toast.error('Please enter M-Pesa receipt number');
      return;
    }

    if (paymentMethod === 'bank') {
      if (!formData.bank_name || !formData.reference_number) {
        toast.error('Please fill in all bank details');
        return;
      }
      if (!bankSlip) {
        toast.error('Please upload bank slip photo');
        return;
      }
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('payment_method', paymentMethod);
      
      if (type === 'capex') {
        formDataToSend.append('project_id', projectId);
      }

      // M-Pesa fields
      if (paymentMethod === 'mpesa') {
        formDataToSend.append('mpesa_receipt', formData.mpesa_receipt);
        formDataToSend.append('mpesa_phone', formData.mpesa_phone);
      }

      // Bank fields
      if (paymentMethod === 'bank') {
        formDataToSend.append('bank_name', formData.bank_name);
        formDataToSend.append('account_number', formData.account_number || '');
        formDataToSend.append('reference_number', formData.reference_number);
        formDataToSend.append('deposit_date', formData.deposit_date || new Date().toISOString());
        formDataToSend.append('bank_slip', bankSlip);
      }

      if (formData.notes) {
        formDataToSend.append('notes', formData.notes);
      }

      // Send to appropriate endpoint
      const endpoint = type === 'capex' ? '/payments/capex' : '/payments/subscription';
      const response = await API.post(endpoint, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(response.data.message);
      
      if (onSuccess) onSuccess(response.data.payment);
      
      // Reset form
      setFormData({
        amount: type === 'subscription' ? MONTHLY_SUBSCRIPTION : '',
        mpesa_receipt: '',
        mpesa_phone: '',
        bank_name: '',
        account_number: '',
        reference_number: '',
        deposit_date: '',
        notes: '',
      });
      setBankSlip(null);
      setPreviewUrl(null);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
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
        {type === 'subscription' && formData.amount < MONTHLY_SUBSCRIPTION && (
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
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mpesa">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                M-Pesa (Instant Verification)
              </div>
            </SelectItem>
            <SelectItem value="bank">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Bank Deposit (Requires Verification)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* M-Pesa Fields */}
      {paymentMethod === 'mpesa' && (
        <>
          <div>
            <Label htmlFor="mpesa_receipt">M-Pesa Receipt Number <span className="text-red-500">*</span></Label>
            <Input
              id="mpesa_receipt"
              name="mpesa_receipt"
              value={formData.mpesa_receipt}
              onChange={handleInputChange}
              placeholder="e.g., RGX1234ABCD"
              required
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Paybill: 247247 | Account: Your phone number
            </p>
          </div>

          <div>
            <Label htmlFor="mpesa_phone">M-Pesa Phone Number</Label>
            <Input
              id="mpesa_phone"
              name="mpesa_phone"
              value={formData.mpesa_phone}
              onChange={handleInputChange}
              placeholder="254712345678"
              className="mt-1"
            />
          </div>
        </>
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
              <SelectTrigger className="mt-1">
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
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </span>
        ) : (
          `Submit Payment - KES ${formData.amount}`
        )}
      </Button>

      {paymentMethod === 'bank' && (
        <p className="text-xs text-gray-500 text-center">
          Your payment will be verified by admin within 24 hours
        </p>
      )}
    </form>
  );
}