import { useEffect, useState } from 'react';
import { View, Text, Switch, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

const NOTIFICATION_OPTIONS = [
  { key: 'announcements', label: 'Announcements', desc: 'Community announcements' },
  { key: 'incidents', label: 'Incidents', desc: 'Nearby incident alerts' },
  { key: 'payments', label: 'Payments', desc: 'Payment confirmations & reminders' },
  { key: 'visitors', label: 'Visitors', desc: 'Visitor check-in notifications' },
  { key: 'discussions', label: 'Discussions', desc: 'Replies to your discussions' },
]

export default function NotificationSettingsScreen() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState({
    announcements: true,
    incidents: true,
    payments: true,
    visitors: true,
    discussions: true,
  })

  useEffect(() => { fetchPrefs() }, [])

  const fetchPrefs = async () => {
    try {
      setLoading(true)
      const res = await api.getMe()
      const user = res.user || res
      if (user.notification_preferences) {
        setPrefs({ ...prefs, ...user.notification_preferences })
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.updateProfile({ notification_preferences: prefs })
      Alert.alert('✅ Saved', 'Notification preferences updated!')
      navigation.goBack()
    } catch (error) {
      Alert.alert('Failed', error.message || 'Failed to save preferences')
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
      <View style={{ backgroundColor: '#16a34a' }} className="px-6 pt-14 pb-6">
        <Pressable onPress={() => navigation.goBack()} className="mb-4">
          <Text className="text-green-200 font-medium">← Back</Text>
        </Pressable>
        <Text className="text-white text-2xl font-bold">Notifications</Text>
        <Text className="text-green-200 text-sm mt-1">Manage your alert preferences</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="bg-white rounded-2xl overflow-hidden"
          style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
          {NOTIFICATION_OPTIONS.map((option, index) => (
            <View
              key={option.key}
              className="flex-row items-center px-4 py-4"
              style={{
                borderTopWidth: index === 0 ? 0 : 0.5,
                borderTopColor: '#f3f4f6'
              }}
            >
              <View className="flex-1">
                <Text className="text-gray-900 font-medium text-sm">{option.label}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">{option.desc}</Text>
              </View>
              <Switch
                value={prefs[option.key]}
                onValueChange={(v) => setPrefs({ ...prefs, [option.key]: v })}
                trackColor={{ false: '#e5e7eb', true: '#16a34a' }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="bg-green-600 rounded-2xl py-4 items-center"
          style={{ opacity: saving ? 0.7 : 1 }}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <Text className="text-white font-bold text-base">Save Preferences</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  )
}