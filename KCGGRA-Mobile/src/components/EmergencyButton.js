import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, Alert, ActivityIndicator, Animated } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, Flame, Eye, Wind } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from './Card';

const EMERGENCY_TYPES = [
  { key: 'burglary', label: 'Burglary', desc: 'Break-in or theft in progress', icon: AlertTriangle, color: colors.rose },
  { key: 'fire', label: 'Fire', desc: 'Fire or smoke detected', icon: Flame, color: '#E97C3A' },
  { key: 'environmental', label: 'Environmental', desc: 'Flood, gas leak or hazard', icon: Wind, color: '#4A7C6F' },
  { key: 'suspicious', label: 'Suspicious', desc: 'Suspicious activity nearby', icon: Eye, color: colors.purple },
];

function SonarRing({ delay, maxScale }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true })
      ).start();
    }, delay);
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute',
      width: 120, height: 120, borderRadius: 60,
      borderWidth: 2, borderColor: colors.rose,
      opacity: anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.4, 0.1, 0] }),
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, maxScale] }) }],
    }} />
  );
}

export default function EmergencyButton() {
  const insets = useSafeAreaInsets();
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const selected = EMERGENCY_TYPES.find(t => t.key === selectedType);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleSendAlert = async () => {
    try {
      setLoading(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed for emergency reporting');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      await api.sendAlertIncident(selectedType, latitude, longitude, '');
      setShowConfirmModal(false);
      Alert.alert('Alert Sent', 'Emergency responders have been notified. Stay safe!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to alert incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[cardStyle, { alignItems: 'center', paddingVertical: 32 }]}>
      <Text style={{ color: colors.heading, fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginBottom: 24 }}>
        Emergency Alert
      </Text>

      <View style={{ alignItems: 'center', justifyContent: 'center', width: 200, height: 200 }}>
        <SonarRing delay={0} maxScale={1.6} />
        <SonarRing delay={600} maxScale={1.9} />
        <SonarRing delay={1200} maxScale={2.2} />
        <Animated.View style={{ transform: [{ scale }] }}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => setShowTypeModal(true)}
            disabled={loading}
            style={{
              width: 120, height: 120, borderRadius: 60,
              backgroundColor: colors.rose,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: colors.rose,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
            }}
          >
            <AlertTriangle color="#fff" size={32} strokeWidth={2.5} />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 3, marginTop: 4 }}>SOS</Text>
          </Pressable>
        </Animated.View>
      </View>

      <Text style={{ color: colors.muted, fontSize: 12, letterSpacing: 1.5, marginTop: 16, textTransform: 'uppercase' }}>
        Tap to report emergency
      </Text>

      {/* Type Selection Modal — full screen */}
      <Modal visible={showTypeModal} transparent={false} animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{
            backgroundColor: colors.rose,
            paddingTop: insets.top + 20,
            paddingBottom: 28,
            paddingHorizontal: 24,
          }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)', alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 24, letterSpacing: -0.3 }}>Emergency Alert</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 6 }}>Select the type of emergency</Text>
          </View>

          <View style={{ flex: 1, padding: 16, gap: 12 }}>
            {EMERGENCY_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Pressable
                  key={type.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedType(type.key);
                    setShowTypeModal(false);
                    setShowConfirmModal(true);
                  }}
                  style={({ pressed }) => ({
                    // KEY FIX: explicit row so icon + text sit side by side
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: pressed ? `${type.color}15` : colors.surface,
                    borderRadius: 20,
                    padding: 18,
                    borderWidth: 1.5,
                    borderColor: `${type.color}40`,
                    elevation: 1,
                  })}
                >
                  <View style={{
                    width: 52, height: 52, borderRadius: 16,
                    backgroundColor: `${type.color}20`,
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 16,
                  }}>
                    <Icon color={type.color} size={24} />
                  </View>

                  {/* This View must have flex:1 so text doesn't get squashed to zero width */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 17 }}>
                      {type.label}
                    </Text>
                    <Text style={{ color: colors.body, fontSize: 13, marginTop: 3 }}>
                      {type.desc}
                    </Text>
                  </View>

                  <Text style={{ color: colors.muted, fontSize: 22 }}>›</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}>
            <Pressable
              onPress={() => setShowTypeModal(false)}
              style={{ backgroundColor: colors.border, borderRadius: 20, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ color: colors.body, fontWeight: '600', fontSize: 16 }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Confirm Modal — full screen */}
      <Modal visible={showConfirmModal} transparent={false} animationType="fade" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{
            backgroundColor: colors.rose,
            paddingTop: insets.top + 24,
            paddingBottom: 36,
            paddingHorizontal: 24,
            alignItems: 'center',
          }}>
            {selected && (
              <View style={{
                width: 72, height: 72, borderRadius: 22,
                backgroundColor: 'rgba(255,255,255,0.25)',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <selected.icon color="#fff" size={36} />
              </View>
            )}
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 24, textAlign: 'center', letterSpacing: -0.3 }}>
              Confirm {selected?.label} Alert
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
              Your location will be shared with responders
            </Text>
          </View>

          <View style={{ flex: 1, padding: 24, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.gold}40`, borderRadius: 16, padding: 16, gap: 12 }}>
              <Text style={{ fontSize: 22 }}>📍</Text>
              <Text style={{ color: colors.heading, fontSize: 14, flex: 1, lineHeight: 20 }}>
                Your GPS location will be attached automatically.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.rose}10`, borderRadius: 16, padding: 16, gap: 12 }}>
              <Text style={{ fontSize: 22 }}>⚠️</Text>
              <Text style={{ color: colors.rose, fontSize: 14, flex: 1, lineHeight: 20, fontWeight: '600' }}>
                Only use for genuine emergencies.
              </Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24, gap: 12 }}>
            <Pressable
              onPress={handleSendAlert}
              disabled={loading}
              style={{ backgroundColor: colors.rose, borderRadius: 18, paddingVertical: 18, alignItems: 'center', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Sending…</Text>
                </View>
              ) : (
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>🚨  Send Alert Now</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => setShowConfirmModal(false)}
              disabled={loading}
              style={{ backgroundColor: colors.border, borderRadius: 18, paddingVertical: 18, alignItems: 'center' }}
            >
              <Text style={{ color: colors.body, fontWeight: '600', fontSize: 16 }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}