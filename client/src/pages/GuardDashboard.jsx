import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Camera,
  Clock,
  CheckCircle,
  MapPin,
  PhoneCall,
  FileText,
  QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import API from '@/api';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

export default function GuardDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeVisitors: 0,
    todayIncidents: 0,
    onDutyGuards: 0,
    pendingAlerts: 0,
  });
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentShift, setCurrentShift] = useState(null); // ✅ From backend
  const [shiftTime, setShiftTime] = useState('0h 0m');

  useEffect(() => {
    fetchGuardData();
    fetchCurrentShift();
  }, []);

  // ✅ Update shift time every minute
  useEffect(() => {
    if (currentShift) {
      const interval = setInterval(() => {
        setShiftTime(calculateShiftDuration(currentShift.startTime));
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [currentShift]);

  const fetchGuardData = async () => {
    try {
      // ✅ Fetch incidents and stats (required)
      const [incidentsRes, statsRes] = await Promise.all([
        API.get('/incidents?limit=5'),
        API.get('/guards/stats'),
      ]);

      setRecentIncidents(incidentsRes.data.incidents || []);
      
      setStats({
        activeVisitors: 0, // Will be updated if visitors fetch succeeds
        todayIncidents: statsRes.data.todayIncidents || 0,
        onDutyGuards: statsRes.data.onDutyGuards || 0,
        pendingAlerts: statsRes.data.pendingAlerts || 0,
      });

      // ✅ Try to fetch visitors separately (optional - don't crash if fails)
      try {
        const visitorsRes = await API.get('/visitors/active');
        setActiveVisitors(visitorsRes.data.visitors || []);
        setStats(prev => ({
          ...prev,
          activeVisitors: visitorsRes.data.visitors?.length || 0,
        }));
      } catch (visitorError) {
        console.log('Visitors endpoint not available yet');
        setActiveVisitors([]);
      }

    } catch (error) {
      console.error('Failed to fetch guard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch current shift from backend
  const fetchCurrentShift = async () => {
    try {
      const response = await API.get('/guards/current-shift'); // ✅ Fixed
      if (response.data.shift) {
        setCurrentShift(response.data.shift);
        setShiftTime(calculateShiftDuration(response.data.shift.startTime));
      }
    } catch (error) {
      // No active shift - that's ok
      console.log('No active shift');
    }
  };

  // ✅ Start shift via backend
  const handleStartShift = async () => {
    try {
      const response = await API.post('/guards/start-shift'); // ✅ Fixed
      setCurrentShift(response.data.shift);
      toast.success('Shift started');
      fetchGuardData(); // Refresh stats
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start shift');
    }
  };

  // ✅ End shift via backend
  const handleEndShift = async () => {
    try {
      const response = await API.post('/guards/end-shift'); // ✅ Fixed
      setCurrentShift(null);
      setShiftTime('0h 0m');
      toast.success('Shift ended');
      
      // Show shift summary
      if (response.data.summary) {
        toast.success(
          `Shift completed: ${response.data.summary.duration} | ${response.data.summary.incidents} incidents`,
          { duration: 5000 }
        );
      }
      
      fetchGuardData(); // Refresh stats
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end shift');
    }
  };

  const calculateShiftDuration = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getIncidentIcon = (type) => {
    switch (type) {
      case 'burglary':
        return '🚨';
      case 'fire':
        return '🔥';
      case 'suspicious':
        return '👁️';
      case 'medical':
        return '🏥';
      default:
        return '⚠️';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security Command</h1>
            <p className="text-gray-600 mt-1">Guard Control Dashboard</p>
          </div>
          
          {/* Shift Status */}
          <div className="flex items-center gap-4">
            {currentShift && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Shift Duration</p>
                <p className="text-lg font-bold text-gray-900">{shiftTime}</p>
              </div>
            )}
            {currentShift ? (
              <Button
                onClick={handleEndShift}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                End Shift
              </Button>
            ) : (
              <Button
                onClick={handleStartShift}
                className="bg-green-600 hover:bg-green-700"
              >
                Start Shift
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Visitors</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.activeVisitors}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Incidents</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.todayIncidents}</h3>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">On Duty Guards</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.onDutyGuards}</h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Alerts</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingAlerts}</h3>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => navigate('/dashboard/incidents')}
              className="bg-white/20 hover:bg-white/30 text-white h-auto py-4 flex flex-col gap-2"
            >
              <AlertTriangle className="w-6 h-6" />
              <span className="text-sm">Report Incident</span>
            </Button>

            <Button
              onClick={() => navigate('/dashboard/visitors')}
              className="bg-white/20 hover:bg-white/30 text-white h-auto py-4 flex flex-col gap-2"
            >
              <QrCode className="w-6 h-6" />
              <span className="text-sm">Scan Visitor QR</span>
            </Button>

            <Button
              onClick={() => navigate('/dashboard/guard-map')}
              className="bg-white/20 hover:bg-white/30 text-white h-auto py-4 flex flex-col gap-2"
            >
              <MapPin className="w-6 h-6" />
              <span className="text-sm">Guard Map</span>
            </Button>

            <Button
              onClick={() => window.open('tel:999')}
              className="bg-red-500/90 hover:bg-red-600 text-white h-auto py-4 flex flex-col gap-2"
            >
              <PhoneCall className="w-6 h-6" />
              <span className="text-sm">Emergency Call</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Incidents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Incidents</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/incidents')}
              >
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {recentIncidents.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No incidents reported today</p>
              ) : (
                recentIncidents.map((incident) => (
                  <div
                    key={incident._id}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                    onClick={() => navigate(`/dashboard/incidents/${incident._id}`)}
                  >
                    <div className="text-2xl">{getIncidentIcon(incident.type)}</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 capitalize">{incident.type}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{incident.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {incident.address} • {new Date(incident.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      incident.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : incident.status === 'investigating'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {incident.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Visitors */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Active Visitors</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/visitors')}
              >
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {activeVisitors.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No active visitors</p>
              ) : (
                activeVisitors.slice(0, 5).map((visitor) => (
                  <div
                    key={visitor._id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                    onClick={() => navigate(`/dashboard/visitors/${visitor.visitor_id}`)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{visitor.guest_name}</p>
                      <p className="text-sm text-gray-600">
                        Visiting: {visitor.resident_id?.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(visitor.visit_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/visitors/${visitor.visitor_id}`);
                      }}
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency Contacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="tel:999"
              className="flex items-center gap-3 p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition"
            >
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Police</p>
                <p className="text-sm text-gray-600">999</p>
              </div>
            </a>

            <a
              href="tel:999"
              className="flex items-center gap-3 p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Fire Department</p>
                <p className="text-sm text-gray-600">999</p>
              </div>
            </a>

            <a
              href="tel:999"
              className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Ambulance</p>
                <p className="text-sm text-gray-600">999</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}