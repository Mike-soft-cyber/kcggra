/**
 * DashboardLayout.jsx
 * - PillNav is self-contained and fixed-positioned (never remounts)
 * - Avatar click opens dropdown with Settings + Sign out
 * - profilePic onError falls back to initials (fixes blank Google photo)
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Bell, Settings, LogOut, ChevronRight } from 'lucide-react';
import API from '@/api';
import { getDashboardRoute } from '@/utils/roleNavigation';
import PillNav from '@/components/PillNav';

export default function DashboardLayout({ children }) {
  const navigate  = useNavigate();
  const [user, setUser]                   = useState(null);
  const [picError, setPicError]           = useState(false);   // ← profile pic fallback
  const [notifOpen, setNotifOpen]         = useState(false);
  const [avatarOpen, setAvatarOpen]       = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [scrolled, setScrolled]           = useState(false);

  useEffect(() => {
    fetchUser();
    fetchNotifications();
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reset pic error whenever user changes (e.g. after profile update)
  useEffect(() => { setPicError(false); }, [user?.profilePic]);

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
    } catch {}
  };

  const handleLogout = async () => {
    setAvatarOpen(false);
    try { await API.post('/auth/logout'); } catch {}
    navigate('/login');
  };

  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60)    return 'just now';
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const getNavItems = () => {
    if (!user) return [];
    const home = { label: 'Home', href: getDashboardRoute(user.role) };
    if (user.role === 'guard') return [
      home,
      { label: 'Incidents', href: '/dashboard/incidents' },
      { label: 'Visitors',  href: '/dashboard/visitors'  },
      { label: 'Guard Map', href: '/dashboard/guard-map' },
    ];
    return [
      home,
      { label: 'Incidents', href: '/dashboard/incidents' },
      { label: 'Payments',  href: '/dashboard/payments'  },
      { label: 'Community', href: '/dashboard/community' },
    ];
  };

  // ── Shared icon button style ─────────────────────────
  const iconBtn = {
    width: 36, height: 36, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: '#94A3B8',
  };

  // ── Should show photo or initials ────────────────────
  const showPhoto = user?.profilePic && !picError;

  // ── Right slot passed to PillNav ─────────────────────
  const rightSlot = user ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

      {/* Sub badge */}
      {user.role === 'resident' && (
        <span
          className="hidden sm:inline-flex"
          style={{
            padding: '3px 10px', borderRadius: 9999,
            fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
            background: user.subStatus === 'paid'  ? 'rgba(29,158,117,0.2)' :
                        user.subStatus === 'grace' ? 'rgba(233,124,58,0.2)' :
                                                     'rgba(167,96,89,0.2)',
            color: user.subStatus === 'paid'  ? '#1D9E75' :
                   user.subStatus === 'grace' ? '#E97C3A'  : '#A76059',
          }}
        >
          {user.subStatus === 'paid'  ? '✓ Paid' :
           user.subStatus === 'grace' ? '⏰ Grace' : '✗ Unpaid'}
        </span>
      )}

      {/* Bell */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setNotifOpen(o => !o); setAvatarOpen(false); }}
          style={iconBtn}
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 7, right: 7,
              width: 7, height: 7, borderRadius: '50%',
              background: '#A76059',
            }} />
          )}
        </button>

        {notifOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }}
              onClick={() => setNotifOpen(false)} />
            <div style={{
              position: 'absolute', right: 0, top: 44, width: 300,
              background: 'white', borderRadius: 16, zIndex: 20,
              boxShadow: '0 16px 48px rgba(15,23,42,0.2)',
              border: '1px solid #E2E8F0', overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>Notifications</span>
                {unreadCount > 0 && (
                  <span style={{ background: '#FDE9AB', color: '#0F172A', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 9999 }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {notifications.length === 0
                  ? <p style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No notifications</p>
                  : notifications.map(n => (
                    <div key={n._id}
                      onClick={() => { navigate(`/dashboard/announcements/${n._id}`); setNotifOpen(false); }}
                      style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{n.title}</p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(n.createdAt)}</p>
                    </div>
                  ))
                }
              </div>
              {notifications.length > 0 && (
                <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: '1px solid #E2E8F0' }}>
                  <button onClick={() => { navigate('/dashboard/announcements'); setNotifOpen(false); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7F77DD', fontSize: 12, fontWeight: 700 }}>
                    View all →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Avatar + dropdown ── */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setAvatarOpen(o => !o); setNotifOpen(false); }}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: showPhoto ? 'transparent' : '#FDE9AB',
            overflow: 'hidden', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#0F172A',
            cursor: 'pointer', border: 'none',
            outline: avatarOpen ? '2px solid rgba(253,233,171,0.5)' : 'none',
            outlineOffset: 2,
            transition: 'outline 0.2s',
          }}
          aria-label="User menu"
        >
          {showPhoto ? (
            <img
              src={user.profilePic}
              alt={user.username}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setPicError(true)}   /* ← fallback to initials on load fail */
            />
          ) : (
            getInitials(user.username)
          )}
        </button>

        {avatarOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }}
              onClick={() => setAvatarOpen(false)} />
            <div style={{
              position: 'absolute', right: 0, top: 44, width: 220,
              background: 'white', borderRadius: 16, zIndex: 20,
              boxShadow: '0 16px 48px rgba(15,23,42,0.18)',
              border: '1px solid #E2E8F0', overflow: 'hidden',
            }}>
              {/* User info */}
              <div style={{ padding: '14px 16px', background: '#0F172A' }}>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                  {user.username}
                </p>
                <p style={{ color: '#94A3B8', fontSize: 11 }}>{user.email || user.phone}</p>
                <p style={{ color: '#64748B', fontSize: 10, marginTop: 2, textTransform: 'capitalize' }}>
                  {user.role}
                </p>
              </div>

              {/* Menu items */}
              <div style={{ padding: 6 }}>
                <button
                  onClick={() => { setAvatarOpen(false); navigate('/dashboard/settings'); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 10, padding: '10px 12px', borderRadius: 10,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#0F172A', fontSize: 13, fontWeight: 600,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Settings size={15} color="#64748B" />
                  Settings
                  <ChevronRight size={13} color="#94A3B8" style={{ marginLeft: 'auto' }} />
                </button>

                <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />

                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 10, padding: '10px 12px', borderRadius: 10,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#A76059', fontSize: 13, fontWeight: 600,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FDF2F0'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <LogOut size={15} color="#A76059" />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  ) : null;

  // Full-screen loading (before user fetched)
  if (!user) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="flex items-center gap-2.5">
        {[0, 150, 300].map((delay, i) => (
          <span key={i}
            className={`rounded-full animate-bounce ${i === 1 ? 'bg-[#FDE9AB]' : 'bg-[#0F172A]'}`}
            style={{ width: 12, height: 12, display: 'block', animationDelay: `${delay}ms`, animationDuration: '700ms' }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PillNav items={getNavItems()} rightSlot={rightSlot} scrolled={scrolled} />
      <main className="pt-[57px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}