import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import FadeInView from '../components/FadeInView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, Flame, Eye, Wind, Plus, MapPin, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from '../components/Card';
import IconBox from '../components/IconBox';
import { SkeletonList } from '../components/SkeletonLoader';

const TYPE_CONFIG = {
  burglary:      { icon: AlertTriangle, color: colors.rose },
  fire:          { icon: Flame, color: '#E97C3A' },
  environmental: { icon: Wind, color: '#4A7C6F' },
  suspicious:    { icon: Eye, color: colors.purple },
}

const STATUS_CONFIG = {
  reported:    { bg: `${colors.rose}20`, text: colors.rose, label: 'Reported' },
  in_progress: { bg: `${colors.purple}20`, text: colors.purple, label: 'In Progress' },
  resolved:    { bg: `${colors.emerald}20`, text: colors.emerald, label: 'Resolved' },
  false_alarm: { bg: `${colors.body}20`, text: colors.body, label: 'False Alarm' },
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
  const insets = useSafeAreaInsets()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.heading, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Incidents</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Report & track community incidents</Text>
          </View>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('ReportIncident'); }}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${colors.gold}20`, alignItems: 'center', justifyContent: 'center' }}
          >
            <Plus color={colors.gold} size={22} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={{ padding: 16 }}>
          <SkeletonList count={4} />
        </View>
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
              <FadeInView delay={50}>
                <Pressable
                  style={({ pressed }) => ({
                    ...cardStyle,
                    opacity: pressed ? 0.95 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                    <IconBox icon={<Icon color={typeConfig.color} size={20} />} color={typeConfig.color} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 15, flex: 1 }} numberOfLines={1}>{item.title || item.type}</Text>
                        <View style={{ backgroundColor: statusConfig.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
                          <Text style={{ color: statusConfig.text, fontSize: 11, fontWeight: '700' }}>{statusConfig.label}</Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.body, fontSize: 13, lineHeight: 18, marginBottom: 10 }} numberOfLines={2}>{item.description}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
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
              <Text style={{ color: colors.muted, fontSize: 16, marginTop: 16, fontWeight: '600' }}>No incidents reported</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>Tap + to report one</Text>
            </View>
          )}
        />
      )}
    </View>
  )
}