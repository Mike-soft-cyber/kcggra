import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import API from '@/api';
import { Search, Download, UserPlus, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminResidents() {
  const navigate = useNavigate();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const response = await API.get('/admin/residents');
      setResidents(response.data.residents || []);
    } catch (error) {
      console.error('Failed to fetch residents:', error);
      toast.error('Failed to load residents');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'grace':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredResidents = residents.filter((resident) => {
    const matchesSearch =
      resident.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.phone?.includes(searchTerm);

    const matchesStatus =
      statusFilter === 'all' || resident.subStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Street', 'Role', 'Status', 'Last Payment', 'Created'];
    const rows = filteredResidents.map((resident) => [
      resident.username,
      resident.email || 'N/A',
      resident.phone || 'N/A',
      resident.street,
      resident.role,
      resident.subStatus,
      resident.lastPayment ? new Date(resident.lastPayment).toLocaleDateString() : 'Never',
      new Date(resident.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `residents_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('CSV exported successfully');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a4d4d]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Residents</h1>
            <p className="text-gray-600 mt-1">Community member directory</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search residents..."
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'paid', label: 'Paid' },
                { value: 'unpaid', label: 'Overdue' },
                { value: 'grace', label: 'Pending' },
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(filter.value)}
                  className={statusFilter === filter.value ? 'bg-[#1a4d4d]' : ''}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            {/* Export Button */}
            <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Residents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResidents.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Residents Found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredResidents.map((resident) => (
              <div
                key={resident._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`/admin/residents/${resident._id}`)}
              >
                {/* Avatar and Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-full bg-[#1a4d4d] text-white flex items-center justify-center text-xl font-bold">
                    {getInitials(resident.username)}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(resident.subStatus)}`}>
                    {resident.subStatus === 'paid'
                      ? 'Paid'
                      : resident.subStatus === 'unpaid'
                      ? 'Overdue'
                      : 'Pending'}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900 text-lg">{resident.username}</h3>
                  <p className="text-sm text-gray-600">{resident.street}</p>

                  {/* Contact */}
                  <div className="space-y-1 pt-2 border-t border-gray-100">
                    {resident.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{resident.email}</span>
                      </div>
                    )}
                    {resident.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{resident.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Last Payment */}
                  {resident.lastPayment && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Last payment:{' '}
                        <span className="font-medium text-gray-700">
                          {new Date(resident.lastPayment).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}