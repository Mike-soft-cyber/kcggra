import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // ✅ useParams not useLocation
import DashboardLayout from '@/components/DashboardLayout';
import API from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download, Share2, ArrowLeft, Calendar, User, Phone, MapPin, CheckCircle2, Clock } from 'lucide-react';

export default function VisitorQRPage() {
  const { visitor_id } = useParams(); // ✅ fixed
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchVisitor(); }, [visitor_id]);

  const fetchVisitor = async () => {
    if (!visitor_id) { navigate('/dashboard/visitors'); return; }
    try {
      const res = await API.get(`/visitors/${visitor_id}`);
      setVisitor(res.data.visitor);
    } catch {
      toast.error('Visitor not found');
      navigate('/dashboard/visitors');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!visitor?.qr_code) return;
    const a = document.createElement('a');
    a.href = visitor.qr_code;
    a.download = `visitor-qr-${visitor.visitor_id}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success('QR code downloaded!');
  };

  const handleShareQR = async () => {
    const url = `${window.location.origin}/visitor/${visitor.visitor_id}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Visitor Pass - ${visitor.guest_name}`, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending:     { bg: 'bg-[#FEF0E7]', text: 'text-[#7A3A00]', icon: Clock,        label: 'Pending'     },
      checked_in:  { bg: 'bg-[#E1F5EE]', text: 'text-[#0F6E56]', icon: CheckCircle2, label: 'Checked In'  },
      checked_out: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', icon: CheckCircle2, label: 'Checked Out' },
      expired:     { bg: 'bg-[#F9EDEB]', text: 'text-[#7A3A2E]', icon: CheckCircle2, label: 'Expired'     },
    };
    const b = map[status] || map.pending;
    const Icon = b.icon;
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${b.bg} ${b.text}`}>
        <Icon className="w-4 h-4" />{b.label}
      </span>
    );
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F172A]" />
      </div>
    </DashboardLayout>
  );

  if (!visitor) return null;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard/visitors')}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] mb-6 text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Visitors
        </button>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-[#0F172A] p-6 text-white">
            <h1 className="text-2xl font-bold text-[#FDE9AB]">Visitor Pass</h1>
            <p className="text-[#94A3B8] text-sm mt-1">Present this QR code at the gate</p>
          </div>

          <div className="p-8">
            <div className="flex justify-center mb-6">{getStatusBadge(visitor.status)}</div>

            {/* QR Code */}
            <div className="border-2 border-[#E2E8F0] rounded-2xl p-6 mb-6">
              {visitor.qr_code ? (
                <img src={visitor.qr_code} alt="Visitor QR Code" className="w-full max-w-xs mx-auto" />
              ) : (
                <div className="w-64 h-64 bg-[#F8FAFC] rounded-xl flex items-center justify-center mx-auto">
                  <p className="text-[#94A3B8] text-sm">QR Code not available</p>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-3 mb-6">
              {[
                { Icon: User,     label: 'Guest Name',  value: visitor.guest_name },
                { Icon: Phone,    label: 'Phone',       value: visitor.guest_phone },
                { Icon: Calendar, label: 'Visit Date',  value: new Date(visitor.visit_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                { Icon: MapPin,   label: 'Purpose',     value: visitor.purpose },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl">
                  <Icon className="w-5 h-5 text-[#64748B] flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#94A3B8]">{label}</p>
                    <p className="font-semibold text-[#0F172A] capitalize">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Visitor ID */}
            <div className="bg-[#EEEDFE] border border-[#7F77DD]/20 rounded-xl p-4 mb-6">
              <p className="text-xs text-[#7F77DD] mb-1 font-semibold">Visitor ID</p>
              <p className="text-lg font-mono font-black text-[#3C3489]">{visitor.visitor_id}</p>
            </div>

            {/* Instructions */}
            <div className="bg-[#FDE9AB]/30 border border-[#FDE9AB] rounded-xl p-4 mb-6">
              <h3 className="font-bold text-[#0F172A] mb-2 text-sm">📋 Instructions</h3>
              <ul className="text-xs text-[#64748B] space-y-1">
                <li>• Present this QR code to the guard at the gate</li>
                <li>• Keep your ID ready for verification</li>
                <li>• Valid only for the date shown above</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#E2E8F0] text-[#0F172A] font-semibold text-sm hover:bg-[#F8FAFC] transition"
              >
                <Download className="w-4 h-4" /> Download QR
              </button>
              <button
                onClick={handleShareQR}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0F172A] text-[#FDE9AB] font-semibold text-sm hover:bg-[#1E293B] transition"
              >
                <Share2 className="w-4 h-4" /> Share Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}