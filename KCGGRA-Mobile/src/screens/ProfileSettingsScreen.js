import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import FadeInView from '../components/FadeInView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, User, Mail, MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from '../components/Card';
import { toast } from '../utils/toast';

export default function ProfileSettingsScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [focused, setFocused] = useState({})
  const [formData, setFormData] = useState({ username: '', email: '', street: '', phone: '' })

  useEffect(() => { fetchMe() }, [])

  const fetchMe = async () => {
    try {
      const res = await api.getMe()
      const user = res.user || res
      setFormData({ username: user.username || '', email: user.email || '', street: user.street || '', phone: user.phone || '' })
    } catch (error) {
      console.error('Failed to fetch profile:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.username || !formData.street) { Alert.alert('Missing fields', 'Name and street are required'); return; }
    try {
      setSaving(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await api.updateProfile({ username: formData.username, email: formData.email, street: formData.street })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      toast.success('Saved', 'Your profile has been updated!')
      navigation.goBack()
    } catch (error) {
      console.error('Failed to update profile', error)
      toast.error('Failed', error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = (key) => ({
    flex: 1, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: colors.heading,
  })

  const fieldStyle = (key) => ({
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: 14,
    borderWidth: focused[key] ? 1.5 : 1,
    borderColor: focused[key] ? colors.purple : colors.border,
    overflow: 'hidden',
    shadowColor: focused[key] ? colors.purple : 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: focused[key] ? 0.15 : 0,
    shadowRadius: focused[key] ? 6 : 0,
  })

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.purple} />
    </View>
  )

  const fields = [
    { key: 'username', label: 'Full Name', icon: User, placeholder: 'John Kamau', required: true },
    { key: 'email', label: 'Email', icon: Mail, placeholder: 'john@example.com', required: false },
    { key: 'street', label: 'Street Address', icon: MapPin, placeholder: 'House 15, Gituamba Lane', required: true },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.heading, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ArrowLeft color={colors.muted} size={20} />
          <Text style={{ color: colors.muted, fontSize: 14 }}>Back</Text>
        </Pressable>
        <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Profile Information</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Update your personal details</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}>
        <FadeInView delay={50}>
          <View style={[cardStyle, { gap: 16 }]}>
            {fields.map(({ key, label, icon: Icon, placeholder, required }) => (
              <View key={key}>
                <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
                  {label} {required && <Text style={{ color: colors.rose }}>*</Text>}
                </Text>
                <View style={fieldStyle(key)}>
                  <View style={{ paddingLeft: 14 }}>
                    <Icon color={focused[key] ? colors.purple : colors.muted} size={18} />
                  </View>
                  <TextInput
                    value={formData[key]}
                    onChangeText={(v) => setFormData({ ...formData, [key]: v })}
                    placeholder={placeholder}
                    placeholderTextColor={colors.muted}
                    style={inputStyle(key)}
                    onFocus={() => setFocused({ ...focused, [key]: true })}
                    onBlur={() => setFocused({ ...focused, [key]: false })}
                    keyboardType={key === 'email' ? 'email-address' : 'default'}
                    autoCapitalize={key === 'email' ? 'none' : 'words'}
                  />
                </View>
              </View>
            ))}

            {/* Phone - read only */}
            <View>
              <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
                Phone <Text style={{ color: colors.muted, fontWeight: '400' }}>(cannot be changed)</Text>
              </Text>
              <View style={{ backgroundColor: colors.background, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 14 }}>
                <Text style={{ color: colors.muted, fontSize: 15 }}>{formData.phone || 'Not set'}</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={100}>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{ backgroundColor: colors.heading, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? <ActivityIndicator color={colors.gold} /> : (
              <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 15 }}>Save Changes</Text>
            )}
          </Pressable>
        </FadeInView>
      </ScrollView>
    </View>
  )
}