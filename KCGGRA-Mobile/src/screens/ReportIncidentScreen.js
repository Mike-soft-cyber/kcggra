import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import api from '../services/api';

const INCIDENT_TYPES = [
  { key: 'burglary',      label: 'Burglary',       icon: '🔓' },
  { key: 'fire',          label: 'Fire',            icon: '🔥' },
  { key: 'environmental', label: 'Environmental',   icon: '⚠️' },
  { key: 'suspicious',    label: 'Suspicious',      icon: '👁️' },
]

export default function ReportIncidentScreen() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    address: '',
  })

  const handleSubmit = async () => {
    if (!formData.type || !formData.title || !formData.description) {
      Alert.alert('Missing fields', 'Please fill in all required fields')
      return
    }

    try {
      setLoading(true)

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed to report an incident')
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = location.coords

      await api.createIncident({
        type: formData.type,
        title: formData.title,
        description: formData.description,
        address: formData.address,
        latitude,
        longitude,
      })

      Alert.alert('✅ Incident Reported', 'Your report has been submitted successfully.')
      navigation.goBack()
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100">
        <Pressable onPress={() => navigation.goBack()} className="mb-4">
          <Text className="text-green-600 font-medium">← Back</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-gray-900">Report Incident</Text>
        <Text className="text-gray-500 text-sm mt-1">
          Provide details about what happened
        </Text>
      </View>

      <View className="p-6 gap-5">

        {/* Incident Type */}
        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Incident Type <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {INCIDENT_TYPES.map((t) => {
              const selected = formData.type === t.key
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setFormData({ ...formData, type: t.key })}
                  className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl"
                  style={{
                    borderWidth: 1.5,
                    borderColor: selected ? '#16a34a' : '#e5e7eb',
                    backgroundColor: selected ? '#f0fdf4' : '#fff',
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{t.icon}</Text>
                  <Text style={{ color: selected ? '#16a34a' : '#6b7280' }}
                    className="text-sm font-medium">
                    {t.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Title */}
        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Title <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={formData.title}
            onChangeText={(v) => setFormData({ ...formData, title: v })}
            placeholder="Brief title of the incident"
            placeholderTextColor="#9ca3af"
            className="bg-white rounded-xl px-4 py-3 text-gray-900 text-base"
            style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
          />
        </View>

        {/* Description */}
        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Description <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={formData.description}
            onChangeText={(v) => setFormData({ ...formData, description: v })}
            placeholder="Describe what happened in detail..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-white rounded-xl px-4 py-3 text-gray-900 text-base"
            style={{ borderWidth: 0.5, borderColor: '#e5e7eb', minHeight: 120 }}
          />
        </View>

        {/* Address */}
        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Address <Text className="text-gray-400 font-normal">(optional)</Text>
          </Text>
          <TextInput
            value={formData.address}
            onChangeText={(v) => setFormData({ ...formData, address: v })}
            placeholder="e.g. Near the main gate"
            placeholderTextColor="#9ca3af"
            className="bg-white rounded-xl px-4 py-3 text-gray-900 text-base"
            style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
          />
        </View>

        {/* GPS note */}
        <View className="flex-row items-center bg-blue-50 rounded-xl px-4 py-3 gap-2"
          style={{ borderWidth: 0.5, borderColor: '#bfdbfe' }}>
          <Text style={{ fontSize: 14 }}>📍</Text>
          <Text className="text-blue-700 text-xs flex-1">
            Your GPS location will be automatically attached when you submit
          </Text>
        </View>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className="bg-green-600 rounded-2xl py-4 items-center mt-2"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-white font-bold text-base ml-2">Submitting...</Text>
            </View>
          ) : (
            <Text className="text-white font-bold text-base">Submit Report</Text>
          )}
        </Pressable>

      </View>
    </ScrollView>
  )
}