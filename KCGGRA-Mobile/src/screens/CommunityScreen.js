import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Modal, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const GROUP_COLORS = ['#16a34a', '#2563eb', '#9333ea', '#dc2626', '#d97706']

const DISCUSSION_CATEGORIES = ['general', 'security', 'events', 'improvements', 'complaints']
const EVENT_TYPES = ['meeting', 'social', 'maintenance', 'emergency', 'other']

export default function CommunityScreen() {
  const navigation = useNavigation()
  const [groups, setGroups] = useState([])
  const [events, setEvents] = useState([])
  const [discussions, setDiscussions] = useState([])
  const [loading, setLoading] = useState(true)

  // Discussion modal
  const [showDiscussionModal, setShowDiscussionModal] = useState(false)
  const [creatingDiscussion, setCreatingDiscussion] = useState(false)
  const [discussionForm, setDiscussionForm] = useState({
    title: '', content: '', category: 'general'
  })

  // Event modal
  const [showEventModal, setShowEventModal] = useState(false)
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [eventForm, setEventForm] = useState({
    title: '', description: '', event_date: '', event_type: 'meeting', location: ''
  })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [groupsRes, eventsRes, discussionsRes] = await Promise.all([
        api.getGroups(),
        api.getUpcomingEvents(),
        api.getDiscussions(),
      ])
      setGroups(groupsRes.groups || groupsRes || [])
      setEvents(eventsRes.events || eventsRes || [])
      setDiscussions(discussionsRes.discussions || discussionsRes || [])
    } catch (error) {
      console.error('Failed to fetch community data:', error.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDiscussion = async () => {
    if (!discussionForm.title || !discussionForm.content) {
      Alert.alert('Missing fields', 'Please fill in title and content')
      return
    }
    try {
      setCreatingDiscussion(true)
      await api.createDiscussion(discussionForm)
      Alert.alert('✅ Posted', 'Your discussion has been posted!')
      setShowDiscussionModal(false)
      setDiscussionForm({ title: '', content: '', category: 'general' })
      fetchAll()
    } catch (error) {
      Alert.alert('Failed', error.message || 'Failed to create discussion')
    } finally {
      setCreatingDiscussion(false)
    }
  }

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.event_date) {
      Alert.alert('Missing fields', 'Please fill in title and date')
      return
    }
    try {
      setCreatingEvent(true)
      await api.createEvent(eventForm)
      Alert.alert('✅ Created', 'Your event has been created!')
      setShowEventModal(false)
      setEventForm({ title: '', description: '', event_date: '', event_type: 'meeting', location: '' })
      fetchAll()
    } catch (error) {
      Alert.alert('Failed', error.message || 'Failed to create event')
    } finally {
      setCreatingEvent(false)
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
        <Text className="text-white text-2xl font-bold">Community</Text>
        <Text className="text-green-200 text-sm mt-1">Stay connected with your neighbours</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>

        {/* ── Street Groups ── */}
        <View>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">Street Groups</Text>
            <Text className="text-xs text-gray-400">{groups.length} groups</Text>
          </View>
          {groups.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center"
              style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
              <Text className="text-gray-400 text-sm">No groups yet</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {groups.map((group, index) => (
                  <Pressable
                    key={group._id}
                    className="rounded-2xl p-4 w-40"
                    style={{ backgroundColor: GROUP_COLORS[index % GROUP_COLORS.length], minHeight: 100 }}
                  >
                    <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mb-3">
                      <Text className="text-white font-bold text-lg">{group.name?.charAt(0)}</Text>
                    </View>
                    <Text className="text-white font-bold text-sm" numberOfLines={1}>{group.name}</Text>
                    <Text className="text-white/70 text-xs mt-1">{group.members?.length || 0} members</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* ── Upcoming Events ── */}
        <View>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">Upcoming Events</Text>
            <Pressable
              onPress={() => setShowEventModal(true)}
              className="bg-green-600 rounded-full px-3 py-1"
            >
              <Text className="text-white text-xs font-bold">+ Add</Text>
            </Pressable>
          </View>
          {events.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center"
              style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
              <Text className="text-gray-400 text-sm">No upcoming events</Text>
            </View>
          ) : (
            <View className="gap-3">
              {events.map((event) => (
                <View key={event._id} className="bg-white rounded-2xl p-4"
                  style={{ borderWidth: 0.5, borderColor: '#e5e7eb', borderLeftWidth: 3, borderLeftColor: '#16a34a' }}>
                  <View className="flex-row items-start justify-between mb-2">
                    <Text className="text-gray-900 font-bold text-sm flex-1 mr-2" numberOfLines={1}>{event.title}</Text>
                    <View className="bg-green-50 rounded-full px-2 py-0.5">
                      <Text className="text-green-700 text-xs font-medium capitalize">{event.event_type}</Text>
                    </View>
                  </View>
                  <Text className="text-gray-500 text-xs mb-2" numberOfLines={2}>{event.description}</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-400 text-xs">
                      📅 {new Date(event.event_date).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric'
                      })}
                    </Text>
                    <Text className="text-gray-400 text-xs">👥 {event.attendees?.length || 0} attending</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Recent Discussions ── */}
        <View>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">Recent Discussions</Text>
            <Pressable
              onPress={() => setShowDiscussionModal(true)}
              className="bg-green-600 rounded-full px-3 py-1"
            >
              <Text className="text-white text-xs font-bold">+ Post</Text>
            </Pressable>
          </View>
          {discussions.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center"
              style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
              <Text className="text-gray-400 text-sm">No discussions yet</Text>
            </View>
          ) : (
            <View className="gap-3">
              {discussions.map((discussion) => (
                <View key={discussion._id} className="bg-white rounded-2xl p-4"
                  style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
                  <Text className="text-gray-900 font-bold text-sm mb-1" numberOfLines={1}>{discussion.title}</Text>
                  <Text className="text-gray-500 text-xs mb-3" numberOfLines={2}>{discussion.content}</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-400 text-xs">💬 {discussion.replies?.length || 0} replies</Text>
                    <Text className="text-gray-400 text-xs">{timeAgo(discussion.createdAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* ── Create Discussion Modal ── */}
      <Modal visible={showDiscussionModal} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowDiscussionModal(false)}>
          <Pressable onPress={() => {}} className="bg-white rounded-t-3xl overflow-hidden">
            <View style={{ backgroundColor: '#16a34a' }} className="px-6 pt-6 pb-5">
              <View className="w-10 h-1 rounded-full bg-green-400 self-center mb-4" />
              <Text className="text-white font-black text-xl">Start a Discussion</Text>
              <Text className="text-green-200 text-sm mt-1">Share something with the community</Text>
            </View>

            <View className="p-5 gap-4">
              <TextInput
                value={discussionForm.title}
                onChangeText={(v) => setDiscussionForm({ ...discussionForm, title: v })}
                placeholder="Discussion title"
                placeholderTextColor="#9ca3af"
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
              />

              <TextInput
                value={discussionForm.content}
                onChangeText={(v) => setDiscussionForm({ ...discussionForm, content: v })}
                placeholder="What's on your mind?"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                style={{ borderWidth: 0.5, borderColor: '#e5e7eb', minHeight: 100 }}
              />

              {/* Category selector */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {DISCUSSION_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setDiscussionForm({ ...discussionForm, category: cat })}
                        className="px-4 py-2 rounded-full"
                        style={{
                          borderWidth: 1,
                          borderColor: discussionForm.category === cat ? '#16a34a' : '#e5e7eb',
                          backgroundColor: discussionForm.category === cat ? '#f0fdf4' : '#fff'
                        }}
                      >
                        <Text style={{ color: discussionForm.category === cat ? '#16a34a' : '#6b7280' }}
                          className="text-xs font-medium capitalize">{cat}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <Pressable
                onPress={handleCreateDiscussion}
                disabled={creatingDiscussion}
                className="bg-green-600 rounded-2xl py-4 items-center"
                style={{ opacity: creatingDiscussion ? 0.7 : 1 }}
              >
                <Text className="text-white font-bold">
                  {creatingDiscussion ? 'Posting...' : 'Post Discussion'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Create Event Modal ── */}
      <Modal visible={showEventModal} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowEventModal(false)}>
          <Pressable onPress={() => {}} className="bg-white rounded-t-3xl overflow-hidden">
            <View style={{ backgroundColor: '#16a34a' }} className="px-6 pt-6 pb-5">
              <View className="w-10 h-1 rounded-full bg-green-400 self-center mb-4" />
              <Text className="text-white font-black text-xl">Create Event</Text>
              <Text className="text-green-200 text-sm mt-1">Organise a community event</Text>
            </View>

            <View className="p-5 gap-4">
              <TextInput
                value={eventForm.title}
                onChangeText={(v) => setEventForm({ ...eventForm, title: v })}
                placeholder="Event title"
                placeholderTextColor="#9ca3af"
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
              />

              <TextInput
                value={eventForm.description}
                onChangeText={(v) => setEventForm({ ...eventForm, description: v })}
                placeholder="Description (optional)"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                style={{ borderWidth: 0.5, borderColor: '#e5e7eb', minHeight: 80 }}
              />

              <TextInput
                value={eventForm.event_date}
                onChangeText={(v) => setEventForm({ ...eventForm, event_date: v })}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor="#9ca3af"
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
              />

              <TextInput
                value={eventForm.location}
                onChangeText={(v) => setEventForm({ ...eventForm, location: v })}
                placeholder="Location (optional)"
                placeholderTextColor="#9ca3af"
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
              />

              {/* Event type selector */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Event Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {EVENT_TYPES.map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setEventForm({ ...eventForm, event_type: type })}
                        className="px-4 py-2 rounded-full"
                        style={{
                          borderWidth: 1,
                          borderColor: eventForm.event_type === type ? '#16a34a' : '#e5e7eb',
                          backgroundColor: eventForm.event_type === type ? '#f0fdf4' : '#fff'
                        }}
                      >
                        <Text style={{ color: eventForm.event_type === type ? '#16a34a' : '#6b7280' }}
                          className="text-xs font-medium capitalize">{type}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <Pressable
                onPress={handleCreateEvent}
                disabled={creatingEvent}
                className="bg-green-600 rounded-2xl py-4 items-center"
                style={{ opacity: creatingEvent ? 0.7 : 1 }}
              >
                <Text className="text-white font-bold">
                  {creatingEvent ? 'Creating...' : 'Create Event'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  )
}