import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom guard icon
const guardIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOCIgZmlsbD0iIzEwYjk4MSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjMiLz4KICA8dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+8J+RrjwvdGV4dD4KPC9zdmc+',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

export default function GuardMap({ guards, center, onViewFullMap }) {
  const [map, setMap] = useState(null);

  // Default center (Nairobi - adjust to your neighborhood coordinates)
  const defaultCenter = center || [-1.2921, 36.8219];

  const getStatusColor = (status) => {
    const colors = {
      on_patrol: '#10b981', // Green
      at_gate: '#3b82f6',   // Blue
      break: '#f59e0b',     // Orange
      emergency_response: '#ef4444', // Red
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      on_patrol: 'On Patrol',
      at_gate: 'At Gate',
      break: 'On Break',
      emergency_response: 'Emergency Response',
    };
    return labels[status] || status;
  };

  useEffect(() => {
    if (map && guards.length > 0) {
      // Fit map to show all guards
      const bounds = guards.map(guard => [
        guard.location.coordinates[1],
        guard.location.coordinates[0]
      ]);
      
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [map, guards]);

  return (
    <div className="relative">
      <div className="h-96 rounded-lg overflow-hidden border-2 border-gray-200">
        <MapContainer
          center={defaultCenter}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          ref={setMap}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {guards.map((guard) => {
            const position = [
              guard.location.coordinates[1], // Latitude
              guard.location.coordinates[0]  // Longitude
            ];

            return (
              <div key={guard._id}>
                {/* Guard marker */}
                <Marker position={position} icon={guardIcon}>
                  <Popup>
                    <div className="p-2">
                      <p className="font-bold text-gray-800 mb-1">
                        {guard.guard_id?.username || 'Guard'}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        Zone: {guard.zone}
                      </p>
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getStatusColor(guard.status) }}
                        />
                        <span className="text-xs text-gray-600">
                          {getStatusLabel(guard.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Last update: {new Date(guard.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>

                {/* Patrol radius circle */}
                <Circle
                  center={position}
                  radius={100} // 100 meters
                  pathOptions={{
                    color: getStatusColor(guard.status),
                    fillColor: getStatusColor(guard.status),
                    fillOpacity: 0.1,
                    weight: 2,
                  }}
                />
              </div>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs">
        <p className="font-bold text-gray-800 mb-2">Status Legend</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">On Patrol</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">At Gate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-600">On Break</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Emergency</span>
          </div>
        </div>
      </div>

      {/* Guard count badge */}
      <div className="absolute top-4 left-4 bg-green-600 text-white rounded-lg shadow-lg px-4 py-2">
        <p className="text-sm font-bold">
          {guards.length} Guard{guards.length !== 1 ? 's' : ''} Active
        </p>
      </div>

      {/* Full map button */}
      {onViewFullMap && (
        <button
          onClick={onViewFullMap}
          className="absolute bottom-4 right-4 bg-white text-blue-600 px-4 py-2 rounded-lg shadow-lg hover:bg-blue-50 transition text-sm font-medium"
        >
          Full Map →
        </button>
      )}
    </div>
  );
}