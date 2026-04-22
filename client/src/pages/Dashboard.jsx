import API from '@/api';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { useState, useEffect, lazy, Suspense } from 'react';
import EmergencyButton from '@/components/EmergencyButton';
import CapExProgress from '@/components/CapExProgress';
import DashboardLayout from '@/components/DashboardLayout';
import PageLoader, { InlineLoader } from '@/components/PageLoader';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { toast } from 'sonner';

const GuardMap = lazy(() => import('@/components/GuardMap'));

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading]             = useState(true);
  const [user, setUser]                   = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [guards, setGuards]               = useState([]);

  useEffect(() => {
    fetchData();
    const socket = setupSocket();
    return () => socket?.disconnect();
  }, []);

  const setupSocket = () => {
    const url = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(url, { withCredentials: true });
    socket.on('connect', () => {
      socket.emit('join-room', 'residents');
    });
    socket.on('guard-location-update', () => fetchGuardLocations());
    socket.on('new-announcement', (data) => {
      toast.success(data.message);
      fetchAnnouncements();
    });
    return socket;
  };

  const fetchData = async () => {
    try {
      const [userRes, announcementsRes] = await Promise.all([
        API.get('/auth/me'),
        API.get('/announcements?limit=10'),
      ]);
      setUser(userRes.data.user);
      setAnnouncements(announcementsRes.data.announcements || []);
      setUnreadCount(announcementsRes.data.unreadCount || 0);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await API.get('/announcements?limit=10');
      setAnnouncements(res.data.announcements || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  };

  const fetchGuardLocations = async () => {
    try {
      const res = await API.get('/guards/active-locations');
      setGuards(res.data.guards || []);
    } catch {}
  };

  const getCategoryBadge = (category) => {
    const map = {
      security:    { bg: 'bg-[#F9EDEB]', text: 'text-[#7A3A2E]', label: 'Security'    },
      event:       { bg: 'bg-[#EEEDFE]', text: 'text-[#3C3489]', label: 'Event'        },
      alert:       { bg: 'bg-[#FEF0E7]', text: 'text-[#7A3A00]', label: 'Alert'        },
      maintenance: { bg: 'bg-[#EEEDFE]', text: 'text-[#3C3489]', label: 'Maintenance'  },
      general:     { bg: 'bg-[#F1F5F9]', text: 'text-[#64748B]', label: 'General'      },
    };
    const b = map[category] || map.general;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${b.bg} ${b.text}`}>
        {b.label}
      </span>
    );
  };

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60)    return 'just now';
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  // ── Page content loader (navbar stays mounted) ──────────
  if (loading) return (
    <DashboardLayout>
      <PageLoader message="Loading dashboard…" />
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Welcome header */}
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
            Welcome back, {user?.username?.split(' ')[0]} 👋
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            Here's what's happening in your community today
          </p>
        </div>

        {/* Emergency button */}
        <EmergencyButton />

        {/* Community Updates — full width now that Quick Actions is removed */}
        <Card className="rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <CardHeader className="border-b border-[#F1F5F9] px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-[#0F172A]">
                Community Updates
              </CardTitle>
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-[#FDE9AB] text-[#0F172A] text-xs font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {announcements.length === 0 ? (
              <div className="p-12 text-center text-[#94A3B8]">
                <p className="text-base font-medium">No updates yet</p>
                <p className="text-sm mt-1">Check back soon</p>
              </div>
            ) : (
              announcements.map((a) => (
                <div
                  key={a._id}
                  className="px-6 py-5 border-b border-[#F1F5F9] last:border-0
                    hover:bg-[#F8FAFC] cursor-pointer transition-colors duration-150 group"
                  onClick={() => navigate(`/dashboard/announcements/${a._id}`)}
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-[#FDE9AB]
                      flex items-center justify-center text-xs font-bold flex-shrink-0
                      group-hover:scale-105 transition-transform duration-200">
                      {getInitials(a.author_id?.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h3 className="font-semibold text-[#0F172A] text-sm leading-snug">
                          {a.title}
                        </h3>
                        {getCategoryBadge(a.category)}
                      </div>
                      <p className="text-[#64748B] text-sm mb-2 line-clamp-2">{a.content}</p>
                      <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                        <span>{a.author_id?.username}</span>
                        <span>·</span>
                        <span>{timeAgo(a.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* CapEx Progress */}
        <CapExProgress />

        {/* Live Guard Activity */}
        <Card className="rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <CardHeader className="border-b border-[#F1F5F9] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <CardTitle className="text-lg font-bold text-[#0F172A]">
                  Live Guard Activity
                </CardTitle>
              </div>
              <button
                onClick={() => navigate('/dashboard/guard-map')}
                className="text-[#7F77DD] hover:text-[#5B52C0] text-sm font-semibold transition-colors"
              >
                Full Map →
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {guards.length === 0 ? (
              <div className="h-64 bg-[#F8FAFC] rounded-2xl flex flex-col items-center justify-center text-[#94A3B8]">
                <span className="text-4xl mb-3">👮</span>
                <p className="font-semibold text-[#64748B]">No Active Guards</p>
                <p className="text-sm mt-1">Guards appear here when on patrol</p>
              </div>
            ) : (
              <Suspense fallback={<InlineLoader />}>
                <GuardMap guards={guards} />
              </Suspense>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}