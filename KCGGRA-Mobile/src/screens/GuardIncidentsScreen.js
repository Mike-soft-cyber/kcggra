import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

const TYPE_STYLES = {
  burglary:      { border: '#E24B4A', bg: '#FCEBEB', text: '#A32D2D', icon: '🔓' },
  fire:          { border: '#EF9F27', bg: '#FAEEDA', text: '#854F0B', icon: '🔥' },
  environmental: { border: '#EF9F27', bg: '#FAEEDA', text: '#854F0B', icon: '⚠️' },
  suspicious:    { border: '#7F77DD', bg: '#EEEDFE', text: '#3C3489', icon: '👁️' },
}

const STATUS_OPTIONS = ['in_progress', 'resolved', 'false_alarm']

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function GuardIncidentsScreen() {
  const navigation = useNavigation()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => { fetchIncidents() }, [])

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      const res = await api.getIncidents()
      setIncidents(res.incidents || res || [])
    } catch (error) {
      console.error('Failed to fetch incidents:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      Alert.alert('Error', 'Please select a status')
      return
    }
    try {
      setUpdating(true)
      await api.updateIncidentStatus(selectedIncident._id, newStatus, notes)
      Alert.alert('✅ Updated', 'Incident status has been updated!')
      setShowUpdateModal(false)
      setNotes('')
      setNewStatus('')
      fetchIncidents()
    } catch (error) {
      Alert.alert('Failed', error.message || 'Failed to update incident')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ backgroundColor: '#1e3a5f' }} className="px-6 pt-14 pb-6">
        <Pressable onPress={() => navigation.goBack()} className="mb-4">
          <Text className="text-blue-200 font-medium">← Back</Text>
        </Pressable>
        <Text className="text-white text-2xl font-bold">Incidents</Text>
        <Text className="text-blue-200 text-sm mt-1">
          {incidents.filter(i => i.status === 'reported' || i.status === 'in_progress').length} active incidents
        </Text>
      </View>

      <FlatList
        data={incidents}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        renderItem={({ item }) => {
          const type = TYPE_STYLES[item.type] || TYPE_STYLES.suspicious
          return (
            <Pressable
              onPress={() => {
                setSelectedIncident(item)
                setNewStatus(item.status)
                setShowUpdateModal(true)
              }}
              className="bg-white rounded-2xl p-4"
              style={{ borderWidth: 0.5, borderColor: '#e5e7eb', borderLeftWidth: 3, borderLeftColor: type.border }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Text style={{ fontSize: 16 }}>{type.icon}</Text>
                  <View style={{ backgroundColor: type.bg }} className="rounded-full px-3 py-0.5">
                    <Text style={{ color: type.text }} className="text-xs font-semibold capitalize">{item.type}</Text>
                  </View>
                </View>
                <View className="bg-gray-100 rounded-full px-3 py-0.5">
                  <Text className="text-gray-600 text-xs font-semibold capitalize">{item.status?.replace('_', ' ')}</Text>
                </View>
              </View>
              <Text className="text-gray-900 font-semibold text-sm mb-1" numberOfLines={1}>{item.title}</Text>
              <Text className="text-gray-500 text-xs mb-2" numberOfLines={2}>{item.description}</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-400 text-xs">📍 {item.address || 'Location attached'}</Text>
                <Text className="text-gray-400 text-xs">{timeAgo(item.createdAt)}</Text>
              </View>
            </Pressable>
          )
        }}
        ListEmptyComponent={() => (
          <View className="items-center py-16">
            <Text className="text-gray-400 text-base">No incidents reported</Text>
          </View>
        )}
      />

      {/* Update Status Modal */}
      <Modal visible={showUpdateModal} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowUpdateModal(false)}>
          <Pressable onPress={() => {}} className="bg-white rounded-t-3xl overflow-hidden">
            <View style={{ backgroundColor: '#1e3a5f' }} className="px-6 pt-6 pb-5">
              <View className="w-10 h-1 rounded-full bg-blue-400 self-center mb-4" />
              <Text className="text-white font-black text-xl">Update Incident</Text>
              <Text className="text-blue-200 text-sm mt-1" numberOfLines={1}>
                {selectedIncident?.title}
              </Text>
            </View>

            <View className="p-5 gap-4">
              <Text className="text-sm font-semibold text-gray-700">New Status</Text>
              <View className="gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <Pressable
                    key={status}
                    onPress={() => setNewStatus(status)}
                    className="flex-row items-center px-4 py-3 rounded-xl"
                    style={{
                      borderWidth: 1.5,
                      borderColor: newStatus === status ? '#1e3a5f' : '#e5e7eb',
                      backgroundColor: newStatus === status ? '#eff6ff' : '#fff'
                    }}
                  >
                    <Text style={{ color: newStatus === status ? '#1e3a5f' : '#6b7280' }}
                      className="font-medium capitalize">{status.replace('_', ' ')}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Resolution notes (optional)"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                style={{ borderWidth: 0.5, borderColor: '#e5e7eb', minHeight: 80 }}
              />

              <Pressable
                onPress={handleUpdateStatus}
                disabled={updating}
                className="bg-blue-900 rounded-2xl py-4 items-center"
                style={{ opacity: updating ? 0.7 : 1 }}
              >
                {updating ? <ActivityIndicator color="#fff" /> : (
                  <Text className="text-white font-bold">Update Status</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}