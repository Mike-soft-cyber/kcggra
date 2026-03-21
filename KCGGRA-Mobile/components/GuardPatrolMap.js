import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import api from '../src/services/api';
const STATUS_COLORS = {
  on_patrol: '#16a34a',
  at_gate: '#2563eb',
  break: '#d97706',
  emergency_response: '#dc2626',
}

export default function GuardPatrolMap() {
  const [guards, setGuards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGuards()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchGuards, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchGuards = async () => {
    try {
      const res = await api.getActiveGuardLocations()
      setGuards(res.guards || res || [])
    } catch (error) {
      console.error('Failed to fetch guard locations:', error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <View className="h-64 items-center justify-center bg-gray-100 rounded-2xl">
      <ActivityIndicator size="large" color="#16a34a" />
      <Text className="text-gray-400 text-sm mt-2">Loading guard map...</Text>
    </View>
  )

  return (
    <View className="px-4 py-2">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold text-gray-900">Live Guard Patrol</Text>
        <View className="flex-row items-center gap-1">
          <View className="w-2 h-2 rounded-full bg-green-500" />
          <Text className="text-xs text-gray-400">{guards.length} on duty</Text>
        </View>
      </View>

      {/* Map */}
      <View className="rounded-2xl overflow-hidden" style={{ height: 250 }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: -1.2921,
            longitude: 36.8219,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {guards.map((guard) => {
            const coords = guard.location?.coordinates
            if (!coords) return null
            const [longitude, latitude] = coords
            const color = STATUS_COLORS[guard.status] || STATUS_COLORS.on_patrol

            return (
              <View key={guard._id}>
                <Marker
                  coordinate={{ latitude, longitude }}
                  title={guard.guard_id?.username || 'Guard'}
                  description={guard.status?.replace('_', ' ')}
                  pinColor={color}
                />
                <Circle
                  center={{ latitude, longitude }}
                  radius={50}
                  fillColor={`${color}20`}
                  strokeColor={`${color}40`}
                  strokeWidth={1}
                />
              </View>
            )
          })}
        </MapView>
      </View>

      {/* Legend */}
      <View className="flex-row flex-wrap gap-3 mt-3">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <View key={status} className="flex-row items-center gap-1">
            <View style={{ backgroundColor: color }} className="w-2.5 h-2.5 rounded-full" />
            <Text className="text-xs text-gray-500 capitalize">{status.replace('_', ' ')}</Text>
          </View>
        ))}
      </View>

      {guards.length === 0 && (
        <View className="mt-3 bg-yellow-50 rounded-xl px-4 py-3"
          style={{ borderWidth: 0.5, borderColor: '#fde68a' }}>
          <Text className="text-yellow-700 text-xs text-center">
            No guards currently on patrol
          </Text>
        </View>
      )}
    </View>
  )
}