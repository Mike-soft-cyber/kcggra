import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../services/api";

const TYPE_STYLES = {
  burglary:      { border: '#E24B4A', bg: '#FCEBEB', text: '#A32D2D', icon: '🔓' },
  fire:          { border: '#EF9F27', bg: '#FAEEDA', text: '#854F0B', icon: '🔥' },
  environmental: { border: '#EF9F27', bg: '#FAEEDA', text: '#854F0B', icon: '⚠️' },
  suspicious:    { border: '#7F77DD', bg: '#EEEDFE', text: '#3C3489', icon: '👁️' },
}

const STATUS_STYLES = {
  reported:    { bg: '#f1f5f9', text: '#475569', label: 'Reported'     },
  in_progress: { bg: '#fef9c3', text: '#854d0e', label: 'In Progress'  },
  resolved:    { bg: '#dcfce7', text: '#166534', label: 'Resolved'     },
  false_alarm: { bg: '#f1f5f9', text: '#475569', label: 'False Alarm'  },
}

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function IncidentScreen() {
  const navigation = useNavigation()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchIncidents() }, [])

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      const res = await api.getIncidents()
      setIncidents(res)
    } catch (error) {
      console.error("Failed to fetch incidents:", error.message)
    } finally {
      setLoading(false)
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
        <Text className="text-white text-2xl font-bold">Incidents</Text>
        <Text className="text-green-200 text-sm mt-1">Report and track community incidents</Text>
      </View>

      {/* Report button */}
      <View className="px-4 pt-4">
        <Pressable
          onPress={() => navigation.navigate('ReportIncident')}
          className="flex-row items-center justify-between bg-green-50 rounded-2xl px-4 py-3"
          style={{ borderWidth: 1, borderColor: '#bbf7d0' }}
        >
          <View>
            <Text className="text-green-800 font-semibold text-sm">Report a new incident</Text>
            <Text className="text-green-400 text-xs mt-0.5">Tap to submit a report</Text>
          </View>
          <View className="bg-green-600 rounded-xl px-4 py-2">
            <Text className="text-white font-semibold text-sm">+ Report</Text>
          </View>
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={incidents}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        renderItem={({ item }) => {
          const type = TYPE_STYLES[item.type] || TYPE_STYLES.suspicious
          const status = STATUS_STYLES[item.status] || STATUS_STYLES.reported
          return (
            <View
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
                <View style={{ backgroundColor: status.bg }} className="rounded-full px-3 py-0.5">
                  <Text style={{ color: status.text }} className="text-xs font-semibold">{status.label}</Text>
                </View>
              </View>

              <Text className="text-gray-900 font-semibold text-sm mb-1" numberOfLines={1}>{item.title}</Text>
              <Text className="text-gray-500 text-xs mb-2" numberOfLines={2}>{item.description}</Text>
              <Text className="text-gray-400 text-xs">📍 {item.address || 'Location attached'} · {timeAgo(item.createdAt)}</Text>
            </View>
          )
        }}
        ListEmptyComponent={() => (
          <View className="items-center py-16">
            <Text className="text-gray-400 text-base">No incidents reported yet</Text>
            <Text className="text-gray-300 text-sm mt-1">Tap the button above to report one</Text>
          </View>
        )}
      />
    </View>
  )
}