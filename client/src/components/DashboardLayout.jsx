import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import API from '@/api';
import { Toaster } from 'sonner';

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await API.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" richColors />
      <Navbar user={user} onLogout={handleLogout} />
      
      {/* Main Content Area */}
      <main className="w-full">
        {children}
      </main>

      {/* Footer (Optional) */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">
                © 2024 KCGGRA. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-green-600 transition">Privacy Policy</a>
              <a href="#" className="hover:text-green-600 transition">Terms of Service</a>
              <a href="#" className="hover:text-green-600 transition">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}