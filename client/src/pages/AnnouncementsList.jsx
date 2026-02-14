import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import API from '@/api';

export default function AnnouncementsList() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await API.get('/announcements?limit=50');
      setAnnouncements(response.data.announcements || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">Community updates and notifications</p>
        </div>

        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement._id}
              onClick={() => navigate(`/dashboard/announcements/${announcement._id}`)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md cursor-pointer transition"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">{announcement.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  announcement.category === 'security' ? 'bg-red-100 text-red-800' :
                  announcement.category === 'event' ? 'bg-blue-100 text-blue-800' :
                  announcement.category === 'alert' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {announcement.category}
                </span>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-2">{announcement.content}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{announcement.author_id?.username || 'Admin'}</span>
                <span>•</span>
                <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}