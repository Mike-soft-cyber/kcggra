import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import API from '@/api';
import { Button } from '@/components/ui/button';
import { Camera, Edit } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await API.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardLayout><div>Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 text-white mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.username}
                  className="w-24 h-24 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-green-800 flex items-center justify-center text-3xl font-bold">
                  {user?.username?.charAt(0)}
                </div>
              )}
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{user?.username}</h1>
              <p className="text-green-100 mt-1">Resident since {new Date(user?.createdAt).getFullYear()}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {user?.role}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  user?.subStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-500'
                }`}>
                  {user?.subStatus}
                </span>
              </div>
            </div>
            
            <Button
              onClick={() => navigate('/dashboard/settings')}
              variant="outline"
              className="bg-white text-green-600 hover:bg-gray-100"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Profile Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold text-lg mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user?.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{user?.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Street Address</p>
                <p className="font-medium">{user?.street || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold text-lg mb-4">Account Status</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Membership</p>
                <p className="font-medium capitalize">{user?.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subscription</p>
                <p className={`font-medium capitalize ${
                  user?.subStatus === 'paid' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {user?.subStatus}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Payment</p>
                <p className="font-medium">
                  {user?.lastPayment 
                    ? new Date(user.lastPayment).toLocaleDateString()
                    : 'No payments yet'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}