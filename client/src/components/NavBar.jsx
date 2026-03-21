import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  Shield, 
  CreditCard, 
  Users, 
  Settings, 
  Bell,
  Menu,
  X,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import API from '@/api';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate(); 
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
  fetchNotifications();
}, []);

const fetchNotifications = async () => {
  try {
    const response = await API.get('/announcements?limit=5');
    setNotifications(response.data.announcements || []);
    setUnreadCount(response.data.unreadCount || 0);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  }
};

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Incidents', href: '/dashboard/incidents', icon: Shield },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { name: 'Community', href: '/dashboard/community', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

  const isActive = (href) => location.pathname === href;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-xl">🛡️</span>
              </div>
              <div className="hidden md:block">
                <h1 className="font-bold text-xl text-gray-900">KCGGRA</h1>
                <p className="text-xs text-gray-500">Community Portal</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    active
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.name}</span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Side - User Profile & Notifications */}
          <div className="flex items-center gap-3">
            {/* Subscription Status Badge */}
            {user && (
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                user.subStatus === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  user.subStatus === 'paid' ? 'bg-green-600' : 'bg-red-600'
                }`}></span>
                <span className="capitalize">{user.subStatus}</span>
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
  <button 
    onClick={() => setNotificationOpen(!notificationOpen)}
    className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
  >
    <Bell className="w-5 h-5" />
    {unreadCount > 0 && (
      <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
        {unreadCount}
      </span>
    )}
  </button>

  {/* Notification Dropdown */}
  {notificationOpen && (
    <>
      <div 
        className="fixed inset-0 z-10" 
        onClick={() => setNotificationOpen(false)}
      ></div>
      <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-[500px] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => {
                  navigate(`/dashboard/announcements/${notification._id}`);
                  setNotificationOpen(false);
                }}
                className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    notification.views?.some(v => v.user_id === user?._id) 
                      ? 'bg-gray-300' 
                      : 'bg-blue-500'
                  }`}></div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <p className={`text-sm ${
                        notification.views?.some(v => v.user_id === user?._id)
                          ? 'text-gray-700'
                          : 'text-gray-900 font-medium'
                      }`}>
                        {notification.title}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        notification.category === 'security' ? 'bg-red-100 text-red-700' :
                        notification.category === 'event' ? 'bg-blue-100 text-blue-700' :
                        notification.category === 'alert' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {notification.category}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {notification.content}
                    </p>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                navigate('/dashboard/announcements');
                setNotificationOpen(false);
              }}
              className="text-sm text-green-600 hover:text-green-700 font-medium w-full text-center"
            >
              View All Notifications →
            </button>
          </div>
        )}
      </div>
    </>
  )}
</div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition"
              >
<div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold overflow-hidden">
  {user?.profilePic ? (
    <img
      src={user.profilePic}
      alt={user?.username}
      className="w-full h-full object-cover"
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.parentElement.innerHTML = getInitials(user?.username);
      }}
    />
  ) : (
    <span>{getInitials(user?.username)}</span>
  )}
</div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.username?.split(' ')[0] || 'User'}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role || 'Resident'}</p>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {profileMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setProfileMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-900">{user?.username}</p>
                      <p className="text-sm text-gray-500">{user?.email || user?.phone}</p>
                      <p className="text-xs text-gray-400 mt-1">{user?.street}</p>
                    </div>

                    <button
                      onClick={() => {
                        navigate('/dashboard/settings');
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate('/dashboard/profile');
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span className="text-sm">My Profile</span>
                    </button>

                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    active
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile User Info */}
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                {getInitials(user?.username)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.username}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}