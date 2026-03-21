import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

export default function VisitorVerificationScreen() {
  const navigation = useNavigation()
  const [visitorId, setVisitorId] = useState('')
  const [loading, setLoading] = useState(false)
  const [visitor, setVisitor] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const handleSearch = async () => {
    if (!visitorId.trim()) {
      Alert.alert('Error', 'Please enter a visitor ID')
      return
    }
    try {
      setLoading(true)
      setVisitor(null)
      const res = await api.getVisitor(visitorId.trim())
      setVisitor(res.visitor || res)
    } catch (error) {
      Alert.alert('Not Found', 'No visitor found with that ID')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      setActionLoading(true)
      await api.verifyVisitor(visitor._id)
      Alert.alert('✅ Checked In', `${visitor.guest_name} has been checked in!`)
      setVisitor({ ...visitor, status: 'checked_in' })
    } catch (error) {
      Alert.alert('Failed', error.message || 'Failed to check in visitor')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    try {
      setActionLoading(true)
      await api.checkoutVisitor(visitor._id)
      Alert.alert('✅ Checked Out', `${visitor.guest_name} has been checked out!`)
      setVisitor({ ...visitor, status: 'checked_out' })
    } catch (error) {
      Alert.alert('Failed', error.message || 'Failed to check out visitor')
    } finally {
      setActionLoading(false)
    }
  }

  const STATUS_COLORS = {
    pending: { bg: '#fef9c3', text: '#854d0e', label: 'Pending' },
    checked_in: { bg: '#dcfce7', text: '#166534', label: 'Checked In' },
    checked_out: { bg: '#f1f5f9', text: '#475569', label: 'Checked Out' },
    expired: { bg: '#fee2e2', text: '#991b1b', label: 'Expired' },
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ backgroundColor: '#1e3a5f' }} className="px-6 pt-14 pb-6">
        <Pressable onPress={() => navigation.goBack()} className="mb-4">
          <Text className="text-blue-200 font-medium">← Back</Text>
        </Pressable>
        <Text className="text-white text-2xl font-bold">Verify Visitor</Text>
        <Text className="text-blue-200 text-sm mt-1">Enter visitor ID to verify entry</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Search */}
        <View className="bg-white rounded-2xl p-5 gap-3"
          style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
          <Text className="text-sm font-semibold text-gray-700">Visitor ID</Text>
          <TextInput
            value={visitorId}
            onChangeText={setVisitorId}
            placeholder="e.g. VIS-2024-001"
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
            className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
            style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
          />
          <Pressable
            onPress={handleSearch}
            disabled={loading}
            className="bg-blue-900 rounded-xl py-3 items-center"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text className="text-white font-bold">Search</Text>
            )}
          </Pressable>
        </View>

        {/* Visitor Card */}
        {visitor && (
          <View className="bg-white rounded-2xl overflow-hidden"
            style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
            <View style={{ backgroundColor: '#1e3a5f' }} className="p-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-xl font-bold">{visitor.guest_name}</Text>
                <View style={{ backgroundColor: STATUS_COLORS[visitor.status]?.bg }}
                  className="rounded-full px-3 py-1">
                  <Text style={{ color: STATUS_COLORS[visitor.status]?.text }}
                    className="text-xs font-bold">
                    {STATUS_COLORS[visitor.status]?.label}
                  </Text>
                </View>
              </View>
              <Text className="text-blue-200 text-sm mt-1">{visitor.visitor_id}</Text>
            </View>

            <View className="p-5 gap-3">
              <View className="flex-row items-center justify-between py-2"
                style={{ borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' }}>
                <Text className="text-gray-500 text-sm">Phone</Text>
                <Text className="text-gray-900 font-medium text-sm">{visitor.guest_phone}</Text>
              </View>
              <View className="flex-row items-center justify-between py-2"
                style={{ borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' }}>
                <Text className="text-gray-500 text-sm">Visit Date</Text>
                <Text className="text-gray-900 font-medium text-sm">
                  {new Date(visitor.visit_date).toLocaleDateString()}
                </Text>
              </View>
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-gray-500 text-sm">Purpose</Text>
                <Text className="text-gray-900 font-medium text-sm capitalize">{visitor.purpose}</Text>
              </View>

              {/* Actions */}
              <View className="gap-2 mt-2">
                {visitor.status === 'pending' && (
                  <Pressable
                    onPress={handleCheckIn}
                    disabled={actionLoading}
                    className="bg-green-600 rounded-xl py-3 items-center"
                    style={{ opacity: actionLoading ? 0.7 : 1 }}
                  >
                    {actionLoading ? <ActivityIndicator color="#fff" /> : (
                      <Text className="text-white font-bold">✅ Check In</Text>
                    )}
                  </Pressable>
                )}
                {visitor.status === 'checked_in' && (
                  <Pressable
                    onPress={handleCheckOut}
                    disabled={actionLoading}
                    className="bg-gray-800 rounded-xl py-3 items-center"
                    style={{ opacity: actionLoading ? 0.7 : 1 }}
                  >
                    {actionLoading ? <ActivityIndicator color="#fff" /> : (
                      <Text className="text-white font-bold">🚪 Check Out</Text>
                    )}
                  </Pressable>
                )}
                {(visitor.status === 'checked_out' || visitor.status === 'expired') && (
                  <View className="bg-gray-50 rounded-xl py-3 items-center"
                    style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
                    <Text className="text-gray-400 font-medium">No actions available</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}