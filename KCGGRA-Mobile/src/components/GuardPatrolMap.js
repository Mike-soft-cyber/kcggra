import { useEffect, useState, useRef } from 'react';
import React from 'react';
import { View, Text, Animated } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import api from '../services/api';
import { SkeletonMapBox } from './SkeletonLoader';

const STATUS_COLORS = {
  on_patrol:          '#1D9E75',
  at_gate:            '#378ADD',
  break:              '#EF9F27',
  emergency_response: '#A76059',
}

// Pin that drops in with bounce
function AnimatedMarker({ guard, color }) {
  const drop = useRef(new Animated.Value(-30)).current
  const coords = guard.location?.coordinates
  if (!coords) return null
  const [longitude, latitude] = coords

  useEffect(() => {
    Animated.spring(drop, {
      toValue: 0, tension: 60, friction: 8, useNativeDriver: true,
    }).start()
  }, [])

  return (
    <React.Fragment key={guard._id}>
      <Marker
        coordinate={{ latitude, longitude }}
        title={guard.guard_id?.username || 'Guard'}
        description={guard.status?.replace(/_/g, ' ')}
        pinColor={color}
      />
      <Circle
        center={{ latitude, longitude }}
        radius={50}
        fillColor={`${color}18`}
        strokeColor={`${color}40`}
        strokeWidth={1}
      />
    </React.Fragment>
  )
}

export default function GuardPatrolMap() {
  const [guards, setGuards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGuards()
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

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: '#021317' }}>Live Guard Patrol</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#1D9E75' }} />
          <Text style={{ fontSize: 11, color: '#9FA8A7', fontWeight: '600' }}>{guards.length} on duty</Text>
        </View>
      </View>

      {loading ? (
        <SkeletonMapBox />
      ) : (
        <View style={{ borderRadius: 18, overflow: 'hidden', height: 250 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{ latitude: -1.2921, longitude: 36.8219, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
          >
            {guards.map(guard => {
              const color = STATUS_COLORS[guard.status] || STATUS_COLORS.on_patrol
              return <AnimatedMarker key={guard._id} guard={guard} color={color} />
            })}
          </MapView>
        </View>
      )}

      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <View key={status} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            <Text style={{ fontSize: 11, color: '#9FA8A7', textTransform: 'capitalize' }}>
              {status.replace(/_/g, ' ')}
            </Text>
          </View>
        ))}
      </View>

      {!loading && guards.length === 0 && (
        <View style={{ marginTop: 10, backgroundColor: '#FDE9AB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
          <Text style={{ color: '#7A5C00', fontSize: 12, textAlign: 'center', fontWeight: '600' }}>
            No guards currently on patrol
          </Text>
        </View>
      )}
    </View>
  )
}