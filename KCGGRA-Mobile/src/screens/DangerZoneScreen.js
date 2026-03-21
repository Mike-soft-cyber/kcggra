import { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export default function DangerZoneScreen() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(false)

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This action is permanent and cannot be undone. All your data will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true)
              await api.deleteAccount()
              await SecureStore.deleteItemAsync('token')
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
            } catch (error) {
              Alert.alert('Failed', error.message || 'Failed to delete account')
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Account',
      'Your account will be temporarily disabled. You can reactivate by contacting admin.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => Alert.alert('Contact Admin', 'Please contact your admin to deactivate your account.')
        }
      ]
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ backgroundColor: '#dc2626' }} className="px-6 pt-14 pb-6">
        <Pressable onPress={() => navigation.goBack()} className="mb-4">
          <Text className="text-red-200 font-medium">← Back</Text>
        </Pressable>
        <Text className="text-white text-2xl font-bold">Danger Zone</Text>
        <Text className="text-red-200 text-sm mt-1">Irreversible account actions</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>

        <View className="bg-red-50 rounded-2xl p-4 flex-row gap-3"
          style={{ borderWidth: 1, borderColor: '#fecaca' }}>
          <Text style={{ fontSize: 16 }}>⚠️</Text>
          <Text className="text-red-700 text-sm flex-1">
            Actions in this section are permanent and cannot be undone. Please proceed with caution.
          </Text>
        </View>

        {/* Deactivate */}
        <View className="bg-white rounded-2xl p-5"
          style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
          <Text className="text-base font-bold text-gray-900 mb-1">Deactivate Account</Text>
          <Text className="text-gray-500 text-sm mb-4">
            Temporarily disable your account. You can reactivate by contacting admin.
          </Text>
          <Pressable
            onPress={handleDeactivate}
            className="border border-orange-300 rounded-xl py-3 items-center"
          >
            <Text className="text-orange-600 font-semibold">Deactivate Account</Text>
          </Pressable>
        </View>

        {/* Delete */}
        <View className="bg-white rounded-2xl p-5"
          style={{ borderWidth: 0.5, borderColor: '#fecaca' }}>
          <Text className="text-base font-bold text-red-600 mb-1">Delete Account</Text>
          <Text className="text-gray-500 text-sm mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </Text>
          <Pressable
            onPress={handleDeleteAccount}
            disabled={loading}
            className="bg-red-600 rounded-xl py-3 items-center"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text className="text-white font-bold">Delete My Account</Text>
            )}
          </Pressable>
        </View>

      </ScrollView>
    </View>
  )
}