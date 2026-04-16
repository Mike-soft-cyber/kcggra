import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Modal, TextInput, Alert } from 'react-native';
import FadeInView from '../components/FadeInView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, Flame, Eye, Wind, MapPin, Clock, ChevronDown } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from '../components/Card';
import IconBox from '../components/IconBox';
import { SkeletonList } from '../components/SkeletonLoader';
import { toast } from '../utils/toast';

const TYPE_CONFIG = {
  burglary:      { icon: AlertTriangle, color: colors.rose },
  fire:          { icon: Flame, color: '#E97C3A' },
  environmental: { icon: Wind, color: '#4A7C6F' },
  suspicious:    { icon: Eye, color: colors.purple },
}

const STATUS_OPTIONS = ['in_progress', 'resolved', 'false_alarm']
const STATUS_CONFIG = {
  reported:    { bg: `${colors.rose}20`, text: colors.rose, label: 'Reported' },
  in_progress: { bg: `${colors.purple}20`, text: colors.purple, label: 'In Progress' },
  resolved:    { bg: `${colors.emerald}20`, text: colors.emerald, label: 'Resolved' },
  false_alarm: { bg: `${colors.muted}20`, text: colors.muted, label: 'False Alarm' },
}

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function GuardIncidentsScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [updating, setUpdating] = useState(false)
  const [notesFocused, setNotesFocused] = useState(false)

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
    if (!newStatus) { Alert.alert('Error', 'Please select a status'); return; }
    try {
      setUpdating(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await api.updateIncidentStatus(selectedIncident._id, newStatus, notes)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setShowUpdateModal(false)
      setNotes('')
      setNewStatus('')
      fetchIncidents()
    } catch (error) {
      console.error('Failed to update incident', error)
      toast.error('Failed', error.message || 'Failed to update incident')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.heading, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}>
        <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Incidents</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
          {incidents.filter(i => i.status === 'reported' || i.status === 'in_progress').length} active incidents
        </Text>
      </View>

      {loading ? (
        <View style={{ padding: 16 }}><SkeletonList count={4} /></View>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 16 }}
          renderItem={({ item, index }) => {
            const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.suspicious;
            const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.reported;
            const Icon = typeConfig.icon;
            return (
              <FadeInView delay={index * 50}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedIncident(item);
                    setNewStatus(item.status);
                    setShowUpdateModal(true);
                  }}
                  style={({ pressed }) => ({ ...cardStyle, opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                    <IconBox icon={<Icon color={typeConfig.color} size={18} />} color={typeConfig.color} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 15, flex: 1 }} numberOfLines={1}>{item.title || item.type}</Text>
                        <View style={{ backgroundColor: statusConfig.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
                          <Text style={{ color: statusConfig.text, fontSize: 11, fontWeight: '700' }}>{statusConfig.label}</Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.body, fontSize: 13, marginBottom: 8 }} numberOfLines={2}>{item.description}</Text>
                      <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <MapPin color={colors.muted} size={12} />
                          <Text style={{ color: colors.muted, fontSize: 12 }}>{item.address || 'Location attached'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Clock color={colors.muted} size={12} />
                          <Text style={{ color: colors.muted, fontSize: 12 }}>{timeAgo(item.createdAt)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </FadeInView>
            );
          }}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <IconBox icon={<AlertTriangle color={colors.muted} size={28} />} color={colors.muted} size={64} />
              <Text style={{ color: colors.muted, fontSize: 16, marginTop: 16, fontWeight: '600' }}>No incidents</Text>
            </View>
          )}
        />
      )}

      {/* Update Modal */}
      <Modal visible={showUpdateModal} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' }} onPress={() => setShowUpdateModal(false)}>
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}>
            <View style={{ backgroundColor: colors.heading, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: `${colors.gold}40`, alignSelf: 'center', marginBottom: 16 }} />
              <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 20, letterSpacing: -0.3 }}>Update Incident</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }} numberOfLines={1}>{selectedIncident?.title}</Text>
            </View>
            <View style={{ padding: 20, gap: 14 }}>
              <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 15 }}>New Status</Text>
              <View style={{ gap: 8 }}>
                {STATUS_OPTIONS.map((status) => {
                  const config = STATUS_CONFIG[status] || STATUS_CONFIG.reported;
                  return (
                    <Pressable
                      key={status}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewStatus(status); }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14,
                        borderWidth: 1.5, borderColor: newStatus === status ? config.text : colors.border,
                        backgroundColor: newStatus === status ? config.bg : colors.surface,
                      }}
                    >
                      <Text style={{ color: newStatus === status ? config.text : colors.body, fontWeight: '600', textTransform: 'capitalize', flex: 1 }}>{status.replace('_', ' ')}</Text>
                      {newStatus === status && <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: config.text, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text></View>}
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Resolution notes (optional)"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{
                  backgroundColor: colors.background, borderRadius: 14,
                  borderWidth: notesFocused ? 1.5 : 1,
                  borderColor: notesFocused ? colors.purple : colors.border,
                  paddingHorizontal: 16, paddingVertical: 14,
                  fontSize: 15, color: colors.heading, minHeight: 80,
                }}
                onFocus={() => setNotesFocused(true)}
                onBlur={() => setNotesFocused(false)}
              />
              <Pressable onPress={handleUpdateStatus} disabled={updating} style={{ backgroundColor: colors.heading, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: updating ? 0.7 : 1, marginBottom: 16 }}>
                {updating ? <ActivityIndicator color={colors.gold} /> : <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 15 }}>Update Status</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}