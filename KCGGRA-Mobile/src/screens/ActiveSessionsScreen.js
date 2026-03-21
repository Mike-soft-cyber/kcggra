import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export default function ActiveSessionsScreen() {
  const navigation = useNavigation()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => { fetchSessions() }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const res = await api.getSessions()
      setSessions(res.sessions || res || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOutAll = async () => {
    Alert.alert('Sign Out All', 'This will sign you out of all devices including this one.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out All',
        style: 'destructive',
        onPress: async () => {
          try {
            setSigningOut(true)
            await api.signOutAll()
            await SecureStore.deleteItemAsync('token')
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
          } catch (error) {
            Alert.alert('Failed', error.message || 'Failed to sign out')
          } finally {
            setSigningOut(false)
          }
        }
      }
    ])
  }

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ backgroundColor: '#16a34a' }} className="px-6 pt-14 pb-6">
        <Pressable onPress={() => navigation.goBack()} className="mb-4">
          <Text className="text-green-200 font-medium">← Back</Text>
        </Pressable>
        <Text className="text-white text-2xl font-bold">Active Sessions</Text>
        <Text className="text-green-200 text-sm mt-1">Devices logged into your account</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {sessions.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center"
            style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
            <Text className="text-gray-400">No active sessions found</Text>
          </View>
        ) : (
          sessions.map((session, index) => (
            <View key={index} className="bg-white rounded-2xl p-4"
              style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center">
                    <Text style={{ fontSize: 18 }}>📱</Text>
                  </View>
                  <View>
                    <Text className="text-gray-900 font-medium text-sm">{session.device || 'Unknown Device'}</Text>
                    <Text className="text-gray-400 text-xs">{session.ip_address}</Text>
                    <Text className="text-gray-400 text-xs">
                      {new Date(session.last_active).toLocaleString()}
                    </Text>
                  </View>
                </View>
                {index === 0 && (
                  <View className="bg-green-50 rounded-full px-2 py-1">
                    <Text className="text-green-700 text-xs font-medium">Current</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}

        <Pressable
          onPress={handleSignOutAll}
          disabled={signingOut}
          className="bg-white rounded-2xl py-4 items-center mt-2"
          style={{ borderWidth: 0.5, borderColor: '#fecaca', opacity: signingOut ? 0.7 : 1 }}
        >
          {signingOut ? <ActivityIndicator color="#ef4444" /> : (
            <Text className="text-red-500 font-semibold">Sign Out of All Devices</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  )
}