import API from '@/api'
import { Card, CardHeader, CardContent, CardTitle} from '@/components/ui/card'
import { useState, useEffect } from 'react'
import EmergencyButton from '@/components/EmergencyButton'
import CapExProgress from '@/components/CapExProgress'
import DashboardLayout from '@/components/DashboardLayout';
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Shield, QrCode, Users, Wallet, Calendar } from 'lucide-react'
import React, { lazy, Suspense } from 'react';
import io from 'socket.io-client';
import { toast } from 'sonner';

const GuardMap = lazy(() => import("@/components/GuardMap"));

export default function DashBoard(){
    const [loading, setLoading] = useState(true); // Set to true initially
    const [user, setUser] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState(null);
    const [guards, setGuards] = useState([]);
    const navigate = useNavigate();
    
    useEffect(() => {
        fetchData();
        setupSocketConnection();

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []); // eslint-disable-line

    const setupSocketConnection = () => {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        const newSocket = io(socketUrl, {
            withCredentials: true,
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected');
            newSocket.emit('join-room', 'residents');
        });

        newSocket.on('guard-location-update', (data) => {
            console.log('📍 Guard location updated:', data);
            fetchGuardLocations();
        });

        newSocket.on('new-announcement', (data) => {
            console.log('📢 New announcement:', data);
            toast.success(data.message);
            fetchAnnouncements();
        });

        setSocket(newSocket);
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
        } catch (error) {
            console.error('Failed to fetch data:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const response = await API.get('/announcements?limit=10');
            setAnnouncements(response.data.announcements || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        }
    };

    const fetchGuardLocations = async () => {
        try {
            const response = await API.get('/guards/active-locations');
            setGuards(response.data.guards || []);
        } catch (error) {
            console.error('Failed to fetch guard locations:', error);
        }
    };

    // ✅ Fixed: Moved helper functions outside and added proper closing
    const getCategoryBadge = (category) => {
        const badges = {
            security: { bg: 'bg-red-100', text: 'text-red-800', label: 'Security' },
            event: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Event' },
            alert: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Alert' },
            maintenance: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Maintenance' },
            general: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'General' },
        };

        const badge = badges[category] || badges.general;

        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    }; // ✅ Added closing brace

    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} ${Math.floor(seconds / 60) === 1 ? 'minute' : 'minutes'} ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${Math.floor(seconds / 3600) === 1 ? 'hour' : 'hours'} ago`;
        return `${Math.floor(seconds / 86400)} ${Math.floor(seconds / 86400) === 1 ? 'day' : 'days'} ago`;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return(
        <DashboardLayout>
            <div className="space-y-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome back, {user?.username?.split(' ')[0]}
                    </h1>
                    <p className="text-gray-600 mt-1">Here's what's happening in your community today</p>
                </div>

                <EmergencyButton />

                {/* Main Grid */}
                <section>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Community Updates */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="border-b">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold text-gray-800">
                                        Community Updates
                                    </CardTitle>
                                    {unreadCount > 0 && (
                                        <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-medium rounded-full">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {announcements.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <p>No updates yet</p>
                                    </div>
                                ) : (
                                    announcements.map((announcement) => (
                                        <div
                                            key={announcement._id}
                                            className="p-6 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition"
                                            onClick={() => navigate(`/dashboard/announcements/${announcement._id}`)}
                                        >
                                            <div className="flex gap-4">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {getInitials(announcement.author_id?.username)}
                                                    </div>
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h3 className="font-bold text-gray-800 mb-1">
                                                                {announcement.title}
                                                            </h3>
                                                            {getCategoryBadge(announcement.category)}
                                                        </div>
                                                    </div>

                                                    <p className="text-gray-600 text-sm mb-3">
                                                        {announcement.content}
                                                    </p>

                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span>{announcement.author_id?.username}</span>
                                                        <span>•</span>
                                                        <span>{formatTimeAgo(announcement.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader className="border-b">
                                <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                                {[
                                    { icon: Shield, label: 'Report Incident', desc: 'Security concern or suspicious activity', path: '/dashboard/incidents', color: 'text-red-600' },
                                    { icon: QrCode, label: 'Visitor Pass', desc: 'Generate QR code for guests', path: '/dashboard/visitors', color: 'text-blue-600' },
                                    { icon: Users, label: 'Community', desc: 'Join streets groups & events', path: '/dashboard/community', color: 'text-green-600' },
                                    { icon: Wallet, label: 'Payments', desc: 'Pay subscriptions via M-Pesa', path: '/dashboard/payments', color: 'text-purple-600' },
                                    { icon: Calendar, label: 'Events', desc: 'Meetings & more', path: '/dashboard/community', color: 'text-orange-600' },
                                ].map(({ icon: Icon, label, desc, path, color }) => (
                                    <Button
                                        key={label}
                                        variant="ghost"
                                        className="w-full justify-start p-4 h-auto hover:bg-gray-50"
                                        onClick={() => navigate(path)}
                                    >
                                        <Icon className={`w-5 h-5 mr-3 ${color}`} />
                                        <div className="text-left">
                                            <h3 className="font-semibold text-gray-900">{label}</h3>
                                            <p className="text-xs text-gray-500">{desc}</p>
                                        </div>
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* CapEx Progress */}
                <section>
                    <Card>
                        <CardContent className="p-6">
                            <CapExProgress />
                        </CardContent>
                    </Card>
                </section>

                {/* Guard Activity */}
                <section>
                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-green-500 text-xl">📍</span>
                                    <CardTitle className="text-xl font-bold">Live Guard Activity</CardTitle>
                                </div>
                                <button
                                    onClick={() => navigate('/dashboard/guard-map')}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    Full Map →
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {guards.length === 0 ? (
                                <div className="h-96 bg-gray-50 rounded-lg flex flex-col items-center justify-center text-gray-500">
                                    <span className="text-4xl mb-3">👮</span>
                                    <p className="text-lg font-medium">No Active Guards</p>
                                    <p className="text-sm">Guards will appear here when they start their patrol</p>
                                </div>
                            ) : (
                                <Suspense fallback={
                                    <div className="flex items-center justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                }>
                                    <GuardMap />
                                </Suspense>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </DashboardLayout>
    );
}