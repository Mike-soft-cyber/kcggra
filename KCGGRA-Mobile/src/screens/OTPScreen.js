import { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import FadeInView from '../components/FadeInView';
import api from '../services/api';
import { colors } from '../themes/colors';
import { toast } from '../utils/toast';

export default function OTPScreen({ navigation, route }) {
  const { phone } = route.params;
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Invalid OTP', 'Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await api.verifyOTP(phone, otp);
      await SecureStore.setItemAsync('token', response.token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const role = response.user.role;
      const isNewUser = response.user.username.startsWith('User_');

      if (isNewUser) {
        // New user — complete profile (name + street only, no role picker)
        navigation.navigate('ProfileCompletion');
      } else if (role === 'guard') {
        // Guards come through OTP flow
        navigation.reset({ index: 0, routes: [{ name: 'GuardTabs' }] });
      } else {
        // Residents — the only role reachable via OTP
        // ✅ Admins never land here — they use the hidden login modal
        navigation.reset({ index: 0, routes: [{ name: 'ResidentTabs' }] });
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error('Failed', error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={{
        flex: 1, backgroundColor: colors.background,
        paddingTop: insets.top, paddingHorizontal: 24, justifyContent: 'center'
      }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 40 }}
        >
          <ArrowLeft color={colors.body} size={20} />
          <Text style={{ color: colors.body, fontSize: 14 }}>Back</Text>
        </Pressable>

        <FadeInView delay={0}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.heading, letterSpacing: -0.3, marginBottom: 8 }}>
            Verify OTP
          </Text>
          <Text style={{ fontSize: 14, color: colors.body, marginBottom: 40 }}>
            Enter the 6-digit code sent to {phone}
          </Text>
        </FadeInView>

        <FadeInView delay={50}>
          <TextInput
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              borderWidth: focused ? 1.5 : 1,
              borderColor: focused ? colors.purple : colors.border,
              paddingHorizontal: 24, paddingVertical: 20,
              fontSize: 32, color: colors.heading,
              textAlign: 'center', letterSpacing: 12,
              elevation: 2, marginBottom: 24,
            }}
            placeholder="• • • • • •"
            placeholderTextColor={colors.muted}
            value={otp}
            onChangeText={setOTP}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </FadeInView>

        <FadeInView delay={100}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleVerifyOTP}
              disabled={loading}
              style={{
                backgroundColor: colors.heading, borderRadius: 16,
                paddingVertical: 18, alignItems: 'center',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? <ActivityIndicator color={colors.gold} />
                : <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 16 }}>Verify OTP</Text>}
            </Pressable>
          </Animated.View>
        </FadeInView>
      </View>
    </KeyboardAvoidingView>
  );
}