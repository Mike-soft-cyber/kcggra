import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import API from '@/api';

export default function IncidentsList({ limit = 5, showAll = false }) {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const response = await API.get(`/incidents?limit=${limit}`);
      setIncidents(response.data.incidents);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIncidentIcon = (type) => {
    const icons = {
      burglary: '🚨',
      fire: '🔥',
      suspicious: '👁️',
      environmental: '🌳',
    };
    return icons[type] || '⚠️';
  };

  const getStatusBadge = (status) => {
    const badges = {
      reported: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Reported', icon: '⚠️' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Investigating', icon: '⚡' },
      resolved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Resolved', icon: '✓' },
      false_alarm: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'False Alarm', icon: '○' },
    };

    const badge = badges[status] || badges.reported;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        <span>{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  const getIncidentTitle = (incident) => {
    const titles = {
      burglary: 'Break-in attempt',
      fire: 'Fire incident',
      suspicious: 'Suspicious activity',
      environmental: 'Environmental issue',
    };
    
    return incident.title || titles[incident.type] || 'Security incident';
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      return `${mins} ${mins === 1 ? 'hour' : 'hours'} ago`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    const days = Math.floor(seconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
        <Card>
            <CardHeader>
                <CardTitle>
                    <h2 className="text-xl font-bold text-gray-800">Recent Incidents</h2>
                </CardTitle>
                <CardContent>
                    {incidents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <span className="text-4xl mb-2 block">🛡️</span>
            <p className="font-medium">No incidents reported</p>
            <p className="text-sm">Your community is safe!</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident._id}
              className="p-6 hover:bg-gray-50 cursor-pointer transition"
              onClick={() => navigate(`/dashboard/incidents/${incident._id}`)}
            >
              <div className="flex gap-4">
                {/* Incident Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    incident.type === 'burglary' ? 'bg-red-100' :
                    incident.type === 'fire' ? 'bg-orange-100' :
                    incident.type === 'suspicious' ? 'bg-yellow-100' :
                    'bg-green-100'
                  }`}>
                    {getIncidentIcon(incident.type)}
                  </div>
                </div>

                {/* Incident Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 mb-1">
                        {getIncidentTitle(incident)}
                      </h3>
                      {getStatusBadge(incident.status)}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <span>📍</span>
                    <span>{incident.address || 'Location not specified'}</span>
                  </div>

                  {/* Time and Reporter */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>⏱️ {formatTimeAgo(incident.createdAt)}</span>
                    <span>•</span>
                    <span>Reported by {incident.user?.username || 'Anonymous'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
                </CardContent>
            </CardHeader>
        </Card>
    </div>
  );
}