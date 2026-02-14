import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import API from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Share2, 
  ArrowLeft,
  Calendar,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function VisitorQRPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisitor();
  }, []);

  const fetchVisitor = async () => {
    try {
      const response = await API.get(`/visitors/${location.visitor_id}`);
      setVisitor(response.data.visitor);
    } catch (error) {
      console.error('Failed to fetch visitor:', error);
      toast.error('Visitor not found');
      navigate('/dashboard/visitors');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!visitor?.qr_code) return;

    // Create download link
    const link = document.createElement('a');
    link.href = visitor.qr_code;
    link.download = `visitor-qr-${visitor.visitor_id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('QR code downloaded!');
  };

  const handleShareQR = async () => {
    const qrUrl = `${window.location.origin}/visitor/${visitor.visitor_id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Visitor Pass - ${visitor.guest_name}`,
          text: `Your visitor pass for KCGGRA on ${new Date(visitor.visit_date).toLocaleDateString()}`,
          url: qrUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(qrUrl);
      toast.success('Link copied to clipboard!');
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

  if (!visitor) {
    return null;
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending' },
      checked_in: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2, label: 'Checked In' },
      checked_out: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle2, label: 'Checked Out' },
      expired: { bg: 'bg-red-100', text: 'text-red-800', icon: CheckCircle2, label: 'Expired' },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/dashboard/visitors')}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Visitors
        </Button>

        {/* QR Code Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Visitor Pass</h1>
            <p className="text-green-100">Present this QR code at the gate</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Status */}
            <div className="flex justify-center mb-6">
              {getStatusBadge(visitor.status)}
            </div>

            {/* QR Code */}
            <div className="bg-white border-4 border-gray-200 rounded-xl p-6 mb-6">
              {visitor.qr_code ? (
                <img
                  src={visitor.qr_code}
                  alt="Visitor QR Code"
                  className="w-full max-w-sm mx-auto"
                />
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                  <p className="text-gray-500">QR Code not available</p>
                </div>
              )}
            </div>

            {/* Visitor Details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Guest Name</p>
                  <p className="font-medium text-gray-900">{visitor.guest_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="font-medium text-gray-900">{visitor.guest_phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Visit Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(visitor.visit_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Purpose</p>
                  <p className="font-medium text-gray-900 capitalize">{visitor.purpose}</p>
                </div>
              </div>
            </div>

            {/* Visitor ID */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-xs text-blue-700 mb-1 font-medium">Visitor ID</p>
              <p className="text-lg font-mono font-bold text-blue-900">
                {visitor.visitor_id}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-yellow-900 mb-2">📋 Instructions</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Present this QR code to the guard at the gate</li>
                <li>• Keep your ID ready for verification</li>
                <li>• Valid only for the date shown above</li>
                <li>• Contact your host if you have any issues</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleDownloadQR}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download QR
              </Button>
              <Button
                onClick={handleShareQR}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Link
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}