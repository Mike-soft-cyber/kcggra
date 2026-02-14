import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import GuardMap from '@/components/GuardMap';
import API from '@/api';

export default function GuardMapPage() {
  const [guards, setGuards] = useState([]);

  useEffect(() => {
    fetchGuards();
    const interval = setInterval(fetchGuards, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchGuards = async () => {
    try {
      const response = await API.get('/guards/active-locations');
      setGuards(response.data.guards || []);
    } catch (error) {
      console.error('Failed to fetch guards:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Live Guard Activity</h1>
          <p className="text-gray-600 mt-1">Real-time patrol tracking</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div style={{ height: '600px' }}>
            <GuardMap guards={guards} />
          </div>
        </div>

        {/* Guard List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {guards.map((guard) => (
            <div key={guard._id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">👮</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{guard.name}</p>
                  <p className="text-sm text-gray-600">{guard.zone}</p>
                  <p className="text-xs text-gray-500 capitalize">{guard.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}