import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import FadeInView from '../components/FadeInView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { ArrowLeft, AlertTriangle, Flame, Eye, Wind, MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from '../components/Card';
import IconBox from '../components/IconBox';
import { toast } from '../utils/toast';

const INCIDENT_TYPES = [
  { key: 'burglary', label: 'Burglary', desc: 'Break-in or theft', icon: AlertTriangle, color: colors.rose },
  { key: 'fire', label: 'Fire', desc: 'Fire or smoke', icon: Flame, color: '#E97C3A' },
  { key: 'environmental', label: 'Environmental', desc: 'Flood or gas leak', icon: Wind, color: '#4A7C6F' },
  { key: 'suspicious', label: 'Suspicious', desc: 'Suspicious activity', icon: Eye, color: colors.purple },
]

export default function ReportIncidentScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)
  const [titleFocused, setTitleFocused] = useState(false)
  const [descFocused, setDescFocused] = useState(false)
  const [addressFocused, setAddressFocused] = useState(false)
  const [formData, setFormData] = useState({ type: '', title: '', description: '', address: '' })

  const handleSubmit = async () => {
    if (!formData.type || !formData.title || !formData.description) {
      toast.error('Missing fields', 'Please fill in all required fields'); return;
    }
    try {
      setLoading(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permission denied', 'Location access is needed'); return; }
      const location = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = location.coords
      await api.createIncident({ ...formData, latitude, longitude })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      toast.success('Reported', 'Your incident has been submitted.')
      navigation.goBack()
    } catch (error) {
      console.error('Failed to submit', error)
      toast.error('Error', error.message || 'Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (focused) => ({
    backgroundColor: colors.background, borderRadius: 14,
    borderWidth: focused ? 1.5 : 1,
    borderColor: focused ? colors.purple : colors.border,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: colors.heading,
  })

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.heading, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ArrowLeft color={colors.muted} size={20} />
          <Text style={{ color: colors.muted, fontSize: 14 }}>Back</Text>
        </Pressable>
        <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Report Incident</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Provide details about what happened</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>

        {/* Type Selection */}
        <FadeInView delay={0}>
          <View style={cardStyle}>
            <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 15, marginBottom: 14 }}>
              Incident Type <Text style={{ color: colors.rose }}>*</Text>
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {INCIDENT_TYPES.map((type) => {
                const Icon = type.icon;
                const selected = formData.type === type.key;
                return (
                  <Pressable
                    key={type.key}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFormData({ ...formData, type: type.key }); }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10,
                      paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: selected ? type.color : colors.border,
                      backgroundColor: selected ? `${type.color}15` : colors.background,
                      minWidth: '45%',
                    }}
                  >
                    <IconBox icon={<Icon color={selected ? type.color : colors.muted} size={16} />} color={selected ? type.color : colors.muted} size={32} />
                    <View>
                      <Text style={{ color: selected ? type.color : colors.heading, fontWeight: '700', fontSize: 13 }}>{type.label}</Text>
                      <Text style={{ color: colors.muted, fontSize: 11 }}>{type.desc}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </FadeInView>

        {/* Form */}
        <FadeInView delay={50}>
          <View style={[cardStyle, { gap: 14 }]}>
            <View>
              <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 14, marginBottom: 8 }}>Title <Text style={{ color: colors.rose }}>*</Text></Text>
              <TextInput value={formData.title} onChangeText={(v) => setFormData({ ...formData, title: v })} placeholder="Brief title of the incident" placeholderTextColor={colors.muted} style={inputStyle(titleFocused)} onFocus={() => setTitleFocused(true)} onBlur={() => setTitleFocused(false)} />
            </View>
            <View>
              <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 14, marginBottom: 8 }}>Description <Text style={{ color: colors.rose }}>*</Text></Text>
              <TextInput value={formData.description} onChangeText={(v) => setFormData({ ...formData, description: v })} placeholder="Describe what happened in detail..." placeholderTextColor={colors.muted} multiline numberOfLines={4} textAlignVertical="top" style={[inputStyle(descFocused), { minHeight: 120 }]} onFocus={() => setDescFocused(true)} onBlur={() => setDescFocused(false)} />
            </View>
            <View>
              <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 14, marginBottom: 8 }}>Address <Text style={{ color: colors.muted, fontWeight: '400' }}>(optional)</Text></Text>
              <TextInput value={formData.address} onChangeText={(v) => setFormData({ ...formData, address: v })} placeholder="e.g. Near the main gate" placeholderTextColor={colors.muted} style={inputStyle(addressFocused)} onFocus={() => setAddressFocused(true)} onBlur={() => setAddressFocused(false)} />
            </View>
          </View>
        </FadeInView>

        {/* GPS Note */}
        <FadeInView delay={50}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: `${colors.purple}10`, borderRadius: 14, padding: 14 }}>
            <MapPin color={colors.purple} size={18} />
            <Text style={{ color: colors.purple, fontSize: 13, flex: 1, fontWeight: '500' }}>Your GPS location will be automatically attached</Text>
          </View>
        </FadeInView>

        {/* Submit */}
        <FadeInView delay={50}>
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={{ backgroundColor: colors.heading, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color={colors.gold} size="small" />
                <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 15, marginLeft: 8 }}>Submitting...</Text>
              </View>
            ) : (
              <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 15 }}>Submit Report</Text>
            )}
          </Pressable>
        </FadeInView>

      </ScrollView>
    </View>
  )
}