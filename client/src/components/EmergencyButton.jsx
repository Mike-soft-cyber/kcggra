import { Dialog, DialogHeader, DialogDescription, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from './ui/button';
import API from '@/api';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import { useState } from 'react';

export default function EmergencyButton() {
  const [isOpen, setIsOpen] = useState(false); // ✅ Main dialog state
  const [confirmOpen, setConfirmOpen] = useState(false); // ✅ Confirmation dialog state
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const emergencyTypes = [
    { 
      type: 'burglary', 
      label: 'Burglary', 
      icon: '🏚️', 
      color: 'bg-red-600',
      description: 'Break-in or theft in progress'
    },
    { 
      type: 'fire', 
      label: 'Fire', 
      icon: '🔥', 
      color: 'bg-orange-600',
      description: 'Fire emergency'
    },
    { 
      type: 'medical', 
      label: 'Medical', 
      icon: '🏥', 
      color: 'bg-blue-600',
      description: 'Medical emergency'
    },
    { 
      type: 'suspicious', // ✅ Changed from 'suspicious_activity' to match backend
      label: 'Suspicious', 
      icon: '👁️', 
      color: 'bg-yellow-600',
      description: 'Suspicious person or activity'
    },
  ];

  const handleEmergencySelect = (emergency) => {
    setSelectedType(emergency);
    setIsOpen(false); // Close selection dialog
    setConfirmOpen(true); // Open confirmation dialog
  };

  const reportEmergency = async () => {
    setLoading(true);

    try {
      let location = null;
      
      // Try to get user's location
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true,
            });
          });
          
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (error) {
          console.warn('Location access denied:', error);
        }
      }

      // Create FormData for the request
      const formData = new FormData();
      formData.append('type', selectedType.type);
      formData.append('title', `EMERGENCY: ${selectedType.label}`);
      formData.append('description', `Emergency reported via panic button - ${selectedType.description}`);
      
      if (location) {
        formData.append('latitude', location.latitude);
        formData.append('longitude', location.longitude);
        formData.append('address', 'Emergency location'); // Backend requires address
      } else {
        formData.append('address', 'Location unavailable - Emergency reported');
      }

      await API.post('/incidents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Play alert sound (if available)
      try {
        const audio = new Audio('/emergency-alert.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
      } catch (e) {
        console.log('Audio not available');
      }

      // Show success notification
      toast.success(
        'EMERGENCY ALERT SENT! A-Team has been notified. Help is on the way.',
        {
          duration: 5000,
          icon: '🚨',
        }
      );

      // Vibrate device if supported
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

      setConfirmOpen(false);
      setSelectedType(null);
    } catch (error) {
      toast.error('Failed to send emergency alert. Please call 999 immediately.');
      console.error('Emergency report error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Floating Emergency Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-2xl text-3xl p-0 transition-all duration-300 hover:scale-110 animate-pulse-slow"
          aria-label="Emergency Alert"
        >
          🚨
        </Button>

        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20 pointer-events-none"></div>
      </div>

      {/* Emergency Type Selection Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <span className="text-3xl">🚨</span>
              Emergency Alert
            </DialogTitle>
            <DialogDescription>
              Select the type of emergency to alert A-Team and nearby neighbors
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            {emergencyTypes.map((emergency) => (
              <Button
                key={emergency.type}
                onClick={() => handleEmergencySelect(emergency)}
                className={`${emergency.color} text-white h-auto py-4 justify-start gap-3 transition-transform hover:scale-105`}
                variant="default"
              >
                <span className="text-3xl">{emergency.icon}</span>
                <div className="text-left flex-1">
                  <p className="font-bold text-base">{emergency.label}</p>
                  <p className="text-xs opacity-90 font-normal">
                    {emergency.description}
                  </p>
                </div>
                <span className="text-xl">→</span>
              </Button>
            ))}
          </div>

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-sm text-yellow-800">
              For life-threatening emergencies, also call <strong>999</strong>
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center gap-4 mb-4">
              <div
                className={`w-20 h-20 ${selectedType?.color} rounded-full flex items-center justify-center animate-bounce-slow`}
              >
                <span className="text-5xl">{selectedType?.icon}</span>
              </div>

              <DialogTitle className="text-2xl text-center">
                Confirm Emergency Alert
              </DialogTitle>

              <DialogDescription className="text-center">
                <p className="mb-2 font-medium text-gray-700">
                  {selectedType?.description}
                </p>
                <p className="text-sm text-gray-600">
                  This will immediately notify:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• A-Team security guards (via SMS + App)</li>
                  <li>• Nearby neighbors (via App notification)</li>
                  <li>• Community admin dashboard</li>
                </ul>
              </DialogDescription>
            </div>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-600 mx-auto mb-3"></div>
              <p className="text-gray-600 font-medium">
                Sending emergency alert...
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Notifying A-Team and neighbors
              </p>
            </div>
          ) : (
            <>
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-sm text-red-800">
                  <strong>Warning:</strong> Only use for genuine emergencies.
                  False alarms may result in penalties.
                </AlertDescription>
              </Alert>

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  onClick={reportEmergency}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-bold"
                  disabled={loading}
                >
                  <span className="text-2xl mr-2">🚨</span>
                  SEND EMERGENCY ALERT
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setConfirmOpen(false);
                    setSelectedType(null);
                  }}
                  className="w-full"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}