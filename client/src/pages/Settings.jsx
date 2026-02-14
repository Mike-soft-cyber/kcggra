import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/api';
import { toast } from 'sonner';
import { 
  User, 
  Bell, 
  Shield, 
  Users, 
  Camera,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import DashboardLayout from '@/components/DashboardLayout';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate()
  
  // Profile data
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone: '',
    street: '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    security_alerts: true,
    payment_reminders: true,
    community_updates: true,
    sms_notifications: false,
  });

  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Proxy account
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [proxyData, setProxyData] = useState({
    proxy_username: '',
    proxy_phone: '',
    relationship: 'Mother',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await API.get('/auth/me');
      const userData = response.data.user;
      
      setUser(userData);
      setProfileData({
        username: userData.username || '',
        email: userData.email || '',
        phone: userData.phone || '',
        street: userData.street || '',
      });
      setNotifications(userData.notification_preferences || notifications);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await API.patch('/user/profile', profileData);
      toast.success('Profile updated successfully!');
      fetchUserData();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = async (key) => {
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key],
    };
    
    setNotifications(newNotifications);
    
    try {
      await API.patch('/user/notifications', newNotifications);
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
      // Revert on error
      setNotifications(notifications);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await API.post('/user/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleSignOutAll = async () => {
    if (!confirm('Sign out of all devices? You will need to log in again.')) return;

    try {
      await API.post('/user/signout-all');
      toast.success('Signed out of all devices');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleAddProxy = async () => {
    try {
      await API.post('/user/proxy', proxyData);
      toast.success('Proxy account added successfully!');
      setShowProxyModal(false);
      setProxyData({
        proxy_username: '',
        proxy_phone: '',
        relationship: 'Mother',
      });
      fetchUserData();
    } catch (error) {
      toast.error('Failed to add proxy account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Proxy */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
              </div>
              <p className="text-gray-600 text-sm mb-6">Update your personal details</p>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
  {user?.profilePic ? (
    <img
      src={user.profilePic}
      alt={user.username}
      className="w-20 h-20 rounded-full object-cover"
    />
  ) : (
    <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
      {getInitials(user?.username)}
    </div>
  )}
  <button className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition">
    <Camera className="w-4 h-4" />
  </button>
</div>
                <div>
                  <p className="font-bold text-gray-900">{user?.username}</p>
                  <p className="text-sm text-gray-600">Resident since {new Date(user?.createdAt).getFullYear()}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Active Member
                  </span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label className="mb-2 block">Full Name</Label>
                  <Input
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    placeholder="James Kariuki"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Phone Number</Label>
                  <div className="relative">
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+254 7XX XXX XXX"
                      className="pl-10"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📱</span>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Email Address</Label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="james@example.com"
                      className="pl-10"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Street Address</Label>
                  <div className="relative">
                    <Input
                      value={profileData.street}
                      onChange={(e) => setProfileData({ ...profileData, street: e.target.value })}
                      placeholder="House 15, Gituamba Lane"
                      className="pl-10"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📍</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            {/* Proxy Accounts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">Proxy Accounts</h2>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Manage accounts for elderly family members who need assistance accessing the portal
              </p>

              {/* Existing Proxy */}
              {user?.proxy_user_id && (
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                      MK
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Mary Kariuki</p>
                      <p className="text-sm text-gray-600">Mother • +254 7XX XXX 001</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              )}

              {/* Add Proxy Button */}
              <Dialog open={showProxyModal} onOpenChange={setShowProxyModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Add Proxy Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Proxy Account</DialogTitle>
                    <DialogDescription>
                      Create an account for an elderly family member
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        value={proxyData.proxy_username}
                        onChange={(e) => setProxyData({ ...proxyData, proxy_username: e.target.value })}
                        placeholder="Mary Kariuki"
                      />
                    </div>

                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        value={proxyData.proxy_phone}
                        onChange={(e) => setProxyData({ ...proxyData, proxy_phone: e.target.value })}
                        placeholder="254712345678"
                      />
                    </div>

                    <div>
                      <Label>Relationship</Label>
                      <Input
                        value={proxyData.relationship}
                        onChange={(e) => setProxyData({ ...proxyData, relationship: e.target.value })}
                        placeholder="Mother, Father, etc."
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowProxyModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddProxy} className="bg-green-600 hover:bg-green-700">
                      Add Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
              <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
              
              <Button 
                variant="outline" 
                onClick={handleSignOutAll}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out of All Devices
              </Button>
            </div>
          </div>

          {/* Right Column - Notifications & Security */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Security Alerts</p>
                    <p className="text-sm text-gray-600">Emergency notifications</p>
                  </div>
                  <Switch
                    checked={notifications.security_alerts}
                    onCheckedChange={() => handleToggleNotification('security_alerts')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Payment Reminders</p>
                    <p className="text-sm text-gray-600">Subscription due dates</p>
                  </div>
                  <Switch
                    checked={notifications.payment_reminders}
                    onCheckedChange={() => handleToggleNotification('payment_reminders')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Community Updates</p>
                    <p className="text-sm text-gray-600">Events and announcements</p>
                  </div>
                  <Switch
                    checked={notifications.community_updates}
                    onCheckedChange={() => handleToggleNotification('community_updates')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-600">Receive via text message</p>
                  </div>
                  <Switch
                    checked={notifications.sms_notifications}
                    onCheckedChange={() => handleToggleNotification('sms_notifications')}
                  />
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">Security</h2>
              </div>

              <div className="space-y-3">
                <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                  <DialogTrigger asChild>
                    <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                      <span className="text-gray-900">Change Password</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and choose a new one
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label>Current Password</Label>
                        <Input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label>Confirm New Password</Label>
                        <Input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleChangePassword} className="bg-green-600 hover:bg-green-700">
                        Change Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                  <span className="text-gray-900">Two-Factor Authentication</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                  <span className="text-gray-900">Active Sessions</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}