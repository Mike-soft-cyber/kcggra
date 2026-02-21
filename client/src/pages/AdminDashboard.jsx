import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import API from '@/api';
import { Users, Wallet, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalResidents: 0,
    collectionRate: 0,
    overdueAccounts: 0,
    monthlyRevenue: 0,
    paidCount: 0,
    totalAmount: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [attentionNeeded, setAttentionNeeded] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, paymentsRes, projectsRes, usersRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/payment-trend'),
        API.get('/projects'),
        API.get('/admin/attention-needed'),
      ]);

      setStats(statsRes.data);
      setChartData(paymentsRes.data.trend || []);
      setActiveProjects(projectsRes.data.projects?.slice(0, 2) || []);
      setAttentionNeeded(usersRes.data.users?.slice(0, 4) || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">KCGGRA Admin Overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Residents"
            value={stats.totalResidents}
            subtitle={`+2 this month`}
            icon={Users}
            iconBg="bg-blue-50"
            trend="up"
          />
          
          <StatCard
            title="Collection Rate"
            value={`${stats.collectionRate}%`}
            subtitle={`${stats.paidCount}/${stats.totalResidents} paid`}
            icon={Wallet}
            iconBg="bg-green-50"
          />
          
          <StatCard
            title="Overdue Accounts"
            value={stats.overdueAccounts}
            subtitle="Requires follow-up"
            icon={AlertTriangle}
            iconBg="bg-red-50"
            trend="down"
          />
          
          <StatCard
            title="Monthly Revenue"
            value={`KES ${(stats.monthlyRevenue / 1000).toFixed(0)}K`}
            subtitle="Feb 2026"
            icon={TrendingUp}
            iconBg="bg-purple-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Collection Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Collection Trend</h2>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000}K`}
                />
                <Tooltip 
                  formatter={(value) => [`KES ${value.toLocaleString()}`, 'Amount']}
                  contentStyle={{ 
                    backgroundColor: '#1a4d4d',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Bar 
                  dataKey="collected" 
                  fill="#1a4d4d" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={50}
                />
                <Bar 
                  dataKey="target" 
                  fill="#e5e7eb" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Attention Needed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Attention Needed</h2>
            
            <div className="space-y-3">
              {attentionNeeded.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">All accounts up to date!</p>
              ) : (
                attentionNeeded.map((resident) => (
                  <div 
                    key={resident._id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition cursor-pointer"
                    onClick={() => navigate(`/admin/residents/${resident._id}`)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{resident.username}</p>
                      <p className="text-sm text-gray-600">{resident.street}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      resident.subStatus === 'unpaid' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {resident.subStatus === 'unpaid' ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Active CapEx Campaigns */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Active CapEx Campaigns</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeProjects.map((project) => {
              const progressPercent = ((project.currentAmount / project.targetAmount) * 100).toFixed(0);
              
              return (
                <div 
                  key={project._id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-[#1a4d4d] transition cursor-pointer"
                  onClick={() => navigate('/admin/capex')}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{project.projectName}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Active
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">KES {project.currentAmount.toLocaleString()} raised</span>
                      <span className="font-bold text-[#1a4d4d]">{progressPercent}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-[#1a4d4d] to-[#0f3333] h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{project.contributors?.length || 0} contributors</span>
                      <span>Target: KES {(project.targetAmount / 1000000).toFixed(2)}M</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}