import { useEffect, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import FadeInView from './FadeInView';
import { Megaphone, Shield, Calendar, Wrench, Info } from 'lucide-react-native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from './Card';
import IconBox from './IconBox';
import { SkeletonList } from './SkeletonLoader';

const CATEGORY_CONFIG = {
  security:    { icon: Shield, color: colors.rose, label: 'Security' },
  event:       { icon: Calendar, color: colors.purple, label: 'Event' },
  alert:       { icon: Megaphone, color: '#E97C3A', label: 'Alert' },
  maintenance: { icon: Wrench, color: colors.body, label: 'Maintenance' },
  general:     { icon: Info, color: colors.emerald, label: 'General' },
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
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAnnouncements() }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const res = await api.getAnnouncements()
      setAnnouncements(Array.isArray(res) ? res : res.announcements || [])
    } catch (error) {
      console.error('Failed to fetch announcements', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={cardStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.heading, letterSpacing: -0.3 }}>Community Updates</Text>
        <Text style={{ fontSize: 12, color: colors.muted }}>{announcements.length} updates</Text>
      </View>

      {loading ? (
        <SkeletonList count={3} />
      ) : announcements.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <IconBox icon={<Megaphone color={colors.muted} size={24} />} color={colors.muted} size={52} />
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 12 }}>No updates yet</Text>
        </View>
      ) : (
        <Animated.View>
          {announcements.map((item, index) => {
            const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.general;
            const Icon = config.icon;
            return (
              <FadeInView delay={index * 50}>
                <Pressable
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                    padding: 14, borderRadius: 16,
                    backgroundColor: pressed ? colors.background : colors.background,
                  })}
                >
                  <IconBox icon={<Icon color={config.color} size={18} />} color={config.color} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 14, flex: 1 }} numberOfLines={1}>{item.title}</Text>
                      <Text style={{ color: colors.muted, fontSize: 11, marginLeft: 8 }}>{timeAgo(item.createdAt)}</Text>
                    </View>
                    <Text style={{ color: colors.body, fontSize: 13, lineHeight: 18 }} numberOfLines={2}>{item.content}</Text>
                    {item.is_pinned && (
                      <View style={{ backgroundColor: `${colors.gold}40`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 6 }}>
                        <Text style={{ color: '#B8860B', fontSize: 10, fontWeight: '600' }}>PINNED</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              </FadeInView>
            );
          })}
        </Animated.View>
      )}
    </View>
  )
}