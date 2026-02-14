import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import API from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Phone,
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const fetchIncident = async () => {
    try {
      const response = await API.get(`/incidents/${id}`);
      setIncident(response.data.incident);
    } catch (error) {
      console.error('Failed to fetch incident:', error);
      toast.error('Incident not found');
      navigate('/dashboard/incidents');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      reported: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      false_alarm: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || colors.reported;
  };

  const getStatusIcon = (status) => {
    const icons = {
      reported: AlertTriangle,
      in_progress: Clock,
      resolved: CheckCircle,
      false_alarm: XCircle,
    };
    const Icon = icons[status] || AlertTriangle;
    return Icon;
  };

  const getTypeIcon = (type) => {
    const icons = {
      burglary: '🚨',
      fire: '🔥',
      suspicious: '👁️',
      environmental: '🌳',
      medical: '🏥',
    };
    return icons[type] || '⚠️';
  };

  const getTypeColor = (type) => {
    const colors = {
      burglary: 'from-red-500 to-red-700',
      fire: 'from-orange-500 to-red-600',
      suspicious: 'from-yellow-500 to-orange-600',
      environmental: 'from-green-500 to-green-700',
      medical: 'from-blue-500 to-blue-700',
    };
    return colors[type] || 'from-gray-500 to-gray-700';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading incident...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!incident) {
    return null;
  }

  const StatusIcon = getStatusIcon(incident.status);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/dashboard/incidents')}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Incidents
        </Button>

        {/* Incident Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header with Gradient Background */}
          <div className={`bg-gradient-to-r ${getTypeColor(incident.type)} p-6 text-white`}>
            <div className="flex items-start gap-4">
              <div className="text-6xl">{getTypeIcon(incident.type)}</div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {incident.title || `${incident.type.toUpperCase()} Incident`}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${getStatusColor(incident.status)} bg-white`}>
                    <StatusIcon className="w-4 h-4 inline mr-2" />
                    {incident.status.toUpperCase().replace('_', ' ')}
                  </div>
                  <span className="text-sm opacity-90 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(incident.createdAt).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - Left Side */}
              <div className="lg:col-span-2 space-y-6">
                {/* Location */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    Location
                  </h2>
                  <p className="text-gray-700 text-lg">{incident.address || 'Location not specified'}</p>
                  {incident.coordinates && incident.coordinates.length === 2 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500">
                        Coordinates: {incident.coordinates[1].toFixed(6)}, {incident.coordinates[0].toFixed(6)}
                      </p>
                      <a
                        href={`https://www.google.com/maps?q=${incident.coordinates[1]},${incident.coordinates[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                      >
                        View on Google Maps →
                      </a>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-3">📝 Description</h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {incident.description}
                    </p>
                  </div>
                </div>

                {/* Media/Evidence */}
                {incident.media && incident.media.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3">📷 Evidence</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {incident.media.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition"
                        >
                          <img
                            src={url}
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-64 object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 font-medium">
                              View Full Size
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution (if resolved) */}
                {incident.status === 'resolved' && incident.resolution_notes && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <h2 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Resolution
                    </h2>
                    <p className="text-green-800 mb-3">{incident.resolution_notes}</p>
                    <p className="text-sm text-green-700">
                      Resolved on {new Date(incident.resolvedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar - Right Side */}
              <div className="space-y-6">
                {/* Reporter Information */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Reporter Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {incident.user?.profilePic ? (
                        <img
                          src={incident.user.profilePic}
                          alt={incident.user.username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white">
                          {incident.user?.username?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-blue-900">
                          {incident.user?.username || 'Anonymous'}
                        </p>
                        <p className="text-sm text-blue-700">Resident</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-blue-200 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-blue-700" />
                        <span className="text-blue-800">
                          {incident.user?.phone || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-blue-700" />
                        <span className="text-blue-800">
                          {incident.user?.street || 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Guard (if any) */}
                {incident.assignedGuard && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                    <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Assigned Guard
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white text-xl border-2 border-white">
                          👮
                        </div>
                        <div>
                          <p className="font-medium text-green-900">
                            {incident.assignedGuard.username}
                          </p>
                          <p className="text-sm text-green-700">Security Guard</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-green-200">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-green-700" />
                          <span className="text-green-800">
                            {incident.assignedGuard.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Incident ID */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Incident ID</p>
                  <p className="font-mono font-bold text-gray-900 text-sm break-all">
                    {incident._id}
                  </p>
                </div>

                {/* Timeline */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-3">Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Reported</p>
                        <p className="text-xs text-gray-600">
                          {new Date(incident.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {incident.status === 'in_progress' && (
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">In Progress</p>
                          <p className="text-xs text-gray-600">Being investigated</p>
                        </div>
                      </div>
                    )}

                    {incident.status === 'resolved' && incident.resolvedAt && (
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Resolved</p>
                          <p className="text-xs text-gray-600">
                            {new Date(incident.resolvedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons (for admins/guards) */}
        <div className="mt-6 flex gap-4">
          <Button
            onClick={() => navigate('/dashboard/incidents')}
            variant="outline"
            className="flex-1"
          >
            View All Incidents
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="flex-1"
          >
            Print Report
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}