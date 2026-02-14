import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import API from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  QrCode, 
  Plus, 
  Calendar, 
  User, 
  Phone, 
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Share2
} from 'lucide-react';

export default function VisitorsPage() {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_phone: '',
    visit_date: '',
    purpose: 'guest',
  });

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const response = await API.get('/visitors');
      setVisitors(response.data.visitors || []);
    } catch (error) {
      console.error('Failed to fetch visitors:', error);
      toast.error('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVisitor = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await API.post('/visitors', {
        guest_name: formData.guest_name,
        guest_phone: formData.guest_phone.startsWith('254') 
          ? formData.guest_phone 
          : `254${formData.guest_phone.replace(/^0/, '')}`,
        visit_date: formData.visit_date,
        purpose: formData.purpose,
      });

      toast.success('Visitor QR code created! SMS sent to guest.');
      setShowCreateModal(false);
      setFormData({
        guest_name: '',
        guest_phone: '',
        visit_date: '',
        purpose: 'guest',
      });
      fetchVisitors();
    } catch (error) {
      console.error('Failed to create visitor:', error);
      toast.error(error.response?.data?.message || 'Failed to create visitor QR');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelVisitor = async (visitorId) => {
    if (!confirm('Cancel this visitor pass?')) return;

    try {
      await API.delete(`/visitors/${visitorId}`);
      toast.success('Visitor pass cancelled');
      fetchVisitors();
    } catch (error) {
      toast.error('Failed to cancel visitor pass');
    }
  };

  const handleViewQR = (visitor) => {
    navigate(`/dashboard/visitors/${visitor.visitor_id}`);
  };

  const handleShareQR = async (visitor) => {
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
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(qrUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        icon: Clock,
        label: 'Pending' 
      },
      checked_in: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        icon: CheckCircle2,
        label: 'Checked In' 
      },
      checked_out: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800', 
        icon: CheckCircle2,
        label: 'Checked Out' 
      },
      expired: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        icon: XCircle,
        label: 'Expired' 
      },
      cancelled: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        icon: XCircle,
        label: 'Cancelled' 
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading visitors...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Visitor Passes</h1>
              <p className="text-gray-600 mt-1">Generate QR codes for your guests</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Visitor Pass
            </Button>
          </div>
        </div>

        {/* Visitors Grid */}
        {visitors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Visitor Passes</h3>
            <p className="text-gray-600 mb-6">Create a visitor pass to generate a QR code for your guests</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Pass
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visitors.map((visitor) => (
              <div
                key={visitor._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                <div className="p-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{(visitor.purpose)}</span>
                    {getStatusBadge(visitor.status)}
                  </div>

                  {/* Guest Info */}
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {visitor.guest_name}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{visitor.guest_phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(visitor.visit_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="capitalize">{visitor.purpose}</span>
                    </div>
                  </div>

                  {/* Visitor ID */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Visitor ID</p>
                    <p className="text-sm font-mono font-bold text-gray-900">
                      {visitor.visitor_id}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewQR(visitor)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      View QR
                    </Button>
                    
                    {visitor.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleShareQR(visitor)}
                          variant="outline"
                          size="sm"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleCancelVisitor(visitor._id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Visitor Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Visitor Pass</DialogTitle>
              <DialogDescription>
                Generate a QR code for your guest. They'll receive an SMS with the link.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateVisitor} className="space-y-4">
              <div>
                <Label>Guest Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    placeholder="John Doe"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Guest Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={formData.guest_phone}
                    onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                    placeholder="0712345678 or 254712345678"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  SMS will be sent to this number
                </p>
              </div>

              <div>
                <Label>Visit Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="date"
                    value={formData.visit_date}
                    onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Purpose *</Label>
                <Select
                  value={formData.purpose}
                  onValueChange={(value) => setFormData({ ...formData, purpose: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="guest"> Guest Visit</SelectItem>
                      <SelectItem value="plumber"> Plumber</SelectItem>
                      <SelectItem value="electrician"> Electrician</SelectItem>
                      <SelectItem value="delivery"> Delivery</SelectItem>
                      <SelectItem value="other"> Other</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {creating ? 'Creating...' : 'Create Pass'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}