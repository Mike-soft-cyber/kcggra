import { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import FadeInView from '../components/FadeInView';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from '../components/Card';
import { toast } from '../utils/toast';

export default function ProfileCompletionScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState({})
  // ✅ SECURITY: No role field — users are always residents
  // Admin/guard roles are granted server-side via secret endpoint only
  const [formData, setFormData] = useState({ username: '', email: '', street: '' })
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()

  const handleCompleteProfile = async () => {
    if (!formData.username || !formData.street) {
      toast.error('Missing fields', 'Please enter your name and address');
      return;
    }
    try {
      setLoading(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await api.completeProfile({
        username: formData.username,
        email: formData.email,
        street: formData.street,
        // ✅ No role sent — backend ignores it anyway
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      // All new users go to resident dashboard
      navigation.reset({ index: 0, routes: [{ name: 'ResidentTabs' }] })
    } catch (error) {
      toast.error('Error', error.message || 'Failed to complete profile')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (key) => ({
    backgroundColor: colors.background, borderRadius: 14,
    borderWidth: focused[key] ? 1.5 : 1,
    borderColor: focused[key] ? colors.purple : colors.border,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: colors.heading,
  })

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, gap: 24 }}
      >
        <FadeInView delay={0}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.heading, letterSpacing: -0.3 }}>
            Complete Profile
          </Text>
          <Text style={{ fontSize: 14, color: colors.body, marginTop: 8 }}>
            Tell us a bit about yourself to get started
          </Text>
        </FadeInView>

        <FadeInView delay={50}>
          <View style={[cardStyle, { gap: 16 }]}>
            {[
              { key: 'username', label: 'Full Name',       placeholder: 'John Kamau',              required: true  },
              { key: 'email',    label: 'Email',            placeholder: 'john@example.com',         required: false },
              { key: 'street',   label: 'Street Address',   placeholder: 'House 15, Gituamba Lane',  required: true  },
            ].map(({ key, label, placeholder, required }) => (
              <View key={key}>
                <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
                  {label}{required && <Text style={{ color: colors.rose }}> *</Text>}
                </Text>
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
            ))}
          </View>
        </FadeInView>

        {/* Info note — no mention of admin/guard */}
        <FadeInView delay={100}>
          <View style={{ backgroundColor: `${colors.purple}10`, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10 }}>
            <Text style={{ fontSize: 16 }}>ℹ️</Text>
            <Text style={{ color: colors.purple, fontSize: 13, flex: 1, lineHeight: 20, fontWeight: '500' }}>
              Your account will be set up as a resident. Contact your community admin if you need a different access level.
            </Text>
          </View>
        </FadeInView>

        <FadeInView delay={150}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleCompleteProfile}
              disabled={loading}
              style={{
                backgroundColor: colors.heading, borderRadius: 16,
                paddingVertical: 18, alignItems: 'center',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color={colors.gold} size="small" />
                  <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 16, marginLeft: 8 }}>
                    Completing...
                  </Text>
                </View>
              ) : (
                <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 16 }}>
                  Complete Profile
                </Text>
              )}
            </Pressable>
          </Animated.View>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}