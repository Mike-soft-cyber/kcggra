import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import FadeInView from '../components/FadeInView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Lock, Eye, EyeOff, Smartphone } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from '../components/Card';
import IconBox from '../components/IconBox';
import { toast } from '../utils/toast';

export default function SecuritySettingsScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [saving, setSaving] = useState(false)
  const [showPasswords, setShowPasswords] = useState({})
  const [focused, setFocused] = useState({})
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const handleChangePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) { Alert.alert('Missing fields', 'Please fill in all fields'); return; }
    if (formData.newPassword !== formData.confirmPassword) { Alert.alert('Error', 'New passwords do not match'); return; }
    if (formData.newPassword.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    try {
      setSaving(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await api.changePassword({ currentPassword: formData.currentPassword, newPassword: formData.newPassword })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      toast.success('Updated', 'Your password has been changed!')
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      navigation.goBack()
    } catch (error) {
      toast.error('Failed', error.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { key: 'currentPassword', label: 'Current Password' },
    { key: 'newPassword', label: 'New Password' },
    { key: 'confirmPassword', label: 'Confirm New Password' },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.heading, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ArrowLeft color={colors.muted} size={20} />
          <Text style={{ color: colors.muted, fontSize: 14 }}>Back</Text>
        </Pressable>
        <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Security</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Manage your account security</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}>
        <FadeInView delay={0}>
          <View style={[cardStyle, { gap: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <IconBox icon={<Lock color={colors.emerald} size={18} />} color={colors.emerald} />
              <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 16 }}>Change Password</Text>
            </View>
            {fields.map(({ key, label }) => (
              <View key={key}>
                <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 14, marginBottom: 8 }}>{label}</Text>
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: colors.background, borderRadius: 14,
                  borderWidth: focused[key] ? 1.5 : 1,
                  borderColor: focused[key] ? colors.purple : colors.border,
                  overflow: 'hidden',
                }}>
                  <TextInput
                    value={formData[key]}
                    onChangeText={(v) => setFormData({ ...formData, [key]: v })}
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPasswords[key]}
                    style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.heading }}
                    onFocus={() => setFocused({ ...focused, [key]: true })}
                    onBlur={() => setFocused({ ...focused, [key]: false })}
                  />
                  <Pressable onPress={() => setShowPasswords({ ...showPasswords, [key]: !showPasswords[key] })} style={{ paddingHorizontal: 14 }}>
                    {showPasswords[key] ? <EyeOff color={colors.muted} size={18} /> : <Eye color={colors.muted} size={18} />}
                  </Pressable>
                </View>
              </View>
            ))}
            <Pressable onPress={handleChangePassword} disabled={saving} style={{ backgroundColor: colors.heading, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: saving ? 0.7 : 1 }}>
              {saving ? <ActivityIndicator color={colors.gold} /> : <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 15 }}>Update Password</Text>}
            </Pressable>
          </View>
        </FadeInView>

        <FadeInView delay={50}>
          <Pressable
            onPress={() => navigation.navigate('ActiveSessions')}
            style={({ pressed }) => ({
              ...cardStyle,
              flexDirection: 'row', alignItems: 'center', gap: 14,
              backgroundColor: pressed ? colors.background : colors.surface,
            })}
          >
            <IconBox icon={<Smartphone color={colors.purple} size={18} />} color={colors.purple} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 15 }}>Active Sessions</Text>
              <Text style={{ color: colors.body, fontSize: 12, marginTop: 2 }}>View & manage logged in devices</Text>
            </View>
            <ArrowLeft color={colors.muted} size={18} style={{ transform: [{ rotate: '180deg' }] }} />
          </Pressable>
        </FadeInView>
      </ScrollView>
    </View>
  )
}