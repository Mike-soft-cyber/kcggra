import { useState, useEffect } from 'react';
import API from '@/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ActiveSessions() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await API.get('/user/sessions');
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const handleSignOutAll = async () => {
    if (!confirm('Sign out of all devices?')) return;
    
    try {
      await API.post('/user/signout-all');
      toast.success('Signed out of all devices');
      window.location.href = '/login';
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Active Sessions</h1>
      
      <div className="space-y-4">
        {sessions.map((session, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{session.device}</p>
                <p className="text-sm text-gray-600">{session.ip_address}</p>
                <p className="text-xs text-gray-500">
                  Last active: {new Date(session.last_active).toLocaleString()}
                </p>
              </div>
              {index === 0 && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Current Session
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <Button 
        onClick={handleSignOutAll}
        variant="outline"
        className="mt-6 border-red-300 text-red-600"
      >
        Sign Out of All Devices
      </Button>
    </div>
  );
}