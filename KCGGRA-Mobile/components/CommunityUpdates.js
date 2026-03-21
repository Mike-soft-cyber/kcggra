import { useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import api from '../src/services/api'

const CATEGORY_STYLES = {
  security:    { border: '#E24B4A', bg: '#FCEBEB', text: '#A32D2D' },
  event:       { border: '#1D9E75', bg: '#E1F5EE', text: '#0F6E56' },
  alert:       { border: '#EF9F27', bg: '#FAEEDA', text: '#854F0B' },
  maintenance: { border: '#378ADD', bg: '#E6F1FB', text: '#185FA5' },
  general:     { border: '#7F77DD', bg: '#EEEDFE', text: '#3C3489' },
}

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function CommunityUpdates() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { handleAnnouncements() }, [])

  const handleAnnouncements = async () => {
    try {
      setLoading(true)
      const res = await api.getAnnouncements()
      setAnnouncements(res)
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  return (
    <View className="px-4 py-2">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold text-gray-900">Community Updates</Text>
        <Text className="text-xs text-gray-400">{announcements.length} updates</Text>
      </View>

      <FlatList
        data={announcements}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        renderItem={({ item }) => {
          const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.general
          return (
            <View
              className="bg-white rounded-2xl p-4"
              style={{
                borderWidth: 0.5,
                borderColor: '#e5e7eb',
                borderLeftWidth: 3,
                borderLeftColor: style.border,
              }}
            >
              {/* Top row */}
              <View className="flex-row items-center mb-2 gap-2">
                <View style={{ backgroundColor: style.bg }} className="rounded-full px-3 py-0.5">
                  <Text style={{ color: style.text }} className="text-xs font-semibold capitalize">
                    {item.category}
                  </Text>
                </View>

                {item.is_pinned && (
                  <View className="bg-amber-50 rounded-full px-2 py-0.5">
                    <Text className="text-amber-700 text-xs font-semibold">Pinned</Text>
                  </View>
                )}

                <Text className="text-xs text-gray-400 ml-auto">
                  {timeAgo(item.createdAt)}
                </Text>
              </View>

              {/* Title */}
              <Text className="text-gray-900 font-semibold text-base mb-1" numberOfLines={1}>
                {item.title}
              </Text>

              {/* Content preview */}
              <Text className="text-gray-500 text-sm leading-5" numberOfLines={2}>
                {item.content}
              </Text>
            </View>
          )
        }}
        ListEmptyComponent={() => (
          <View className="items-center py-12">
            <Text className="text-gray-400 text-base">No community updates yet</Text>
            <Text className="text-gray-300 text-sm mt-1">Check back later</Text>
          </View>
        )}
      />
    </View>
  )
}