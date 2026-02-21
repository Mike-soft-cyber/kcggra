import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import API from '@/api';
import { Search, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchSubscriptions();
  }, [filterStatus]);

  const fetchSubscriptions = async () => {
    try {
      const response = await API.get(`/admin/subscriptions?filter=${filterStatus}`);
      setSubscriptions(response.data.subscriptions || []);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Resident', 'Email', 'Street', 'House', 'Status', 'Due (KES)', 'Paid (KES)', 'Last Payment'];
    const rows = filteredSubscriptions.map(sub => [
      sub.username,
      sub.email || 'N/A',
      sub.street,
      sub.house,
      sub.subStatus,
      sub.dueAmount,
      sub.paidAmount,
      sub.lastPayment ? new Date(sub.lastPayment).toLocaleDateString() : 'Never'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('CSV exported successfully');
  };

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.street.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusCounts = {
    all: subscriptions.length,
    paid: subscriptions.filter(s => s.subStatus === 'paid').length,
    overdue: subscriptions.filter(s => s.subStatus === 'unpaid').length,
    pending: subscriptions.filter(s => s.subStatus === 'grace').length,
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600 mt-1">Manage resident subscription payments</p>
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

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {['all', 'paid', 'overdue', 'pending'].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status ? 'bg-[#1a4d4d]' : ''}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="ml-2 text-xs">({statusCounts[status]})</span>
                </Button>
              ))}
            </div>

            {/* Export Button */}
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resident
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Street
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    House
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due (KES)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid (KES)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Payment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <tr
                      key={sub._id}
                      className="hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => navigate(`/admin/residents/${sub._id}`)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{sub.username}</p>
                          <p className="text-sm text-gray-500">{sub.email || 'No email'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {sub.street}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {sub.house}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          sub.subStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : sub.subStatus === 'unpaid'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sub.subStatus === 'paid' ? 'Paid' : sub.subStatus === 'unpaid' ? 'Overdue' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {sub.dueAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${
                          sub.paidAmount >= sub.dueAmount ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {sub.paidAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {sub.lastPayment
                          ? new Date(sub.lastPayment).toLocaleDateString()
                          : 'Never'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}