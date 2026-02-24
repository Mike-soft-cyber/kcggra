import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, Phone, Mail } from 'lucide-react';

export default function SubscriptionRequired({ user }) {
  const navigate = useNavigate();

  const daysOverdue = calculateDaysOverdue(user?.lastPayment);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Subscription Payment Required
          </h1>

          <p className="text-gray-600 mb-6">
            Your KCGGRA subscription is {daysOverdue > 0 ? `${daysOverdue} days overdue` : 'unpaid'}. 
            Please make a payment to continue accessing the portal.
          </p>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Details:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Amount:</strong> KES 5,000 / month</p>
              <p><strong>M-Pesa Paybill:</strong> 247247</p>
              <p><strong>Account:</strong> {user?.phone}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/dashboard/payments')}
              className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Make Payment
            </Button>

            <p className="text-xs text-gray-500">
              Already paid? Your payment will be confirmed within 5 minutes.
            </p>
          </div>

          {/* Contact Support */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Need help?</p>
            <div className="flex justify-center gap-4">
              <a
                href="tel:+254700000000"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <Phone className="w-4 h-4" />
                Call Us
              </a>
              <a
                href="mailto:treasurer@kcggra.com"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <Mail className="w-4 h-4" />
                Email
              </a>
            </div>
          </div>
        </div>

        {/* Info */}
        <p className="text-center text-xs text-gray-500 mt-4">
          If you've made a payment recently, please wait a few minutes for confirmation.
        </p>
      </div>
    </div>
  );
}

function calculateDaysOverdue(lastPayment) {
  if (!lastPayment) return 365;
  
  const daysSincePayment = (Date.now() - new Date(lastPayment)) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.floor(daysSincePayment - 30));
}