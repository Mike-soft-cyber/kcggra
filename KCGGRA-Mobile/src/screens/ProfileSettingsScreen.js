import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

export default function ProfileSettingsScreen() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    street: '',
  })

  useEffect(() => { fetchMe() }, [])

  const fetchMe = async () => {
    try {
      setLoading(true)
      const res = await api.getMe()
      const user = res.user || res
      setFormData({
        username: user.username || '',
        email: user.email || '',
        street: user.street || '',
        phone: user.phone || '',
})
    } catch (error) {
      console.error('Failed to fetch profile:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.username || !formData.street) {
      Alert.alert('Missing fields', 'Name and street are required')
      return
    }
    try {
      setSaving(true)
      await api.updateProfile(formData)
      Alert.alert('✅ Saved', 'Your profile has been updated!')
      navigation.goBack()
    } catch (error) {
      Alert.alert('Failed', error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ backgroundColor: '#16a34a' }} className="px-6 pt-14 pb-6">
        <Pressable onPress={() => navigation.goBack()} className="mb-4">
          <Text className="text-green-200 font-medium">← Back</Text>
        </Pressable>
        <Text className="text-white text-2xl font-bold">Profile Information</Text>
        <Text className="text-green-200 text-sm mt-1">Update your personal details</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="bg-white rounded-2xl p-5 gap-4"
          style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>

          {/* Full Name */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Full Name</Text>
            <TextInput
              value={formData.username}
              onChangeText={(v) => setFormData({ ...formData, username: v })}
              placeholder="John Kamau"
              placeholderTextColor="#9ca3af"
              className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
              style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
            />
          </View>

          {/* Email */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Email <Text className="text-gray-400 font-normal">(optional)</Text>
            </Text>
            <TextInput
              value={formData.email}
              onChangeText={(v) => setFormData({ ...formData, email: v })}
              placeholder="john@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
              className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
              style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
            />
          </View>

          {/* Street */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Street Address</Text>
            <TextInput
              value={formData.street}
              onChangeText={(v) => setFormData({ ...formData, street: v })}
              placeholder="House 15, Gituamba Lane"
              placeholderTextColor="#9ca3af"
              className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
              style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
            />
          </View>

<View>
  <Text className="text-sm font-semibold text-gray-700 mb-2">
    Phone
  </Text>
  <View className="bg-gray-100 rounded-xl px-4 py-3"
    style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
    <Text className="text-gray-500">{formData.phone}</Text>
  </View>
</View>

        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="bg-green-600 rounded-2xl py-4 items-center"
          style={{ opacity: saving ? 0.7 : 1 }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">Save Changes</Text>
          )}
        </Pressable>

      </ScrollView>
    </View>
  )
}