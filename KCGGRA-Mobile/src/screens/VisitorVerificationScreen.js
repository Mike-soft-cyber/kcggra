import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import FadeInView from '../components/FadeInView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Search, User, Phone, Calendar, MapPin, CheckCircle, Clock, XCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from '../components/Card';
import IconBox from '../components/IconBox';
import { toast } from '../utils/toast';

const STATUS_CONFIG = {
  pending:     { bg: `${colors.purple}20`, text: colors.purple, label: 'Pending', icon: Clock },
  checked_in:  { bg: `${colors.emerald}20`, text: colors.emerald, label: 'Checked In', icon: CheckCircle },
  checked_out: { bg: `${colors.muted}20`, text: colors.muted, label: 'Checked Out', icon: CheckCircle },
  expired:     { bg: `${colors.rose}20`, text: colors.rose, label: 'Expired', icon: XCircle },
}

export default function VisitorVerificationScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [visitorId, setVisitorId] = useState('')
  const [loading, setLoading] = useState(false)
  const [visitor, setVisitor] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  const handleSearch = async () => {
    if (!visitorId.trim()) { Alert.alert('Error', 'Please enter a visitor ID'); return; }
    try {
      setLoading(true)
      setVisitor(null)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      const res = await api.getVisitor(visitorId.trim())
      setVisitor(res.visitor || res)
    } catch (error) {
      toast.error('Not Found', 'No visitor found with that ID')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      setActionLoading(true)
      await api.verifyVisitor(visitor._id)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      toast.success('Checked In', `${visitor.guest_name} has been checked in!`)
      setVisitor({ ...visitor, status: 'checked_in' })
    } catch (error) {
      toast.error('Failed', error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    try {
      setActionLoading(true)
      await api.checkoutVisitor(visitor._id)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      toast.success('Checked Out', `${visitor.guest_name} has been checked out!`)
      setVisitor({ ...visitor, status: 'checked_out' })
    } catch (error) {
      toast.error('Failed', error.message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.heading, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}>
        <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Verify Visitor</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Enter visitor ID to verify entry</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}>
        {/* Search */}
        <FadeInView delay={50}>
          <View style={[cardStyle, { gap: 14 }]}>
            <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 16 }}>Visitor ID</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: colors.background, borderRadius: 14,
              borderWidth: focused ? 1.5 : 1,
              borderColor: focused ? colors.purple : colors.border,
              overflow: 'hidden',
            }}>
              <View style={{ paddingLeft: 14 }}>
                <Search color={focused ? colors.purple : colors.muted} size={18} />
              </View>
              <TextInput
                value={visitorId}
                onChangeText={setVisitorId}
                placeholder="e.g. VIS-2024-001"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 14, fontSize: 15, color: colors.heading }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>
            <Pressable
              onPress={handleSearch}
              disabled={loading}
              style={{ backgroundColor: colors.heading, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <ActivityIndicator color={colors.gold} /> : (
                <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 15 }}>Search</Text>
              )}
            </Pressable>
          </View>
        </FadeInView>

        {/* Visitor Result */}
        {visitor && (
          <FadeInView delay={100}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
              {/* Header */}
              <View style={{ backgroundColor: colors.heading, padding: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: colors.gold, fontSize: 20, fontWeight: '800' }}>{visitor.guest_name}</Text>
                    <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4, fontFamily: 'monospace' }}>{visitor.visitor_id}</Text>
                  </View>
                  {(() => {
                    const status = STATUS_CONFIG[visitor.status] || STATUS_CONFIG.pending;
                    const StatusIcon = status.icon;
                    return (
                      <View style={{ backgroundColor: status.bg, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', gap: 4 }}>
                        <StatusIcon color={status.text} size={16} />
                        <Text style={{ color: status.text, fontSize: 11, fontWeight: '700' }}>{status.label}</Text>
                      </View>
                    );
                  })()}
                </View>
              </View>

              {/* Details */}
              <View style={{ padding: 20, gap: 12 }}>
                {[
                  { icon: Phone, label: 'Phone', value: visitor.guest_phone },
                  { icon: Calendar, label: 'Visit Date', value: new Date(visitor.visit_date).toLocaleDateString() },
                  { icon: MapPin, label: 'Purpose', value: visitor.purpose },
                ].map(({ icon: Icon, label, value }) => (
                  <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
                    <IconBox icon={<Icon color={colors.purple} size={16} />} color={colors.purple} size={36} />
                    <View>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
                      <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 14, marginTop: 2, textTransform: 'capitalize' }}>{value}</Text>
                    </View>
                  </View>
                ))}

                {/* Actions */}
                <View style={{ gap: 10, marginTop: 8 }}>
                  {visitor.status === 'pending' && (
                    <Pressable onPress={handleCheckIn} disabled={actionLoading} style={{ backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: actionLoading ? 0.7 : 1 }}>
                      {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>✅ Check In</Text>}
                    </Pressable>
                  )}
                  {visitor.status === 'checked_in' && (
                    <Pressable onPress={handleCheckOut} disabled={actionLoading} style={{ backgroundColor: colors.heading, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: actionLoading ? 0.7 : 1 }}>
                      {actionLoading ? <ActivityIndicator color={colors.gold} /> : <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 15 }}>🚪 Check Out</Text>}
                    </Pressable>
                  )}
                  {(visitor.status === 'checked_out' || visitor.status === 'expired') && (
                    <View style={{ backgroundColor: colors.background, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
                      <Text style={{ color: colors.muted, fontWeight: '600' }}>No actions available</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </FadeInView>
        )}
      </ScrollView>
    </View>
  )
}