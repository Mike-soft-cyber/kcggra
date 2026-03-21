import { useState, useEffect } from 'react';
import API from '@/api';
import {toast} from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

export default function CapExProgress() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await API.get('/projects');
      setProjects(response.data.projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const getProjectIcon = (projectName) => {
    const name = projectName.toLowerCase();
    if (name.includes('gate')) return '🚪';
    if (name.includes('solar') || name.includes('light')) return '☀️';
    if (name.includes('fence') || name.includes('perimeter')) return '🔒';
    if (name.includes('security')) return '🛡️';
    if (name.includes('water')) return '💧';
    if (name.includes('road')) return '🛣️';
    return '📋';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'from-green-500 to-green-600';
    if (percentage >= 50) return 'from-blue-500 to-blue-600';
    if (percentage >= 25) return 'from-yellow-500 to-yellow-600';
    return 'from-orange-500 to-orange-600';
  };

  const handleDonate = (project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const submitDonation = async () => {
    if (!donationAmount || donationAmount < 100) {
      toast.error('Minimum donation is KES 100');
      return;
    }

    setLoading(true);

    try {
      const response = await API.post('/payments/donate-project', {
        amount: parseInt(donationAmount),
        projectName: selectedProject.projectName,
      });

      toast.success('Donation request sent! Check your phone.');
      setShowModal(false);
      setDonationAmount('');

      // Poll for payment status
      pollPaymentStatus(response.data.payment.checkoutRequestID);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Donation failed');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = (checkoutRequestID) => {
    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/payments/check-status/${checkoutRequestID}`);
        const payment = response.data.payment;

        if (payment.status === 'completed') {
          clearInterval(interval);
          toast.success('Donation successful! 🎉');
          fetchProjects(); // Refresh projects
        } else if (payment.status === 'failed') {
          clearInterval(interval);
          toast.error('Donation failed');
        }

        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div>
        <Card>
            <CardHeader>
                <CardTitle>
                    <h2 className="text-xl font-bold text-gray-800">CapEx Progress</h2>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No active projects</p>
            </div>
          ) : (
            projects.map((project) => {
              const progressPercentage = ((project.currentAmount / project.targetAmount) * 100).toFixed(0);

              return (
                <div key={project._id} className="border-b pb-4 last:border-0">
                  {/* Project Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{getProjectIcon(project.projectName)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-gray-800">{project.projectName}</h3>
                        <span className="text-sm font-bold text-gray-700">{progressPercentage}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getProgressColor(progressPercentage)} transition-all duration-500`}
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Amount Details */}
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-600">
                      KES {project.currentAmount?.toLocaleString() || 0}
                    </span>
                    <span className="text-gray-600">
                      KES {project.targetAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Contribute Button */}
                  <Button
                    onClick={() => handleDonate(project)}
                    className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                  >
                    Contribute
                  </Button>
                </div>
              );
            })
          )}

          {/* Donation Modal */}
      {showModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">{getProjectIcon(selectedProject.projectName)}</span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Contribute to {selectedProject.projectName}
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Current Progress</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">
                    KES {selectedProject.currentAmount?.toLocaleString() || 0}
                  </span>
                  <span className="text-sm text-gray-600">
                    / KES {selectedProject.targetAmount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min(((selectedProject.currentAmount || 0) / selectedProject.targetAmount) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Donation Amount (KES)
              </label>
              <Input
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="Enter amount (min. 100)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="100"
              />

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[500, 1000, 2000, 5000].map(amount => (
                  <Button
                    key={amount}
                    onClick={() => setDonationAmount(amount.toString())}
                    className="py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={submitDonation}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 font-medium"
              >
                {loading ? 'Processing...' : 'Donate'}
              </Button>
              <Button
                onClick={() => {
                  setShowModal(false);
                  setDonationAmount('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
            </CardContent>
        </Card>
    </div>
  )
}