import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Shield, 
  Wallet, 
  Users, 
  Settings, 
  Bell, 
  Menu, 
  X,
  LogOut,
  AlertTriangle,
  QrCode,
  MapPin
} from 'lucide-react';
import API from '@/api';
import { getDashboardRoute } from '@/utils/roleNavigation';

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await API.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // ✅ Get navigation items based on user role
  const getNavItems = () => {
    if (!user) return [];

    const dashboardRoute = getDashboardRoute(user.role);

    const baseItems = [
      { name: 'Dashboard', path: dashboardRoute, icon: Home },
    ];

    if (user.role === 'admin') {
      return baseItems; // Admin has separate AdminLayout
    }

    if (user.role === 'guard') {
      return [
        ...baseItems,
        { name: 'Incidents', path: '/dashboard/incidents', icon: AlertTriangle },
        { name: 'Visitors', path: '/dashboard/visitors', icon: QrCode },
        { name: 'Guard Map', path: '/dashboard/guard-map', icon: MapPin },
      ];
    }

    // Resident (default)
    return [
      ...baseItems,
      { name: 'Incidents', path: '/dashboard/incidents', icon: Shield },
      { name: 'Payments', path: '/dashboard/payments', icon: Wallet },
      { name: 'Community', path: '/dashboard/community', icon: Users },
    ];
  };

  const isActive = (path) => location.pathname === path;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left: Logo + Menu */}
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              {/* Logo */}
              <Link to={getDashboardRoute(user.role)} className="flex items-center gap-2 ml-2 lg:ml-0">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-bold text-gray-900">KCGGRA</span>
                  <p className="text-xs text-gray-500">Community Portal</p>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:ml-10 lg:flex lg:space-x-1">
                {getNavItems().map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                        active
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right: User Menu */}
            <div className="flex items-center gap-3">
              {/* Subscription Status */}
              {user.role === 'resident' && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.subStatus === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : user.subStatus === 'grace'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.subStatus === 'paid' ? '✓ Paid' : user.subStatus === 'grace' ? '⏰ Grace' : '✗ Unpaid'}
                </span>
              )}

              {/* Role Badge */}
              <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                user.role === 'admin'
                  ? 'bg-purple-100 text-purple-800'
                  : user.role === 'guard'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>

              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Avatar */}
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard/settings"
                  className="flex items-center gap-2 hover:opacity-80 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user.username}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 transition"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 space-y-1">
              {getNavItems().map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                      active
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}

              <Link
                to="/dashboard/settings"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}