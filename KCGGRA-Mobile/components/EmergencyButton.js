import { useState } from 'react';
import { View, Text, Pressable, Modal, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import api from '../src/services/api';

const EMERGENCY_TYPES = [
  { key: 'burglary',     label: 'Burglary',       icon: '🔓', desc: 'Break-in or theft in progress'   },
  { key: 'fire',         label: 'Fire',            icon: '🔥', desc: 'Fire or smoke detected'           },
  { key: 'environmental',label: 'Environmental',   icon: '⚠️', desc: 'Flood, gas leak or hazard'       },
  { key: 'suspicious',   label: 'Suspicious',      icon: '👁️', desc: 'Suspicious activity nearby'      },
];

export default function EmergencyButton() {
  const [showTypeModal, setShowTypeModal]       = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedType, setSelectedType]         = useState(null);
  const [loading, setLoading]                   = useState(false);

  const selected = EMERGENCY_TYPES.find(t => t.key === selectedType);

  const handleSendAlert = async () => {
    try {
      setLoading(true);
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
    <View className="items-center justify-center">

      {/* ── SOS Button ── */}
      <View className="items-center justify-center">
        {/* Outer pulse ring */}
        <View className="absolute w-44 h-44 rounded-full bg-red-500/20 items-center justify-center">
          <View className="w-36 h-36 rounded-full bg-red-500/30" />
        </View>

        <Pressable
          onPress={() => setShowTypeModal(true)}
          disabled={loading}
          className="w-32 h-32 rounded-full bg-red-600 items-center justify-center
                     shadow-2xl active:bg-red-700 active:scale-95"
          style={({ pressed }) => ({
            shadowColor: '#dc2626',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: pressed ? 0.3 : 0.7,
            shadowRadius: pressed ? 8 : 24,
            elevation: pressed ? 6 : 18,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Text className="text-4xl mb-1">🚨</Text>
          <Text className="text-white font-black text-lg tracking-widest">SOS</Text>
        </Pressable>
      </View>

      <Text className="mt-4 text-gray-400 text-xs tracking-widest uppercase font-medium">
        Tap to report emergency
      </Text>

      {/* ── Type Selection Modal ── */}
      <Modal visible={showTypeModal} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setShowTypeModal(false)}
        >
          <Pressable onPress={() => {}} className="bg-white rounded-t-3xl overflow-hidden">

            {/* Header */}
            <View className="bg-red-600 px-6 pt-8 pb-6">
              <View className="w-10 h-1 rounded-full bg-red-400 self-center mb-4" />
              <Text className="text-white font-black text-2xl tracking-tight">Emergency Alert</Text>
              <Text className="text-red-200 text-sm mt-1">Select the type of emergency</Text>
            </View>

            {/* Options */}
            <View className="p-4 gap-3">
              {EMERGENCY_TYPES.map((type) => (
                <Pressable
                  key={type.key}
                  onPress={() => {
                    setSelectedType(type.key);
                    setShowTypeModal(false);
                    setShowConfirmModal(true);
                  }}
                  disabled={loading}
                  className="flex-row items-center bg-gray-50 border border-gray-100
                             rounded-2xl px-4 py-4 active:bg-red-50 active:border-red-200"
                >
                  <View className="w-12 h-12 rounded-xl bg-white shadow-sm items-center justify-center mr-4">
                    <Text className="text-2xl">{type.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-bold text-base">{type.label}</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">{type.desc}</Text>
                  </View>
                  <Text className="text-gray-300 text-lg">›</Text>
                </Pressable>
              ))}
            </View>

            {/* Cancel */}
            <View className="px-4 pb-8">
              <Pressable
                onPress={() => setShowTypeModal(false)}
                className="bg-gray-100 rounded-2xl py-4 items-center active:bg-gray-200"
              >
                <Text className="text-gray-500 font-semibold text-base">Cancel</Text>
              </Pressable>
            </View>

          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Confirm Modal ── */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-white rounded-3xl overflow-hidden">

            {/* Warning stripe */}
            <View className="bg-red-600 pt-8 pb-6 px-6 items-center">
              <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-3">
                <Text className="text-4xl">{selected?.icon ?? '🚨'}</Text>
              </View>
              <Text className="text-white font-black text-xl tracking-tight text-center">
                Confirm {selected?.label} Alert
              </Text>
              <Text className="text-red-200 text-sm text-center mt-1">
                Your live location will be shared with responders
              </Text>
            </View>

            <View className="p-6 gap-3">
              {/* Info chip */}
              <View className="flex-row items-center bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <Text className="text-amber-500 mr-2">📍</Text>
                <Text className="text-amber-700 text-xs flex-1 font-medium">
                  GPS location will be attached to your alert automatically
                </Text>
              </View>

              {/* Send */}
              <Pressable
                onPress={handleSendAlert}
                disabled={loading}
                className="bg-red-600 rounded-2xl py-4 items-center active:bg-red-700"
                style={({ pressed }) => ({
                  opacity: pressed || loading ? 0.85 : 1,
                })}
              >
                {loading ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="#fff" size="small" />
                    <Text className="text-white font-bold text-base ml-2">Sending…</Text>
                  </View>
                ) : (
                  <Text className="text-white font-black text-base tracking-wide">
                    🚨  Send Alert Now
                  </Text>
                )}
              </Pressable>

              {/* Cancel */}
              <Pressable
                onPress={() => setShowConfirmModal(false)}
                disabled={loading}
                className="bg-gray-100 rounded-2xl py-4 items-center active:bg-gray-200"
              >
                <Text className="text-gray-500 font-semibold text-base">Cancel</Text>
              </Pressable>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}