import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Shield } from 'lucide-react';
import API from '@/api';

const TYPE_STYLES = {
  burglary:      { emoji: '🚨', bg: 'bg-[#F9EDEB]' },
  fire:          { emoji: '🔥', bg: 'bg-[#FEF0E7]' },
  suspicious:    { emoji: '👁️', bg: 'bg-[#FDE9AB]/40' },
  environmental: { emoji: '🌳', bg: 'bg-[#E1F5EE]' },
};

const STATUS_STYLES = {
  reported:    { bg: 'bg-[#FDE9AB]/60',  text: 'text-[#7A5C00]',  label: 'Reported',      icon: '⚠️' },
  in_progress: { bg: 'bg-[#EEEDFE]',     text: 'text-[#3C3489]',  label: 'Investigating', icon: '⚡' },
  resolved:    { bg: 'bg-[#E1F5EE]',     text: 'text-[#0F6E56]',  label: 'Resolved',      icon: '✓'  },
  false_alarm: { bg: 'bg-[#F1F5F9]',     text: 'text-[#64748B]',  label: 'False Alarm',   icon: '○'  },
};

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function IncidentsList({ limit = 5 }) {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchIncidents(); }, []);

  const fetchIncidents = async () => {
    try {
      const res = await API.get(`/incidents?limit=${limit}`);
      setIncidents(res.data.incidents || []);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <Card>
      <CardHeader><CardTitle><h2 className="text-xl font-bold text-[#0F172A]">Recent Incidents</h2></CardTitle></CardHeader>
      <CardContent className="p-0">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 border-b border-[#F1F5F9] last:border-0 animate-pulse">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-[#E2E8F0]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#E2E8F0] rounded-lg w-2/3" />
                <div className="h-3 bg-[#E2E8F0] rounded-lg w-1/2" />
                <div className="h-3 bg-[#E2E8F0] rounded-lg w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <Card className="overflow-hidden border border-[#E2E8F0] shadow-sm rounded-2xl">
      <CardHeader className="border-b border-[#F1F5F9] px-6 py-4">
        <CardTitle>
          <h2 className="text-lg font-bold text-[#0F172A]">Recent Incidents</h2>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {incidents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[#E1F5EE] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#1D9E75]" />
            </div>
            <p className="font-semibold text-[#0F172A] mb-1">No incidents reported</p>
            <p className="text-sm text-[#94A3B8]">Your community is safe!</p>
          </div>
        ) : (
          incidents.map((incident, i) => {
            const type   = TYPE_STYLES[incident.type]   || TYPE_STYLES.suspicious;
            const status = STATUS_STYLES[incident.status] || STATUS_STYLES.reported;
            const title  = incident.title || {
              burglary: 'Break-in attempt', fire: 'Fire incident',
              suspicious: 'Suspicious activity', environmental: 'Environmental issue',
            }[incident.type] || 'Security incident';

            return (
              <div
                key={incident._id}
                onClick={() => navigate(`/dashboard/incidents/${incident._id}`)}
                className="
                  relative px-6 py-5 border-b border-[#F1F5F9] last:border-0
                  hover:bg-[#F8FAFC] cursor-pointer
                  transition-all duration-200 group
                  hover:pl-8
                "
              >
                {/* left accent bar that slides in on hover */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0F172A] rounded-r-full
                  scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />

                <div className="flex gap-4 items-start">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0
                    ${type.bg} transition-transform duration-200 group-hover:scale-110`}>
                    {type.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h3 className="font-semibold text-[#0F172A] text-sm leading-snug">{title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${status.bg} ${status.text}`}>
                        <span>{status.icon}</span> {status.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-[#64748B] mb-1.5">
                      <span>📍</span>
                      <span className="truncate">{incident.address || 'Location not specified'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                      <span>⏱ {timeAgo(incident.createdAt)}</span>
                      <span>·</span>
                      <span>{incident.user?.username || 'Anonymous'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}