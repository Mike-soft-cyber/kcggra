import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function PublicVisitorQR() {
  const { visitor_id } = useParams();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisitor();
  }, []);

  const fetchVisitor = async () => {
    try {
      // Public endpoint - no auth needed
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/visitors/public/${visitor_id}`
      );
      setVisitor(response.data.visitor);
    } catch (error) {
      console.error('Failed to fetch visitor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Visitor Pass Not Found</h1>
          <p className="text-gray-600">This visitor pass may have expired or been cancelled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">KCGGRA</h1>
          <p className="text-gray-600">Community Portal</p>
        </div>

        {/* QR Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Status Header */}
          <div className={`p-4 text-center ${
            visitor.status === 'pending' ? 'bg-yellow-500' :
            visitor.status === 'checked_in' ? 'bg-green-500' :
            visitor.status === 'checked_out' ? 'bg-gray-500' :
            'bg-red-500'
          } text-white`}>
            <p className="font-bold text-lg capitalize">{visitor.status.replace('_', ' ')}</p>
          </div>

          {/* QR Code */}
          <div className="p-8">
            <div className="bg-white border-4 border-gray-200 rounded-xl p-4 mb-6">
              {visitor.qr_code && (
                <img
                  src={visitor.qr_code}
                  alt="Visitor QR Code"
                  className="w-full max-w-xs mx-auto"
                />
              )}
            </div>

            {/* Visitor Details */}
            <div className="space-y-3 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Guest Name</p>
                <p className="text-lg font-bold text-gray-900">{visitor.guest_name}</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500">Visit Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(visitor.visit_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500">Visitor ID</p>
                <p className="font-mono font-bold text-gray-900">{visitor.visitor_id}</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">📋 Instructions</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Present this QR code at the gate</li>
                <li>• Have your ID ready for verification</li>
                <li>• Valid only for the date shown above</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Powered by KCGGRA Community Portal
          </p>
        </div>
      </div>
    </div>
  );
}