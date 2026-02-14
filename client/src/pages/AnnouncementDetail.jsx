import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import API from '@/api';
import { ArrowLeft } from 'lucide-react';

export default function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncement();
  }, [id]);

  const fetchAnnouncement = async () => {
    try {
      const response = await API.get(`/announcements/${id}`);
      setAnnouncement(response.data.announcement);
    } catch (error) {
      console.error('Failed to fetch announcement:', error);
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

  if (!announcement) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Announcement not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/dashboard/announcements')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Announcements
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{announcement.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                announcement.category === 'security' ? 'bg-red-100 text-red-800' :
                announcement.category === 'event' ? 'bg-blue-100 text-blue-800' :
                announcement.category === 'alert' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {announcement.category}
              </span>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
            </div>

            {announcement.attachments && announcement.attachments.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                {announcement.attachments.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Attachment ${index + 1}`}
                    className="rounded-lg border"
                  />
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                  {announcement.author_id?.username?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {announcement.author_id?.username || 'Admin'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(announcement.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}