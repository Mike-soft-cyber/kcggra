import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import API from '@/api';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  Download,
  CheckCircle2,
  Clock,
  TrendingUp,
  X,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Payments() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Modals
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  
  const [selectedProject, setSelectedProject] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, paymentsRes, projectsRes] = await Promise.all([
        API.get('/auth/me'),
        API.get('/payments/history'),
        API.get('/payments/projects'),
      ]);

      setUser(userRes.data.user);
      setPayments(paymentsRes.data.payments || []);
      setProjects(projectsRes.data.projects || []);
      setMpesaPhone(userRes.data.user.phone?.replace('254', '') || '');
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Main subscription payment handler
  const handlePaySubscription = async (method = 'mpesa') => {
    if (method === 'mpesa') {
      setShowPaymentMethodModal(false);
      setShowMpesaModal(true);
    } else if (method === 'bank') {
      setShowPaymentMethodModal(false);
      setShowBankModal(true);
    } else if (method === 'card') {
      setShowPaymentMethodModal(false);
      setShowCardModal(true);
    }
  };

  // ✅ M-Pesa STK Push
  const handleMpesaPayment = async () => {
    const fullPhone = mpesaPhone.startsWith('254') ? mpesaPhone : `254${mpesaPhone.replace(/^0/, '')}`;
    
    if (fullPhone.length !== 12) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setPaymentLoading(true);
    try {
      const response = await API.post('/payments/subscribe', {
        phone: fullPhone,
      });

      toast.success('Payment request sent! Check your phone for M-Pesa prompt.');
      setShowMpesaModal(false);
      
      // Poll for payment status
      pollPaymentStatus(response.data.payment.checkoutRequestID);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  // ✅ Donation handler
  const handleDonateToProject = async () => {
    if (!donationAmount || donationAmount < 100) {
      toast.error('Minimum donation is KES 100');
      return;
    }

    setPaymentLoading(true);
    try {
      const response = await API.post('/payments/donate-project', {
        phone: user.phone,
        amount: parseInt(donationAmount),
        projectName: selectedProject.projectName,
      });

      toast.success('Donation request sent! Check your phone.');
      setShowDonateModal(false);
      setDonationAmount('');
      
      pollPaymentStatus(response.data.payment.checkoutRequestID);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Donation failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  // ✅ Poll payment status
  const pollPaymentStatus = (checkoutRequestID) => {
    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(async () => {
      try {
        const response = await API.get(`/payments/check-status/${checkoutRequestID}`);
        const payment = response.data.payment;

        if (payment.status === 'completed') {
          clearInterval(interval);
          toast.success('Payment successful! 🎉');
          fetchData(); // Refresh data
        } else if (payment.status === 'failed') {
          clearInterval(interval);
          toast.error('Payment failed. Please try again.');
        }

        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          toast.error('Payment check timed out. Please refresh.');
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 2000);
  };

  // ✅ Export payment history
  const exportPaymentHistory = () => {
    const headers = ['Date', 'Description', 'Amount', 'Transaction ID', 'Status'];
    const rows = payments.map(p => [
      new Date(p.createdAt).toLocaleDateString(),
      p.payment_type === 'subscription' ? `Annual Subscription - ${p.month_year}` : 'Project Donation',
      `KES ${p.amount.toLocaleString()}`,
      p.mpesa_receipt || p.transaction_id,
      p.status.toUpperCase(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KCGGRA_Payment_History_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ✅ Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payments & Subscriptions</h1>
              <p className="text-gray-600 mt-1">Manage your community subscription and contributions</p>
            </div>
            <div className={`px-4 py-2 rounded-full ${
              user?.subStatus === 'paid' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium capitalize">{user?.subStatus}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Subscription & Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Annual Subscription 2024</h2>
                  <p className="text-gray-600 text-sm mt-1">Your yearly community contribution</p>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-gray-900">KES 60,000</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user?.subStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      {user?.subStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                    <span className="text-sm text-gray-500">Due: December 31, 2024</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {user?.subStatus === 'paid' ? (
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      View Receipt
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setShowPaymentMethodModal(true)}
                      disabled={paymentLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {paymentLoading ? 'Processing...' : 'Pay Now'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Methods</h2>
              <p className="text-gray-600 text-sm mb-6">Choose your preferred payment option</p>

              <div className="space-y-3">
                {/* M-Pesa */}
                <button
                  onClick={() => handlePaySubscription('mpesa')}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition">
                      <Smartphone className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">M-Pesa</p>
                      <p className="text-sm text-gray-600">Pay via Paybill 123456</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Bank Transfer */}
                <button
                  onClick={() => handlePaySubscription('bank')}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Bank Transfer</p>
                      <p className="text-sm text-gray-600">KCGGRA Account - KCB</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Card Payment */}
                <button
                  onClick={() => handlePaySubscription('card')}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition">
                      <CreditCard className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Card Payment</p>
                      <p className="text-sm text-gray-600">Visa, Mastercard accepted</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                  <p className="text-gray-600 text-sm mt-1">Your recent transactions</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportPaymentHistory}
                  disabled={payments.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No payment history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 10).map((payment) => (
                    <div 
                      key={payment._id}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          payment.status === 'completed' ? 'bg-green-100' :
                          payment.status === 'pending' ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          <CheckCircle2 className={`w-5 h-5 ${
                            payment.status === 'completed' ? 'text-green-600' :
                            payment.status === 'pending' ? 'text-yellow-600' :
                            'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.payment_type === 'subscription' 
                              ? 'Annual Subscription' 
                              : 'Project Donation'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(payment.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {payment.mpesa_receipt || payment.transaction_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          KES {payment.amount.toLocaleString()}
                        </p>
                        <p className={`text-xs capitalize ${
                          payment.status === 'completed' ? 'text-green-600' :
                          payment.status === 'pending' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {payment.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - CapEx Projects */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">CapEx Projects</h2>
              <p className="text-gray-600 text-sm mb-6">Community infrastructure improvements</p>

              <div className="space-y-6">
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No active projects</p>
                  </div>
                ) : (
                  projects.map((project) => {
                    const progressPercentage = project.progress_percentage || 
                      ((project.currentAmount / project.targetAmount) * 100).toFixed(0);

                    return (
                      <div key={project._id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xl">
                              {project.projectName.includes('Gate') ? '🚪' :
                               project.projectName.includes('Light') ? '💡' :
                               project.projectName.includes('Fence') ? '🛡️' : '🏗️'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {project.projectName}
                            </h3>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-2xl font-bold text-gray-900">
                                {progressPercentage}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-orange-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            KES {(project.currentAmount || 0).toLocaleString()}
                          </span>
                          <span className="text-gray-600">
                            KES {project.targetAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <Button 
                className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                onClick={() => {
                  if (projects.length > 0) {
                    setSelectedProject(projects[0]);
                    setShowDonateModal(true);
                  }
                }}
                disabled={projects.length === 0}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Contribute to CapEx
              </Button>
            </div>
          </div>
        </div>

        {/* ===== MODALS ===== */}

        {/* Payment Method Selection Modal */}
        <Dialog open={showPaymentMethodModal} onOpenChange={setShowPaymentMethodModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Payment Method</DialogTitle>
              <DialogDescription>
                Select how you'd like to pay your annual subscription of KES 60,000
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <button
                onClick={() => handlePaySubscription('mpesa')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
              >
                <Smartphone className="w-8 h-8 text-green-600" />
                <div className="text-left flex-1">
                  <p className="font-medium text-gray-900">M-Pesa</p>
                  <p className="text-sm text-gray-600">Instant payment via STK Push</p>
                </div>
              </button>

              <button
                onClick={() => handlePaySubscription('bank')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <Building2 className="w-8 h-8 text-blue-600" />
                <div className="text-left flex-1">
                  <p className="font-medium text-gray-900">Bank Transfer</p>
                  <p className="text-sm text-gray-600">Transfer to KCGGRA account</p>
                </div>
              </button>

              <button
                onClick={() => handlePaySubscription('card')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition"
              >
                <CreditCard className="w-8 h-8 text-orange-600" />
                <div className="text-left flex-1">
                  <p className="font-medium text-gray-900">Card Payment</p>
                  <p className="text-sm text-gray-600">Visa, Mastercard</p>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* M-Pesa Payment Modal */}
        <Dialog open={showMpesaModal} onOpenChange={setShowMpesaModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pay with M-Pesa</DialogTitle>
              <DialogDescription>
                You'll receive an STK Push prompt on your phone
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-bold text-green-900 text-lg">KES 60,000</p>
                <p className="text-sm text-green-700">Annual Subscription 2024</p>
              </div>

              <div>
                <Label>M-Pesa Phone Number</Label>
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                    +254
                  </span>
                  <Input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="712345678"
                    maxLength={9}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the number that will receive the payment prompt
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> You'll receive a prompt on your phone. Enter your M-Pesa PIN to complete the payment.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMpesaModal(false)}
                disabled={paymentLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMpesaPayment}
                disabled={paymentLoading || mpesaPhone.length !== 9}
                className="bg-green-600 hover:bg-green-700"
              >
                {paymentLoading ? 'Sending...' : 'Send Payment Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bank Transfer Modal */}
        <Dialog open={showBankModal} onOpenChange={setShowBankModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Bank Transfer Details</DialogTitle>
              <DialogDescription>
                Transfer KES 60,000 to the account below
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-blue-700">Bank Name</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-blue-900">Kenya Commercial Bank (KCB)</p>
                    <button
                      onClick={() => copyToClipboard('Kenya Commercial Bank')}
                      className="p-1 hover:bg-blue-100 rounded"
                    >
                      <Copy className="w-4 h-4 text-blue-700" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-blue-700">Account Name</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-blue-900">KCGGRA</p>
                    <button
                      onClick={() => copyToClipboard('KCGGRA')}
                      className="p-1 hover:bg-blue-100 rounded"
                    >
                      <Copy className="w-4 h-4 text-blue-700" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-blue-700">Account Number</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-blue-900">1234567890</p>
                    <button
                      onClick={() => copyToClipboard('1234567890')}
                      className="p-1 hover:bg-blue-100 rounded"
                    >
                      <Copy className="w-4 h-4 text-blue-700" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-blue-700">Amount</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-blue-900">KES 60,000</p>
                    <button
                      onClick={() => copyToClipboard('60000')}
                      className="p-1 hover:bg-blue-100 rounded"
                    >
                      <Copy className="w-4 h-4 text-blue-700" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Important:</strong> After making the transfer, please send the confirmation SMS/receipt to the admin for verification.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowBankModal(false)}
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Card Payment Modal */}
        <Dialog open={showCardModal} onOpenChange={setShowCardModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Card Payment</DialogTitle>
              <DialogDescription>
                Pay with Visa or Mastercard
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <CreditCard className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                <p className="font-bold text-orange-900 text-lg mb-2">KES 60,000</p>
                <p className="text-sm text-orange-700">Annual Subscription 2024</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-800 mb-3">
                  Card payments are processed securely through our payment partner.
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Proceed to Payment Gateway
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                You'll be redirected to a secure payment page
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCardModal(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Donation Modal */}
        <Dialog open={showDonateModal} onOpenChange={setShowDonateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contribute to CapEx Fund</DialogTitle>
              <DialogDescription>
                Support community infrastructure projects. Every contribution counts!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label className="mb-2 block">Amount (KES)</Label>
                <Input
                  type="number"
                  min="100"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="Enter amount (min. KES 100)"
                />
              </div>

              {selectedProject && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Contributing to: {selectedProject.projectName}
                  </p>
                  <p className="text-xs text-blue-700">
                    Current: KES {(selectedProject.currentAmount || 0).toLocaleString()} / 
                    Target: KES {selectedProject.targetAmount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDonateModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDonateToProject}
                disabled={paymentLoading || !donationAmount || donationAmount < 100}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {paymentLoading ? 'Processing...' : 'Donate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}