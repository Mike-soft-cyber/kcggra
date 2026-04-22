import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import PageLoader from '@/components/PageLoader';
import PaymentForm from '@/pages/PaymentForm';
import API from '@/api';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Building2, 
  Download,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Calendar,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export default function Payments() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCapExModal, setShowCapExModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const MONTHLY_SUBSCRIPTION = 5000; // KES 5,000

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, paymentsRes, summaryRes, projectsRes] = await Promise.all([
        API.get('/auth/me'),
        API.get('/payments/my-payments'),
        API.get('/payments/summary'),
        API.get('/projects'), // Get CapEx projects
      ]);

      setUser(userRes.data.user);
      setPayments(paymentsRes.data.payments || []);
      setSummary(summaryRes.data.summary);
      setProjects(projectsRes.data.projects || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (payment) => {
    toast.success('Payment submitted successfully!');
    setShowSubscriptionModal(false);
    setShowCapExModal(false);
    fetchData(); // Refresh data
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'grace':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">✓ Verified</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">⏳ Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">✗ Rejected</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoader message="Loading payments…" />
      </DashboardLayout>
    );
  }

  const subscriptionBalance = summary?.subscription?.balance || 0;
  const totalPaid = summary?.subscription?.total_paid || 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payments & Subscriptions</h1>
              <p className="text-gray-600 mt-1">Manage your monthly subscription and CapEx contributions</p>
            </div>
            <div className={`px-4 py-2 rounded-full ${getStatusColor(user?.subStatus)}`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium capitalize">{user?.subStatus}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Subscription & Payment History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Monthly Subscription</h2>
                  <p className="text-gray-600 text-sm mt-1">Your community contribution</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user?.subStatus)}`}>
                  {user?.subStatus === 'paid' ? '✓ Paid' : user?.subStatus === 'grace' ? '⏰ Grace' : '✗ Unpaid'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/60 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Monthly Fee</p>
                  <p className="text-2xl font-bold text-gray-900">KES 5,000</p>
                </div>
                <div className="bg-white/60 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">KES {totalPaid.toLocaleString()}</p>
                </div>
              </div>

              {/* Balance Warning */}
              {subscriptionBalance > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-800">
                      Balance: KES {subscriptionBalance.toLocaleString()} remaining
                    </p>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    You can pay in installments. Complete payment to maintain full access.
                  </p>
                </div>
              )}

              {/* Progress Bar (for partial payments) */}
              {totalPaid > 0 && totalPaid < MONTHLY_SUBSCRIPTION && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Payment Progress</span>
                    <span className="font-medium text-gray-900">
                      {Math.round((totalPaid / MONTHLY_SUBSCRIPTION) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(totalPaid / MONTHLY_SUBSCRIPTION) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowSubscriptionModal(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {subscriptionBalance > 0 ? 'Pay Balance' : 'Make Payment'}
                </Button>
                {user?.subStatus === 'paid' && (
                  <Button variant="outline">
                    <Receipt className="w-4 h-4 mr-2" />
                    Receipt
                  </Button>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <Tabs defaultValue="all" className="w-full">
                <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                      <p className="text-gray-600 text-sm mt-1">Track all your transactions</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Export to CSV logic
                        toast.success('Export feature coming soon!');
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="subscription">Subscription</TabsTrigger>
                    <TabsTrigger value="capex">CapEx</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="all" className="px-6 pb-6">
                  {payments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="font-medium">No payments yet</p>
                      <p className="text-sm mt-1">Your payment history will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-4">
                      {payments.map((payment) => (
                        <div 
                          key={payment._id}
                          className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              payment.status === 'verified' ? 'bg-green-100' :
                              payment.status === 'pending' ? 'bg-yellow-100' :
                              'bg-red-100'
                            }`}>
                              {payment.payment_type === 'capex' ? (
                                <TrendingUp className={`w-5 h-5 ${
                                  payment.status === 'verified' ? 'text-green-600' :
                                  payment.status === 'pending' ? 'text-yellow-600' :
                                  'text-red-600'
                                }`} />
                              ) : (
                                <CreditCard className={`w-5 h-5 ${
                                  payment.status === 'verified' ? 'text-green-600' :
                                  payment.status === 'pending' ? 'text-yellow-600' :
                                  'text-red-600'
                                }`} />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {payment.payment_type === 'subscription' || payment.payment_type === 'partial_subscription'
                                  ? 'Monthly Subscription' 
                                  : `CapEx: ${payment.project_id?.projectName || 'Project'}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(payment.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                                {' • '}
                                {payment.payment_method === 'mpesa' ? 'M-Pesa' : 
                                 payment.payment_method === 'bank' ? 'Bank Transfer' : 'Cash'}
                              </p>
                              {payment.is_partial && (
                                <p className="text-xs text-orange-600 mt-1">
                                  Partial Payment • Balance: KES {payment.subscription_balance}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              KES {payment.amount.toLocaleString()}
                            </p>
                            {getPaymentStatusBadge(payment.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="subscription" className="px-6 pb-6">
                  <div className="space-y-3 mt-4">
                    {payments.filter(p => p.payment_type === 'subscription' || p.payment_type === 'partial_subscription').length === 0 ? (
                      <p className="text-center py-8 text-gray-500">No subscription payments</p>
                    ) : (
                      payments
                        .filter(p => p.payment_type === 'subscription' || p.payment_type === 'partial_subscription')
                        .map((payment) => (
                          <div 
                            key={payment._id}
                            className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900">Monthly Subscription</p>
                              <p className="text-sm text-gray-600">
                                {new Date(payment.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">KES {payment.amount.toLocaleString()}</p>
                              {getPaymentStatusBadge(payment.status)}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="capex" className="px-6 pb-6">
                  <div className="space-y-3 mt-4">
                    {payments.filter(p => p.payment_type === 'capex').length === 0 ? (
                      <p className="text-center py-8 text-gray-500">No CapEx contributions</p>
                    ) : (
                      payments
                        .filter(p => p.payment_type === 'capex')
                        .map((payment) => (
                          <div 
                            key={payment._id}
                            className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{payment.project_id?.projectName}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(payment.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">KES {payment.amount.toLocaleString()}</p>
                              {getPaymentStatusBadge(payment.status)}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="pending" className="px-6 pb-6">
                  <div className="space-y-3 mt-4">
                    {payments.filter(p => p.status === 'pending').length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                        <p className="font-medium text-gray-900">All caught up!</p>
                        <p className="text-sm text-gray-500 mt-1">No pending payments</p>
                      </div>
                    ) : (
                      payments
                        .filter(p => p.status === 'pending')
                        .map((payment) => (
                          <div 
                            key={payment._id}
                            className="flex items-center justify-between p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-yellow-600" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {payment.payment_type === 'capex' 
                                    ? `CapEx: ${payment.project_id?.projectName}` 
                                    : 'Subscription Payment'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {payment.payment_method === 'bank' && 'Bank transfer awaiting verification'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Submitted: {new Date(payment.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">KES {payment.amount.toLocaleString()}</p>
                              <span className="text-xs text-yellow-700">⏳ Pending Admin Approval</span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column - CapEx Projects */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">CapEx Projects</h2>
              <p className="text-gray-600 text-sm mb-6">Community infrastructure improvements</p>

              {/* CapEx Summary */}
              {summary?.capex && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">Your Total Contributions</p>
                  <p className="text-3xl font-bold text-orange-600">
                    KES {summary.capex.total_contributed.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Across {summary.capex.projects_count} project{summary.capex.projects_count !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No active projects</p>
                  </div>
                ) : (
                  projects.slice(0, 3).map((project) => {
                    const progressPercentage = ((project.currentAmount / project.targetAmount) * 100).toFixed(0);

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

                        <div className="flex justify-between text-sm mb-3">
                          <span className="text-gray-600">
                            KES {(project.currentAmount || 0).toLocaleString()}
                          </span>
                          <span className="text-gray-600">
                            KES {project.targetAmount.toLocaleString()}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setSelectedProject(project);
                            setShowCapExModal(true);
                          }}
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Contribute
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>

              {projects.length > 3 && (
                <Button 
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate('/dashboard/projects')}
                >
                  View All Projects
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ===== MODALS ===== */}

        {/* Subscription Payment Modal */}
        <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pay Subscription</DialogTitle>
              <DialogDescription>
                Monthly fee: KES 5,000 {subscriptionBalance > 0 && `• Balance: KES ${subscriptionBalance}`}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <PaymentForm 
                type="subscription"
                onSuccess={handlePaymentSuccess}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* CapEx Contribution Modal */}
        <Dialog open={showCapExModal} onOpenChange={setShowCapExModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contribute to CapEx</DialogTitle>
              <DialogDescription>
                {selectedProject && `Project: ${selectedProject.projectName}`}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {selectedProject && (
                <PaymentForm 
                  type="capex"
                  projectId={selectedProject._id}
                  onSuccess={handlePaymentSuccess}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}