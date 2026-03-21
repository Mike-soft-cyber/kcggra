import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

export default function SecuritySettingsScreen() {
  const navigation = useNavigation()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleChangePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all fields')
      return
    }
    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match')
      return
    }
    if (formData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }
    try {
      setSaving(true)
      await api.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })
      Alert.alert('✅ Updated', 'Your password has been changed!')
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      navigation.goBack()
    } catch (error) {
      Alert.alert('Failed', error.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ backgroundColor: '#16a34a' }} className="px-6 pt-14 pb-6">
        <Pressable onPress={() => navigation.goBack()} className="mb-4">
          <Text className="text-green-200 font-medium">← Back</Text>
        </Pressable>
        <Text className="text-white text-2xl font-bold">Security</Text>
        <Text className="text-green-200 text-sm mt-1">Manage your account security</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="bg-white rounded-2xl p-5 gap-4"
          style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
          <Text className="text-base font-bold text-gray-900">Change Password</Text>

          {[
            { key: 'currentPassword', label: 'Current Password', placeholder: '••••••••' },
            { key: 'newPassword', label: 'New Password', placeholder: '••••••••' },
            { key: 'confirmPassword', label: 'Confirm New Password', placeholder: '••••••••' },
          ].map((field) => (
            <View key={field.key}>
              <Text className="text-sm font-semibold text-gray-700 mb-2">{field.label}</Text>
              <TextInput
                value={formData[field.key]}
                onChangeText={(v) => setFormData({ ...formData, [field.key]: v })}
                placeholder={field.placeholder}
                secureTextEntry
                placeholderTextColor="#9ca3af"
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
              />
            </View>
          ))}

          <Pressable
            onPress={handleChangePassword}
            disabled={saving}
            className="bg-green-600 rounded-2xl py-4 items-center mt-2"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? <ActivityIndicator color="#fff" /> : (
              <Text className="text-white font-bold">Update Password</Text>
            )}
          </Pressable>
        </View>

        {/* Active Sessions */}
        <Pressable
          onPress={() => navigation.navigate('ActiveSessions')}
          className="bg-white rounded-2xl p-4 flex-row items-center"
          style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
        >
          <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center mr-3">
            <Text style={{ fontSize: 18 }}>📱</Text>
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-medium text-sm">Active Sessions</Text>
            <Text className="text-gray-400 text-xs mt-0.5">View & manage logged in devices</Text>
          </View>
          <Text className="text-gray-300 text-lg">›</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}