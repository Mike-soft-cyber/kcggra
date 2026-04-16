import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Users, Calendar, MessageSquare, Plus, Clock } from 'lucide-react-native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from '../components/Card';
import IconBox from '../components/IconBox';
import FadeInView from '../components/FadeInView';
import { SkeletonList } from '../components/SkeletonLoader';
import { toast } from '../utils/toast';

const GROUP_COLORS = [colors.purple, colors.emerald, '#E97C3A', colors.rose, '#4A7C6F']
const DISCUSSION_CATEGORIES = ['general', 'security', 'events', 'improvements', 'complaints']
const EVENT_TYPES = ['meeting', 'social', 'maintenance', 'emergency', 'other']

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const inputStyle = (focused) => ({
  backgroundColor: colors.background, borderRadius: 14,
  borderWidth: focused ? 1.5 : 1,
  borderColor: focused ? colors.purple : colors.border,
  paddingHorizontal: 16, paddingVertical: 14,
  fontSize: 15, color: colors.heading,
  marginBottom: 12,
})

export default function CommunityScreen() {
  const insets = useSafeAreaInsets()
  const [groups, setGroups] = useState([])
  const [events, setEvents] = useState([])
  const [discussions, setDiscussions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDiscussionModal, setShowDiscussionModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [creatingDiscussion, setCreatingDiscussion] = useState(false)
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [discussionForm, setDiscussionForm] = useState({ title: '', content: '', category: 'general' })
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', event_type: 'meeting', location: '' })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [groupsRes, eventsRes, discussionsRes] = await Promise.all([
        api.getGroups().catch(() => ({})),
        api.getUpcomingEvents().catch(() => ({})),
        api.getDiscussions().catch(() => ({})),
      ])
      setGroups(groupsRes.groups || groupsRes || [])
      setEvents(eventsRes.events || eventsRes || [])
      setDiscussions(discussionsRes.discussions || discussionsRes || [])
    } catch (error) {
      console.error('Failed to fetch community data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDiscussion = async () => {
    if (!discussionForm.title || !discussionForm.content) { Alert.alert('Missing fields', 'Fill in title and content'); return; }
    try {
      setCreatingDiscussion(true)
      await api.createDiscussion(discussionForm)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setShowDiscussionModal(false)
      setDiscussionForm({ title: '', content: '', category: 'general' })
      fetchAll()
    } catch (error) {
      toast.error('Failed', error.message || 'Failed to post')
    } finally {
      setCreatingDiscussion(false)
    }
  }

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.date) { Alert.alert('Missing fields', 'Fill in title and date'); return; }
    try {
      setCreatingEvent(true)
      await api.createEvent({ ...eventForm })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setShowEventModal(false)
      setEventForm({ title: '', description: '', date: '', event_type: 'meeting', location: '' })
      fetchAll()
    } catch (error) {
      toast.error('Failed', error.message || 'Failed to create event')
    } finally {
      setCreatingEvent(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.heading, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}>
        <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Community</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Stay connected with your neighbours</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>

        {/* Street Groups */}
        <FadeInView delay={0}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.heading, letterSpacing: -0.3 }}>Street Groups</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>{groups.length} groups</Text>
          </View>
          {loading ? <SkeletonList count={1} /> : groups.length === 0 ? (
            <View style={[cardStyle, { alignItems: 'center', paddingVertical: 32 }]}>
              <IconBox icon={<Users color={colors.muted} size={24} />} color={colors.muted} size={52} />
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 12 }}>No groups yet</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 4 }}>
                {groups.map((group, index) => (
                  <Pressable
                    key={group._id}
                    style={({ pressed }) => ({
                      width: 150, borderRadius: 20, padding: 16,
                      backgroundColor: GROUP_COLORS[index % GROUP_COLORS.length],
                      opacity: pressed ? 0.9 : 1,
                      shadowColor: GROUP_COLORS[index % GROUP_COLORS.length],
                      shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
                    })}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{group.name?.charAt(0)}</Text>
                    </View>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{group.name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>{group.members?.length || 0} members</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </FadeInView>

        {/* Upcoming Events */}
        <FadeInView delay={50}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.heading, letterSpacing: -0.3 }}>Upcoming Events</Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowEventModal(true); }}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${colors.purple}20`, alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus color={colors.purple} size={18} />
            </Pressable>
          </View>
          {loading ? <SkeletonList count={2} /> : events.length === 0 ? (
            <View style={[cardStyle, { alignItems: 'center', paddingVertical: 32 }]}>
              <IconBox icon={<Calendar color={colors.muted} size={24} />} color={colors.muted} size={52} />
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 12 }}>No upcoming events</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {events.map((event) => (
                <FadeInView key={event._id} delay={50}>
                  <View style={cardStyle}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                      <IconBox icon={<Calendar color={colors.emerald} size={18} />} color={colors.emerald} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 15, flex: 1 }} numberOfLines={1}>{event.title}</Text>
                          <View style={{ backgroundColor: `${colors.emerald}20`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                            <Text style={{ color: colors.emerald, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>{event.event_type}</Text>
                          </View>
                        </View>
                        {event.description && <Text style={{ color: colors.body, fontSize: 13, marginTop: 4 }} numberOfLines={2}>{event.description}</Text>}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Clock color={colors.muted} size={12} />
                            <Text style={{ color: colors.muted, fontSize: 12 }}>
                              {new Date(event.date || event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Users color={colors.muted} size={12} />
                            <Text style={{ color: colors.muted, fontSize: 12 }}>{event.attendees?.length || 0} attending</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </FadeInView>
              ))}
            </View>
          )}
        </FadeInView>

        {/* Discussions */}
        <FadeInView delay={100}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.heading, letterSpacing: -0.3 }}>Discussions</Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowDiscussionModal(true); }}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${colors.purple}20`, alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus color={colors.purple} size={18} />
            </Pressable>
          </View>
          {loading ? <SkeletonList count={3} /> : discussions.length === 0 ? (
            <View style={[cardStyle, { alignItems: 'center', paddingVertical: 32 }]}>
              <IconBox icon={<MessageSquare color={colors.muted} size={24} />} color={colors.muted} size={52} />
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 12 }}>No discussions yet</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {discussions.map((discussion) => (
                <FadeInView key={discussion._id} delay={50}>
                  <View style={cardStyle}>
                    <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 15, marginBottom: 6 }} numberOfLines={1}>{discussion.title}</Text>
                    <Text style={{ color: colors.body, fontSize: 13, lineHeight: 18, marginBottom: 10 }} numberOfLines={2}>{discussion.content}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MessageSquare color={colors.muted} size={13} />
                        <Text style={{ color: colors.muted, fontSize: 12 }}>{discussion.replies?.length || 0} replies</Text>
                      </View>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>{timeAgo(discussion.createdAt)}</Text>
                    </View>
                  </View>
                </FadeInView>
              ))}
            </View>
          )}
        </FadeInView>

      </ScrollView>

      {/* Discussion Modal — full screen */}
      <Modal visible={showDiscussionModal} transparent={false} animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ backgroundColor: colors.purple, paddingTop: insets.top + 20, paddingBottom: 28, paddingHorizontal: 24 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)', alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 24, letterSpacing: -0.3 }}>Start a Discussion</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 6 }}>Share something with the community</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <TextInput
              value={discussionForm.title}
              onChangeText={(v) => setDiscussionForm({ ...discussionForm, title: v })}
              placeholder="Discussion title"
              placeholderTextColor={colors.muted}
              style={inputStyle(false)}
            />
            <TextInput
              value={discussionForm.content}
              onChangeText={(v) => setDiscussionForm({ ...discussionForm, content: v })}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[inputStyle(false), { minHeight: 100 }]}
            />
            <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 14, marginBottom: 10 }}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {DISCUSSION_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setDiscussionForm({ ...discussionForm, category: cat })}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: discussionForm.category === cat ? colors.purple : colors.border,
                      backgroundColor: discussionForm.category === cat ? `${colors.purple}15` : colors.surface,
                    }}
                  >
                    <Text style={{ color: discussionForm.category === cat ? colors.purple : colors.body, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <Pressable
              onPress={handleCreateDiscussion}
              disabled={creatingDiscussion}
              style={{ backgroundColor: colors.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: creatingDiscussion ? 0.7 : 1, marginBottom: 12 }}
            >
              {creatingDiscussion ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Post Discussion</Text>}
            </Pressable>
            <Pressable
              onPress={() => setShowDiscussionModal(false)}
              style={{ backgroundColor: colors.border, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: colors.body, fontWeight: '600', fontSize: 15 }}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* Event Modal — full screen */}
      <Modal visible={showEventModal} transparent={false} animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ backgroundColor: colors.emerald, paddingTop: insets.top + 20, paddingBottom: 28, paddingHorizontal: 24 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)', alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 24, letterSpacing: -0.3 }}>Create Event</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 6 }}>Organise a community event</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <TextInput value={eventForm.title} onChangeText={(v) => setEventForm({ ...eventForm, title: v })} placeholder="Event title" placeholderTextColor={colors.muted} style={inputStyle(false)} />
            <TextInput value={eventForm.description} onChangeText={(v) => setEventForm({ ...eventForm, description: v })} placeholder="Description (optional)" placeholderTextColor={colors.muted} multiline numberOfLines={3} textAlignVertical="top" style={[inputStyle(false), { minHeight: 80 }]} />
            <TextInput value={eventForm.date} onChangeText={(v) => setEventForm({ ...eventForm, date: v })} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={colors.muted} style={inputStyle(false)} />
            <TextInput value={eventForm.location} onChangeText={(v) => setEventForm({ ...eventForm, location: v })} placeholder="Location (optional)" placeholderTextColor={colors.muted} style={inputStyle(false)} />
            <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 14, marginBottom: 10 }}>Event Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {EVENT_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setEventForm({ ...eventForm, event_type: type })}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: eventForm.event_type === type ? colors.emerald : colors.border,
                      backgroundColor: eventForm.event_type === type ? `${colors.emerald}15` : colors.surface,
                    }}
                  >
                    <Text style={{ color: eventForm.event_type === type ? colors.emerald : colors.body, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }}>{type}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <Pressable
              onPress={handleCreateEvent}
              disabled={creatingEvent}
              style={{ backgroundColor: colors.emerald, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: creatingEvent ? 0.7 : 1, marginBottom: 12 }}
            >
              {creatingEvent ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Create Event</Text>}
            </Pressable>
            <Pressable
              onPress={() => setShowEventModal(false)}
              style={{ backgroundColor: colors.border, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: colors.body, fontWeight: '600', fontSize: 15 }}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}