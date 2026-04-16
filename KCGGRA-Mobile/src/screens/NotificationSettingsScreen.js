import { useEffect, useState } from 'react';
import { View, Text, Switch, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import FadeInView from '../components/FadeInView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Shield, CreditCard, QrCode, MessageSquare } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from '../components/Card';
import IconBox from '../components/IconBox';
import { toast } from '../utils/toast';

const NOTIFICATION_OPTIONS = [
  { key: 'announcements', label: 'Announcements', desc: 'Community announcements', icon: Bell, color: colors.purple },
  { key: 'incidents', label: 'Incidents', desc: 'Nearby incident alerts', icon: Shield, color: colors.rose },
  { key: 'payments', label: 'Payments', desc: 'Payment confirmations', icon: CreditCard, color: colors.emerald },
  { key: 'visitors', label: 'Visitors', desc: 'Visitor check-in alerts', icon: QrCode, color: '#E97C3A' },
  { key: 'discussions', label: 'Discussions', desc: 'Replies to your posts', icon: MessageSquare, color: '#4A7C6F' },
]

export default function NotificationSettingsScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState({ announcements: true, incidents: true, payments: true, visitors: true, discussions: true })

  useEffect(() => { fetchPrefs() }, [])

  const fetchPrefs = async () => {
    try {
      const res = await api.getMe()
      const user = res.user || res
      if (user.notification_preferences) setPrefs({ ...prefs, ...user.notification_preferences })
    } catch (error) {
      console.error('Failed to fetch preferences:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.updateProfile({ notification_preferences: prefs })
      toast.success('Saved', 'Notification preferences updated!')
      navigation.goBack()
    } catch (error) {
      toast.error('Failed', error.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.purple} />
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.heading, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ArrowLeft color={colors.muted} size={20} />
          <Text style={{ color: colors.muted, fontSize: 14 }}>Back</Text>
        </Pressable>
        <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Notifications</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Manage your alert preferences</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}>
        <FadeInView delay={50}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
            {NOTIFICATION_OPTIONS.map((option, index) => {
              const Icon = option.icon;
              return (
                <View
                  key={option.key}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 20, paddingVertical: 16,
                    borderTopWidth: index === 0 ? 0 : 0.5,
                    borderTopColor: colors.border,
                  }}
                >
                  <IconBox icon={<Icon color={option.color} size={18} />} color={option.color} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 15 }}>{option.label}</Text>
                    <Text style={{ color: colors.body, fontSize: 12, marginTop: 2 }}>{option.desc}</Text>
                  </View>
                  <Switch
                    value={prefs[option.key]}
                    onValueChange={(v) => setPrefs({ ...prefs, [option.key]: v })}
                    trackColor={{ false: colors.border, true: `${option.color}60` }}
                    thumbColor={prefs[option.key] ? option.color : colors.muted}
                  />
                </View>
              );
            })}
          </View>
        </FadeInView>

        <FadeInView delay={100}>
          <Pressable onPress={handleSave} disabled={saving} style={{ backgroundColor: colors.heading, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: saving ? 0.7 : 1 }}>
            {saving ? <ActivityIndicator color={colors.gold} /> : <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 15 }}>Save Preferences</Text>}
          </Pressable>
        </FadeInView>
      </ScrollView>
    </View>
  )
}