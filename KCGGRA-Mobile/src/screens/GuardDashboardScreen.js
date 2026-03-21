import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const STATUS_OPTIONS = [
  { key: 'on_patrol', label: 'On Patrol', icon: '🚶', color: '#16a34a' },
  { key: 'at_gate', label: 'At Gate', icon: '🚪', color: '#2563eb' },
  { key: 'break', label: 'On Break', icon: '☕', color: '#d97706' },
  { key: 'emergency_response', label: 'Emergency', icon: '🚨', color: '#dc2626' },
]

export default function GuardDashboardScreen() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [shift, setShift] = useState(null)
  const [stats, setStats] = useState(null)
  const [patrolStatus, setPatrolStatus] = useState('on_patrol')
  const [updatingLocation, setUpdatingLocation] = useState(false)
  const [incidents, setIncidents] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [shiftRes, statsRes, incidentsRes] = await Promise.all([
        api.getCurrentShift().catch(() => null),
        api.getGuardStats().catch(() => null),
        api.getIncidents().catch(() => []),
      ])
      console.log('Shift response:', shiftRes)
      setShift(shiftRes?.shift || null)
      setStats(statsRes?.stats || null)
      setIncidents(incidentsRes?.incidents || incidentsRes || [])
    } catch (error) {
      console.error('Failed to fetch guard dashboard:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStartShift = async () => {
    try {
      await api.startShift()
      Alert.alert('Shift Started', 'Your shift has begun. Stay safe!')
      fetchDashboardData()
    } catch (error) {
      Alert.alert('Failed', error.message || 'Failed to start shift')
    }
  }

  const handleEndShift = async () => {
    Alert.alert('End Shift', 'Are you sure you want to end your shift?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Shift',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.endShift()
            Alert.alert('✅ Shift Ended', 'Your shift has ended. Good work!')
            fetchDashboardData()
          } catch (error) {
            Alert.alert('Failed', error.message || 'Failed to end shift')
          }
        }
      }
    ])
  }

  const handleUpdateLocation = async (status) => {
    try {
      setUpdatingLocation(true)
      setPatrolStatus(status)
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync()
      if (permStatus !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed')
        return
      }
      const location = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = location.coords
      await api.updateGuardLocation(latitude, longitude, status)
    } catch (error) {
      console.error('Failed to update location:', error.message)
    } finally {
      setUpdatingLocation(false)
    }
  }

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token')
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  const activeIncidents = incidents.filter(i => i.status === 'reported' || i.status === 'in_progress')

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ backgroundColor: '#1e3a5f' }} className="px-6 pt-14 pb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">Guard Dashboard</Text>
            <Text className="text-blue-200 text-sm mt-1">KCGGRA Security Portal</Text>
          </View>
          <Pressable onPress={handleLogout} className="bg-white/20 rounded-full px-3 py-1">
            <Text className="text-white text-xs font-medium">Sign Out</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>

        {/* Shift Card */}
        <View className="bg-white rounded-2xl p-5"
          style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
          <Text className="text-base font-bold text-gray-900 mb-4">Current Shift</Text>

          {shift ? (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <View className="bg-green-50 rounded-xl px-4 py-2">
                  <Text className="text-green-700 font-semibold text-sm">✅ On Duty</Text>
                </View>
                <Text className="text-gray-400 text-xs">
                  Started: {new Date(shift.startTime).toLocaleTimeString()}
                </Text>
              </View>
              <Pressable
                onPress={handleEndShift}
                className="bg-red-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-bold">End Shift</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Text className="text-gray-500 text-sm text-center">No active shift</Text>
              </View>
              <Pressable
                onPress={handleStartShift}
                className="bg-green-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-bold">Start Shift</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Patrol Status */}
        <View className="bg-white rounded-2xl p-5"
          style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold text-gray-900">Patrol Status</Text>
            {updatingLocation && <ActivityIndicator size="small" color="#16a34a" />}
          </View>
          <View className="flex-row flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <Pressable
                key={s.key}
                onPress={() => handleUpdateLocation(s.key)}
                className="flex-row items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  borderWidth: 1.5,
                  borderColor: patrolStatus === s.key ? s.color : '#e5e7eb',
                  backgroundColor: patrolStatus === s.key ? `${s.color}15` : '#fff',
                  minWidth: '45%',
                }}
              >
                <Text style={{ fontSize: 16 }}>{s.icon}</Text>
                <Text style={{ color: patrolStatus === s.key ? s.color : '#6b7280' }}
                  className="text-xs font-semibold">{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View>
          <Text className="text-lg font-bold text-gray-900 mb-3">Quick Actions</Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => navigation.navigate('VisitorVerification')}
              className="flex-1 bg-white rounded-2xl p-4 items-center"
              style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
            >
              <Text style={{ fontSize: 28 }}>🔍</Text>
              <Text className="text-gray-900 font-semibold text-sm mt-2">Verify Visitor</Text>
              <Text className="text-gray-400 text-xs mt-0.5">Scan QR code</Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('GuardIncidents')}
              className="flex-1 bg-white rounded-2xl p-4 items-center"
              style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
            >
              <Text style={{ fontSize: 28 }}>🚨</Text>
              <Text className="text-gray-900 font-semibold text-sm mt-2">Incidents</Text>
              <Text className="text-gray-400 text-xs mt-0.5">{activeIncidents.length} active</Text>
            </Pressable>
          </View>
        </View>

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <View>
            <Text className="text-lg font-bold text-gray-900 mb-3">Active Incidents</Text>
            <View className="gap-3">
              {activeIncidents.slice(0, 3).map((incident) => (
                <Pressable
                  key={incident._id}
                  onPress={() => navigation.navigate('GuardIncidents')}
                  className="bg-white rounded-2xl p-4"
                  style={{ borderWidth: 0.5, borderColor: '#e5e7eb', borderLeftWidth: 3, borderLeftColor: '#dc2626' }}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-gray-900 font-bold text-sm capitalize">{incident.type}</Text>
                    <View className="bg-red-50 rounded-full px-2 py-0.5">
                      <Text className="text-red-600 text-xs font-medium capitalize">{incident.status}</Text>
                    </View>
                  </View>
                  <Text className="text-gray-500 text-xs" numberOfLines={1}>{incident.description}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  )
}