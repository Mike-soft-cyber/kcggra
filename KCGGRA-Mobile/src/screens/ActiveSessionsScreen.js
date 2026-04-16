import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { ArrowLeft, Smartphone, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from '../components/Card';
import IconBox from '../components/IconBox';
import FadeInView from '../components/FadeInView';
import { toast } from '../utils/toast';

export default function ActiveSessionsScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => { fetchSessions() }, [])

  const fetchSessions = async () => {
    try {
      const res = await api.getSessions()
      setSessions(res.sessions || res || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOutAll = async () => {
    toast.info('Sign Out All', 'This will sign you out of all devices.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out All', style: 'destructive', onPress: async () => {
        try {
          setSigningOut(true)
          await api.signOutAll()
          await SecureStore.deleteItemAsync('token')
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
        } catch (error) {
          Alert.alert('Failed', error.message)
        } finally {
          setSigningOut(false)
        }
      }}
    ])
  }

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.purple} />
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.heading, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ArrowLeft color={colors.muted} size={20} />
          <Text style={{ color: colors.muted, fontSize: 14 }}>Back</Text>
        </Pressable>
        <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Active Sessions</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Devices logged into your account</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}>
        {sessions.length === 0 ? (
          <View style={[cardStyle, { alignItems: 'center', paddingVertical: 40 }]}>
            <IconBox icon={<Smartphone color={colors.muted} size={24} />} color={colors.muted} size={52} />
            <Text style={{ color: colors.muted, fontSize: 15, marginTop: 12 }}>No active sessions</Text>
          </View>
        ) : (
          sessions.map((session, index) => (
            <FadeInView delay={50}>
              <View style={cardStyle}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <IconBox icon={<Smartphone color={colors.purple} size={18} />} color={colors.purple} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 15 }}>{session.device || 'Unknown Device'}</Text>
                    <Text style={{ color: colors.body, fontSize: 13, marginTop: 2 }}>{session.ip_address}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{new Date(session.last_active).toLocaleString()}</Text>
                  </View>
                  {index === 0 && (
                    <View style={{ backgroundColor: `${colors.emerald}20`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: colors.emerald, fontSize: 11, fontWeight: '700' }}>Current</Text>
                    </View>
                  )}
                </View>
              </View>
            </FadeInView>
          ))
        )}

        <Pressable
          onPress={handleSignOutAll}
          disabled={signingOut}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
            backgroundColor: pressed ? `${colors.rose}15` : colors.surface,
            borderRadius: 16, paddingVertical: 16,
            borderWidth: 1.5, borderColor: `${colors.rose}30`,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
            opacity: signingOut ? 0.7 : 1,
          })}
        >
          {signingOut ? <ActivityIndicator color={colors.rose} /> : (
            <>
              <LogOut color={colors.rose} size={18} />
              <Text style={{ color: colors.rose, fontWeight: '700', fontSize: 15 }}>Sign Out of All Devices</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  )
}