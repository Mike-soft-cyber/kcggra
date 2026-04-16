import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import FadeInView from '../components/FadeInView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { Shield, MapPin, Clock, AlertTriangle, QrCode, LogOut, Activity } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from '../components/Card';
import IconBox from '../components/IconBox';
import { toast } from '../utils/toast';

const STATUS_OPTIONS = [
  { key: 'on_patrol', label: 'On Patrol', icon: Activity, color: colors.emerald },
  { key: 'at_gate', label: 'At Gate', icon: Shield, color: colors.purple },
  { key: 'break', label: 'On Break', icon: Clock, color: '#E97C3A' },
  { key: 'emergency_response', label: 'Emergency', icon: AlertTriangle, color: colors.rose },
]

export default function GuardDashboardScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [shift, setShift] = useState(null)
  const [patrolStatus, setPatrolStatus] = useState('on_patrol')
  const [updatingLocation, setUpdatingLocation] = useState(false)
  const [incidents, setIncidents] = useState([])

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [shiftRes, incidentsRes] = await Promise.all([
        api.getCurrentShift().catch(() => null),
        api.getIncidents().catch(() => []),
      ])
      setShift(shiftRes?.shift || null)
      setIncidents(incidentsRes?.incidents || incidentsRes || [])
    } catch (error) {
      console.error('Failed to fetch guard dashboard:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStartShift = async () => {
    try {
      await api.startShift()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      toast.success('Shift Started', 'Your shift has begun. Stay safe!')
      fetchDashboardData()
    } catch (error) {
      toast.error('Failed', error.message || 'Failed to start shift')
    }
  }

  const handleEndShift = async () => {
    toast.info('End Shift', 'Are you sure you want to end your shift?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Shift', style: 'destructive', onPress: async () => {
        try {
          await api.endShift()
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          toast.success('Shift Ended', 'Good work!')
          fetchDashboardData()
        } catch (error) {
          toast.error('Failed', error.message)
        }
      }}
    ])
  }

  const handleUpdateLocation = async (status) => {
    try {
      setUpdatingLocation(true)
      setPatrolStatus(status)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync()
      if (permStatus !== 'granted') { Alert.alert('Permission denied', 'Location access is needed'); return; }
      const location = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = location.coords
      await api.updateGuardLocation(latitude, longitude, status)
    } catch (error) {
      console.error('Failed to update location:', error.message)
    } finally {
      setUpdatingLocation(false)
    }
  }

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token')
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  const activeIncidents = incidents.filter(i => i.status === 'reported' || i.status === 'in_progress')

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.heading, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Guard Dashboard</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>KCGGRA Security Portal</Text>
          </View>
          <Pressable onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${colors.rose}20`, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
            <LogOut color={colors.rose} size={16} />
            <Text style={{ color: colors.rose, fontSize: 13, fontWeight: '600' }}>Sign Out</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>

        {/* Shift Card */}
        <FadeInView delay={0}>
          <View style={cardStyle}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <IconBox icon={<Clock color={colors.purple} size={20} />} color={colors.purple} />
              <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 16 }}>Current Shift</Text>
            </View>

            {shift ? (
              <View style={{ gap: 12 }}>
                <View style={{ backgroundColor: `${colors.emerald}15`, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emerald }} />
                  <Text style={{ color: colors.emerald, fontWeight: '700' }}>On Duty</Text>
                  <Text style={{ color: colors.body, fontSize: 13, marginLeft: 'auto' }}>
                    Started {new Date(shift.startTime).toLocaleTimeString()}
                  </Text>
                </View>
                <Pressable onPress={handleEndShift} style={{ backgroundColor: colors.rose, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>End Shift</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View style={{ backgroundColor: colors.background, borderRadius: 14, padding: 14, alignItems: 'center' }}>
                  <Text style={{ color: colors.muted, fontSize: 14 }}>No active shift</Text>
                </View>
                <Pressable onPress={handleStartShift} style={{ backgroundColor: colors.emerald, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Start Shift</Text>
                </Pressable>
              </View>
            )}
          </View>
        </FadeInView>

        {/* Patrol Status */}
        <FadeInView delay={50}>
          <View style={cardStyle}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <IconBox icon={<MapPin color={colors.emerald} size={20} />} color={colors.emerald} />
                <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 16 }}>Patrol Status</Text>
              </View>
              {updatingLocation && <Text style={{ color: colors.muted, fontSize: 12 }}>Updating...</Text>}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {STATUS_OPTIONS.map((s) => {
                const Icon = s.icon;
                const active = patrolStatus === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => handleUpdateLocation(s.key)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: active ? s.color : colors.border,
                      backgroundColor: active ? `${s.color}15` : colors.background,
                      minWidth: '45%',
                    }}
                  >
                    <Icon color={active ? s.color : colors.muted} size={16} />
                    <Text style={{ color: active ? s.color : colors.body, fontSize: 13, fontWeight: '600' }}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </FadeInView>

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <FadeInView delay={100}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.heading, letterSpacing: -0.3, marginBottom: 12 }}>
              Active Incidents <Text style={{ color: colors.rose }}>({activeIncidents.length})</Text>
            </Text>
            <View style={{ gap: 10 }}>
              {activeIncidents.slice(0, 3).map((incident, index) => (
                <View key={incident._id} style={cardStyle}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <IconBox icon={<AlertTriangle color={colors.rose} size={18} />} color={colors.rose} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{incident.title || incident.type}</Text>
                      <Text style={{ color: colors.body, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{incident.description}</Text>
                    </View>
                    <View style={{ backgroundColor: `${colors.rose}20`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: colors.rose, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>{incident.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>
        )}

      </ScrollView>
    </View>
  )
}