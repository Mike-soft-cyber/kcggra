import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import FadeInView from '../components/FadeInView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Users, Plus, Phone } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from '../components/Card';
import IconBox from '../components/IconBox';
import { toast } from '../utils/toast';

export default function ProxyAccountsScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [proxyAccounts, setProxyAccounts] = useState([])
  const [phone, setPhone] = useState('')
  const [focused, setFocused] = useState(false)

  useEffect(() => { fetchProxies() }, [])

  const fetchProxies = async () => {
    try {
      const res = await api.getMe()
      const user = res.user || res
      setProxyAccounts(user.proxy_accounts || [])
    } catch (error) {
      console.error('Failed to fetch proxy accounts:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProxy = async () => {
    if (!phone || phone.length < 9) { Alert.alert('Invalid phone', 'Please enter a valid phone number'); return; }
    try {
      setAdding(true)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      const fullPhone = phone.startsWith('254') ? phone : `254${phone.replace(/^0/, '')}`
      await api.addProxyAccount({ phone: fullPhone })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      toast.success('Added', 'Proxy account added successfully!')
      setPhone('')
      setShowForm(false)
      fetchProxies()
    } catch (error) {
      console.error('Failed to add proxy account', error)
      toast.error('Failed', error.message || 'Failed to add proxy account')
    } finally {
      setAdding(false)
    }
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
        <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Proxy Accounts</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Accounts that can act on your behalf</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}>
        {proxyAccounts.length === 0 ? (
          <FadeInView delay={0}>
            <View style={[cardStyle, { alignItems: 'center', paddingVertical: 40 }]}>
              <IconBox icon={<Users color={colors.muted} size={24} />} color={colors.muted} size={52} />
              <Text style={{ color: colors.muted, fontSize: 15, marginTop: 12 }}>No proxy accounts yet</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>Add a trusted person to act on your behalf</Text>
            </View>
          </FadeInView>
        ) : (
          <View style={{ gap: 10 }}>
            {proxyAccounts.map((account, index) => (
              <FadeInView delay={50}>
                <View style={cardStyle}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${colors.emerald}20`, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: colors.emerald, fontWeight: '800', fontSize: 18 }}>{account.username?.charAt(0) || '?'}</Text>
                    </View>
                    <View>
                      <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 15 }}>{account.username || 'Unknown'}</Text>
                      <Text style={{ color: colors.body, fontSize: 13, marginTop: 2 }}>{account.phone}</Text>
                    </View>
                  </View>
                </View>
              </FadeInView>
            ))}
          </View>
        )}

        {!showForm ? (
          <Pressable onPress={() => setShowForm(true)} style={{ backgroundColor: colors.heading, borderRadius: 16, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Plus color={colors.gold} size={18} />
            <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 15 }}>Add Proxy Account</Text>
          </Pressable>
        ) : (
          <FadeInView delay={100}>
            <View style={[cardStyle, { gap: 14 }]}>
              <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 16 }}>Add Proxy Account</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: colors.background, borderRadius: 14,
                borderWidth: focused ? 1.5 : 1, borderColor: focused ? colors.purple : colors.border,
                overflow: 'hidden',
              }}>
                <View style={{ paddingHorizontal: 14, paddingVertical: 14, borderRightWidth: 1, borderRightColor: colors.border }}>
                  <Text style={{ color: colors.body, fontWeight: '600' }}>+254</Text>
                </View>
                <TextInput value={phone} onChangeText={setPhone} placeholder="712345678" keyboardType="phone-pad" maxLength={9} placeholderTextColor={colors.muted} style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: colors.heading }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
              </View>
              <Pressable onPress={handleAddProxy} disabled={adding} style={{ backgroundColor: colors.heading, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: adding ? 0.7 : 1 }}>
                {adding ? <ActivityIndicator color={colors.gold} /> : <Text style={{ color: colors.gold, fontWeight: '700' }}>Add Account</Text>}
              </Pressable>
              <Pressable onPress={() => setShowForm(false)} style={{ alignItems: 'center' }}>
                <Text style={{ color: colors.body, fontSize: 14 }}>Cancel</Text>
              </Pressable>
            </View>
          </FadeInView>
        )}
      </ScrollView>
    </View>
  )
}