import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Shield, Wallet, Users, Settings, Bell, Menu, X, LogOut, AlertTriangle, QrCode, MapPin } from 'lucide-react';
import API from '@/api';
import { getDashboardRoute } from '@/utils/roleNavigation';

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchNotifications();
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await API.get('/auth/me');
      setUser(res.data.user);
    } catch { navigate('/login'); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/announcements?limit=5');
      setNotifications(res.data.announcements || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* silent */ }
  };

  const handleLogout = async () => {
    try { await API.post('/auth/logout'); } catch { /* silent */ }
    navigate('/login');
  };

  const getNavItems = () => {
    if (!user) return [];
    const base = [{ name: 'Dashboard', path: getDashboardRoute(user.role), icon: Home }];
    if (user.role === 'guard') return [...base,
      { name: 'Incidents', path: '/dashboard/incidents', icon: AlertTriangle },
      { name: 'Visitors',  path: '/dashboard/visitors',  icon: QrCode },
      { name: 'Guard Map', path: '/dashboard/guard-map', icon: MapPin },
    ];
    return [...base,
      { name: 'Incidents', path: '/dashboard/incidents', icon: Shield },
      { name: 'Payments',  path: '/dashboard/payments',  icon: Wallet },
      { name: 'Community', path: '/dashboard/community', icon: Users },
    ];
  };

  const isActive = (path) => location.pathname === path;
  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F172A]" />
    </div>
  );

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Top Nav ── */}
      <nav className={`bg-[#0F172A] fixed w-full z-30 top-0 transition-shadow duration-300 ${scrolled ? 'shadow-xl shadow-[#0F172A]/30' : ''}`}>
        {/* thin gold accent line at very top */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#FDE9AB] to-transparent opacity-40" />

        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-15 py-2">
            <div className="flex items-center gap-5">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link to={getDashboardRoute(user.role)} className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 bg-[#FDE9AB] rounded-xl flex items-center justify-center
                  shadow-md group-hover:shadow-[#FDE9AB]/40 group-hover:scale-105 transition-all duration-300">
                  <span className="text-[#0F172A] font-black text-base">K</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-white font-bold text-sm leading-none">KCGGRA</p>
                  <p className="text-[#94A3B8] text-xs mt-0.5">Community Portal</p>
                </div>
              </Link>

              {/* Desktop nav */}
              <div className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`
                        relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium
                        transition-all duration-200 group overflow-hidden
                        ${active ? 'bg-[#FDE9AB] text-[#0F172A]' : 'text-[#94A3B8] hover:text-white'}
                      `}
                    >
                      {/* hover fill */}
                      {!active && <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200 rounded-xl" />}
                      <Icon className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user.role === 'resident' && (
                <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                  user.subStatus === 'paid'  ? 'bg-[#1D9E75]/20 text-[#1D9E75]' :
                  user.subStatus === 'grace' ? 'bg-[#E97C3A]/20 text-[#E97C3A]' :
                  'bg-[#A76059]/20 text-[#A76059]'
                }`}>
                  {user.subStatus === 'paid' ? '✓ Paid' : user.subStatus === 'grace' ? '⏰ Grace' : '✗ Unpaid'}
                </span>
              )}

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#A76059] rounded-full animate-pulse" />
                  )}
                </button>

                {/* Notif dropdown */}
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] z-20 overflow-hidden
                      animate-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 bg-[#0F172A] flex items-center justify-between">
                        <p className="text-white font-semibold text-sm">Notifications</p>
                        {unreadCount > 0 && (
                          <span className="text-xs bg-[#FDE9AB] text-[#0F172A] px-2 py-0.5 rounded-full font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-[#F1F5F9]">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-[#94A3B8] text-sm">No notifications yet</div>
                        ) : notifications.map((n) => (
                          <div key={n._id}
                            onClick={() => { navigate(`/dashboard/announcements/${n._id}`); setNotifOpen(false); }}
                            className="px-4 py-3 hover:bg-[#F8FAFC] cursor-pointer transition-colors duration-150"
                          >
                            <p className="text-sm font-semibold text-[#0F172A] mb-0.5 line-clamp-1">{n.title}</p>
                            <p className="text-xs text-[#64748B] line-clamp-2 mb-1">{n.content}</p>
                            <p className="text-[10px] text-[#94A3B8]">{timeAgo(n.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                      {notifications.length > 0 && (
                        <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                          <button onClick={() => { navigate('/dashboard/announcements'); setNotifOpen(false); }}
                            className="text-sm text-[#7F77DD] hover:text-[#5B52C0] font-semibold w-full text-center transition-colors">
                            View all →
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Avatar */}
              <Link to="/dashboard/settings" className="flex items-center gap-2 group px-1">
                <div className="w-8 h-8 rounded-xl bg-[#FDE9AB] flex items-center justify-center overflow-hidden
                  group-hover:ring-2 group-hover:ring-[#FDE9AB]/50 transition-all duration-200">
                  {user.profilePic
                    ? <img src={user.profilePic} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[#0F172A] font-bold text-xs">{getInitials(user.username)}</span>}
                </div>
                <span className="hidden md:block text-sm font-medium text-white group-hover:text-[#FDE9AB] transition-colors duration-200">
                  {user.username?.split(' ')[0]}
                </span>
              </Link>

              <button onClick={handleLogout}
                className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[#A76059] hover:bg-[#A76059]/10 transition-all duration-200"
                title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      <div className={`
        fixed inset-0 z-40 lg:hidden transition-all duration-300
        ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className={`
          absolute inset-y-0 left-0 w-72 bg-[#0F172A] shadow-2xl flex flex-col
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[#FDE9AB] to-transparent opacity-40" />
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#FDE9AB] rounded-xl flex items-center justify-center">
                <span className="text-[#0F172A] font-black">K</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">KCGGRA</p>
                <p className="text-[#94A3B8] text-xs">Community Portal</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/10 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item, i) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.name} to={item.path} onClick={() => setSidebarOpen(false)}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                    transition-all duration-200 group
                    ${active ? 'bg-[#FDE9AB] text-[#0F172A]' : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'}
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.name}
                  {active && <span className="ml-auto w-1.5 h-1.5 bg-[#0F172A] rounded-full" />}
                </Link>
              );
            })}
            <Link to="/dashboard/settings" onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#94A3B8] hover:bg-white/10 hover:text-white transition-all duration-200">
              <Settings className="w-5 h-5" /> Settings
            </Link>
          </nav>

          {/* User card at bottom of sidebar */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 py-3 bg-white/5 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-[#FDE9AB] flex items-center justify-center flex-shrink-0">
                <span className="text-[#0F172A] font-bold text-xs">{getInitials(user.username)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{user.username}</p>
                <p className="text-[#94A3B8] text-xs capitalize">{user.role}</p>
              </div>
              <button onClick={handleLogout} className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#A76059] transition">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Content ── */}
      <main className="pt-[57px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}