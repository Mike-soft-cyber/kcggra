import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import API from '@/api';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye, Download } from 'lucide-react';

export default function AdminPaymentVerification() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const response = await API.get('/payments/pending');
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Failed to fetch pending payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId, status, reason = '') => {
    setVerifying(true);
    try {
      await API.patch(`/payments/${paymentId}/verify`, {
        status,
        rejection_reason: reason,
      });

      toast.success(`Payment ${status === 'verified' ? 'approved' : 'rejected'}`);
      
      // Remove from list
      setPayments(payments.filter(p => p._id !== paymentId));
      setShowModal(false);
      setSelectedPayment(null);
    } catch (error) {
      toast.error('Failed to update payment');
    } finally {
      setVerifying(false);
    }
  };

  const openModal = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Verification</h1>
          <p className="text-gray-600 mt-1">
            {payments.length} payment{payments.length !== 1 ? 's' : ''} pending verification
          </p>
        </div>

        {/* Payments List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">No pending payments to verify</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <div key={payment._id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* User Info */}
                      <div className="mb-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          {payment.user_id.username}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {payment.user_id.phone} • {payment.user_id.street}
                        </p>
                      </div>

                      {/* Payment Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Type</p>
                          <p className="font-medium capitalize">
                            {payment.payment_type.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className="font-bold text-green-600">
                            KES {payment.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Bank</p>
                          <p className="font-medium">{payment.bank_details.bank_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Reference</p>
                          <p className="font-medium">{payment.bank_details.reference_number}</p>
                        </div>
                      </div>

                      {/* Project Name (if CapEx) */}
                      {payment.project_id && (
                        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>CapEx Project:</strong> {payment.project_id.projectName}
                          </p>
                        </div>
                      )}

                      {/* Notes */}
                      {payment.notes && (
                        <div className="mt-3 p-2 bg-gray-100 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Notes:</strong> {payment.notes}
                          </p>
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className="text-xs text-gray-500 mt-3">
                        Submitted: {new Date(payment.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        onClick={() => openModal(payment)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Slip
                      </Button>

                      <Button
                        onClick={() => handleVerify(payment._id, 'verified')}
                        disabled={verifying}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </Button>

                      <Button
                        onClick={() => {
                          const reason = prompt('Rejection reason:');
                          if (reason) handleVerify(payment._id, 'rejected', reason);
                        }}
                        disabled={verifying}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal for Bank Slip Preview */}
        {showModal && selectedPayment && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Bank Slip</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Payment Info */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>User:</strong> {selectedPayment.user_id.username} ({selectedPayment.user_id.phone})
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Amount:</strong> KES {selectedPayment.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Bank:</strong> {selectedPayment.bank_details.bank_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Reference:</strong> {selectedPayment.bank_details.reference_number}
                  </p>
                </div>

                {/* Bank Slip Image */}
                {selectedPayment.bank_slip_photo && (
                  <div className="mb-4">
                    <img
                      src={selectedPayment.bank_slip_photo}
                      alt="Bank slip"
                      className="w-full rounded-lg border border-gray-200"
                    />
                    <a
                      href={selectedPayment.bank_slip_photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Download className="w-4 h-4" />
                      Download Full Resolution
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleVerify(selectedPayment._id, 'verified')}
                    disabled={verifying}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Payment
                  </Button>

                  <Button
                    onClick={() => {
                      const reason = prompt('Rejection reason:');
                      if (reason) handleVerify(selectedPayment._id, 'rejected', reason);
                    }}
                    disabled={verifying}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Payment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}