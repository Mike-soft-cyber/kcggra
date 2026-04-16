import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, CreditCard, TrendingUp, Users, Settings, LogOut, Menu, Receipt, X } from 'lucide-react';
import API from '@/api';

const navigation = [
  { name: 'Dashboard',       path: '/admin/dashboard',       icon: LayoutDashboard },
  { name: 'Subscriptions',   path: '/admin/subscriptions',   icon: CreditCard },
  { name: 'CapEx Tracker',   path: '/admin/capex',           icon: TrendingUp },
  { name: 'Residents',       path: '/admin/residents',       icon: Users },
  { name: 'Verify Payments', path: '/admin/payments/verify', icon: Receipt },
];

function NavItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`
        relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
        transition-all duration-200 overflow-hidden group
        ${active ? 'bg-[#FDE9AB] text-[#0F172A]' : 'text-[#94A3B8] hover:text-white'}
      `}
    >
      {/* hover fill effect */}
      {!active && (
        <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200 rounded-xl" />
      )}
      <Icon className="w-5 h-5 flex-shrink-0 relative z-10" />
      <span className="relative z-10">{item.name}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 bg-[#0F172A]/50 rounded-full" />}
    </Link>
  );
}

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { fetchUser(); }, []);

  const fetchUser = async () => {
    try {
      const res = await API.get('/auth/me');
      setUser(res.data.user);
      if (res.data.user.role !== 'admin') navigate('/dashboard');
    } catch { navigate('/login'); }
  };

  const handleLogout = async () => {
    try { await API.post('/auth/logout'); } catch { /* silent */ }
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const SidebarContent = ({ onNav }) => (
    <div className="flex flex-col h-full">
      {/* Gold accent line */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#FDE9AB] to-transparent opacity-40" />

      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FDE9AB] rounded-xl flex items-center justify-center shadow-md
            hover:shadow-[#FDE9AB]/30 hover:scale-105 transition-all duration-300">
            <span className="text-[#0F172A] font-black text-lg">K</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-base">KCGGRA</h1>
            <p className="text-[#94A3B8] text-xs">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavItem key={item.name} item={item} active={isActive(item.path)} onClick={onNav} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-white/10 space-y-1">
        <Link to="/dashboard/settings" onClick={onNav}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
            text-[#94A3B8] hover:bg-white/10 hover:text-white transition-all duration-200">
          <Settings className="w-5 h-5" /> Settings
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
            text-[#94A3B8] hover:bg-[#A76059]/15 hover:text-[#A76059] transition-all duration-200">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>

      {/* User info at very bottom */}
      {user && (
        <div className="mx-4 mb-4 px-3 py-3 bg-white/5 rounded-xl border border-white/10">
          <p className="text-white text-xs font-semibold truncate">{user.username}</p>
          <p className="text-[#94A3B8] text-[11px]">Administrator</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0F172A] flex-col fixed inset-y-0 left-0 z-30 shadow-xl shadow-[#0F172A]/20">
        <SidebarContent onNav={undefined} />
      </aside>

      {/* Mobile drawer overlay */}
      <div className={`
        fixed inset-0 z-50 lg:hidden transition-all duration-300
        ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className={`
          absolute inset-y-0 left-0 w-64 bg-[#0F172A] shadow-2xl
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <SidebarContent onNav={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden bg-[#0F172A] px-4 py-3.5 flex items-center justify-between shadow-lg">
          <button onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all duration-200">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FDE9AB] rounded-lg flex items-center justify-center">
              <span className="text-[#0F172A] font-black text-sm">K</span>
            </div>
            <span className="font-bold text-white text-sm">KCGGRA Admin</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}