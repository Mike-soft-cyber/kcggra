import { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, Animated, Modal, Alert
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import FadeInView from '../components/FadeInView';
import api from '../services/api';
import { colors } from '../themes/colors';
import { toast } from '../utils/toast';

// ─────────────────────────────────────────────────────
// The admin PIN is checked LOCALLY first, then the server
// verifies the role. Two-factor in effect:
//   1. Must know the local PIN (only on your device)
//   2. Must have a server account with role:'admin'
//
// Set your PIN below — change this before deploying.
// In production, store in an env/build variable.
// ─────────────────────────────────────────────────────
const ADMIN_PIN = process.env.EXPO_PUBLIC_ADMIN_PIN || '000000'; // override in .env
const LOGO_TAPS_REQUIRED = 7; // user needs to tap logo 7 times to trigger

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [phoneDigits, setPhoneDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  // ── Logo tap counter (hidden admin trigger) ──
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef(null);

  // ── Admin login modal state ──
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [adminStep, setAdminStep] = useState('pin'); // 'pin' | 'credentials'
  const [adminLoading, setAdminLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);

  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  // ── Handle logo taps ──
  const handleLogoTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    // Reset counter after 2 seconds of no tapping
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setTapCount(0), 2000);

    if (newCount >= LOGO_TAPS_REQUIRED) {
      clearTimeout(tapTimer.current);
      setTapCount(0);
      // Small haptic so you know it triggered
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setAdminStep('pin');
      setAdminPin('');
      setAdminEmail('');
      setAdminPassword('');
      setShowAdminModal(true);
    }
  };

  // ── Resident OTP login ──
  const handleSendOTP = async () => {
    if (phoneDigits.length !== 9) {
      toast.error('Invalid number', 'Please enter 9 digits');
      return;
    }
    const fullPhone = `254${phoneDigits}`;
    setLoading(true);
    try {
      await api.requestOTP(fullPhone);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('OTP', { phone: fullPhone });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error('Failed', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Admin: verify local PIN first ──
  const handleVerifyPin = () => {
    if (adminPin !== ADMIN_PIN) {
      const newAttempts = pinAttempts + 1;
      setPinAttempts(newAttempts);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAdminPin('');

      if (newAttempts >= 3) {
        // Close and lock after 3 wrong PINs — no hint given
        setShowAdminModal(false);
        setPinAttempts(0);
        return;
      }
      return; // no toast — just clear the field silently
    }
    // PIN correct — show credential form
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPinAttempts(0);
    setAdminPin('');
    setAdminStep('credentials');
  };

  // ── Admin: server login ──
  const handleAdminLogin = async () => {
    if (!adminEmail || !adminPassword) {
      toast.error('Missing fields', 'Enter your admin email and password');
      return;
    }
    setAdminLoading(true);
    try {
      const res = await api.adminLogin(adminEmail, adminPassword);

      if (res.user?.role !== 'admin') {
        // Deliberately vague
        toast.error('Access denied', 'Invalid credentials');
        setShowAdminModal(false);
        return;
      }

      await SecureStore.setItemAsync('token', res.token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAdminModal(false);
      navigation.reset({ index: 0, routes: [{ name: 'AdminTabs' }] });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Vague error — don't confirm this is an admin portal
      toast.error('Failed', 'Invalid credentials');
    } finally {
      setAdminLoading(false);
    }
  };

  const closeAdminModal = () => {
    setShowAdminModal(false);
    setAdminPin('');
    setAdminEmail('');
    setAdminPassword('');
    setAdminStep('pin');
    setPinAttempts(0);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={{
        flex: 1, backgroundColor: colors.background,
        paddingTop: insets.top, paddingHorizontal: 24, justifyContent: 'center'
      }}>
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          {/* ── Tappable logo — 7 taps opens hidden admin modal ── */}
          <Pressable onPress={handleLogoTap} style={{ marginBottom: 20 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 24,
              backgroundColor: colors.heading,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: colors.heading, shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
            }}>
              <Text style={{ fontSize: 40 }}>🛡️</Text>
            </View>
          </Pressable>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.heading, letterSpacing: -0.3 }}>
            KCGGRA
          </Text>
          <Text style={{ fontSize: 14, color: colors.body, marginTop: 6 }}>Community Portal</Text>
        </View>

        {/* Resident phone login card */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: 28, overflow: 'hidden',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
        }}>
          {/* Card header */}
          <View style={{ backgroundColor: colors.heading, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 }}>
            <Text style={{ color: colors.gold, fontSize: 20, fontWeight: '700' }}>Welcome back</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>Enter your phone number to continue</Text>
          </View>

          <View style={{ padding: 24 }}>
            {/* Phone input */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: colors.background,
              borderRadius: 16, borderWidth: focused ? 1.5 : 1,
              borderColor: focused ? colors.purple : colors.border,
              marginBottom: 16, overflow: 'hidden',
            }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderRightWidth: 1, borderRightColor: colors.border }}>
                <Text style={{ color: colors.body, fontWeight: '600', fontSize: 15 }}>+254</Text>
              </View>
              <TextInput
                style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.heading }}
                placeholder="712 345 678"
                placeholderTextColor={colors.muted}
                value={phoneDigits}
                onChangeText={setPhoneDigits}
                keyboardType="phone-pad"
                maxLength={9}
                editable={!loading}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>

            <Animated.View style={{ transform: [{ scale }] }}>
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleSendOTP}
                disabled={loading}
                style={{
                  backgroundColor: colors.heading, borderRadius: 16,
                  paddingVertical: 16, alignItems: 'center',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading
                  ? <ActivityIndicator color={colors.gold} />
                  : <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 15 }}>Send OTP</Text>}
              </Pressable>
            </Animated.View>
          </View>
        </View>

        <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 24 }}>
          KCGGRA Gated Community Management
        </Text>
      </View>

      {/* ═══════════════════════════════════════════════════
          HIDDEN ADMIN MODAL
          Only appears after 7 logo taps.
          Step 1: PIN (known only to you, set in .env)
          Step 2: Email + Password (server-verified)
      ═══════════════════════════════════════════════════ */}
      <Modal visible={showAdminModal} transparent animationType="fade" statusBarTranslucent>
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
          alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <View style={{
            backgroundColor: colors.heading, borderRadius: 24, overflow: 'hidden',
            width: '100%', maxWidth: 360,
            shadowColor: '#000', shadowOffset: { width: 0, height: 24 },
            shadowOpacity: 0.6, shadowRadius: 40, elevation: 20,
          }}>
            {/* Thin gold accent line */}
            <View style={{ height: 2, backgroundColor: colors.gold, opacity: 0.4 }} />

            <View style={{ padding: 28 }}>
              {/* Generic icon — no "Admin" text */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View style={{
                  width: 56, height: 56, borderRadius: 16,
                  backgroundColor: `${colors.gold}15`,
                  borderWidth: 1, borderColor: `${colors.gold}25`,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 26 }}>🔐</Text>
                </View>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Restricted Access
                </Text>
              </View>

              {adminStep === 'pin' ? (
                <>
                  {/* PIN entry */}
                  <TextInput
                    value={adminPin}
                    onChangeText={setAdminPin}
                    placeholder="• • • • • •"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    maxLength={6}
                    secureTextEntry
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 14, borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.1)',
                      paddingHorizontal: 20, paddingVertical: 16,
                      fontSize: 24, color: 'white', textAlign: 'center',
                      letterSpacing: 8, marginBottom: 16,
                    }}
                    autoFocus
                  />

                  {/* Subtle attempt dots */}
                  {pinAttempts > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
                      {[0,1,2].map(i => (
                        <View key={i} style={{
                          width: 6, height: 6, borderRadius: 3,
                          backgroundColor: i < pinAttempts ? colors.rose : 'rgba(255,255,255,0.15)',
                        }} />
                      ))}
                    </View>
                  )}

                  <Pressable
                    onPress={handleVerifyPin}
                    disabled={adminPin.length < 4}
                    style={{
                      backgroundColor: adminPin.length >= 4 ? colors.gold : 'rgba(255,255,255,0.1)',
                      borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{
                      color: adminPin.length >= 4 ? colors.heading : colors.muted,
                      fontWeight: '700', fontSize: 15,
                    }}>
                      Continue
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  {/* Email */}
                  <TextInput
                    value={adminEmail}
                    onChangeText={setAdminEmail}
                    placeholder="Email"
                    placeholderTextColor={colors.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 14, borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.1)',
                      paddingHorizontal: 16, paddingVertical: 14,
                      fontSize: 15, color: 'white', marginBottom: 12,
                    }}
                    autoFocus
                  />

                  {/* Password */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 14, borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    marginBottom: 20, overflow: 'hidden',
                  }}>
                    <TextInput
                      value={adminPassword}
                      onChangeText={setAdminPassword}
                      placeholder="Password"
                      placeholderTextColor={colors.muted}
                      secureTextEntry={!showAdminPassword}
                      style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: 'white' }}
                    />
                    <Pressable onPress={() => setShowAdminPassword(!showAdminPassword)} style={{ paddingHorizontal: 14 }}>
                      {showAdminPassword
                        ? <EyeOff color={colors.muted} size={18} />
                        : <Eye color={colors.muted} size={18} />}
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={handleAdminLogin}
                    disabled={adminLoading}
                    style={{
                      backgroundColor: colors.gold,
                      borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                      marginBottom: 12, opacity: adminLoading ? 0.7 : 1,
                    }}
                  >
                    {adminLoading
                      ? <ActivityIndicator color={colors.heading} />
                      : <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 15 }}>Authenticate</Text>}
                  </Pressable>
                </>
              )}

              {/* Cancel — no label, just an X */}
              <Pressable onPress={closeAdminModal} style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>✕</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}