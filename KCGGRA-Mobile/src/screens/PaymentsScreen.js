import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, Image, Animated } from 'react-native';
import FadeInView from '../components/FadeInView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Wallet, CreditCard, Building2, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from '../components/Card';
import IconBox from '../components/IconBox';
import { SkeletonList } from '../components/SkeletonLoader';
import { toast } from '../utils/toast';

const STATUS_CONFIG = {
  verified:  { bg: `${colors.emerald}20`, text: colors.emerald, label: 'Verified', icon: CheckCircle },
  pending:   { bg: `${colors.purple}20`, text: colors.purple, label: 'Pending', icon: Clock },
  failed:    { bg: `${colors.rose}20`, text: colors.rose, label: 'Failed', icon: XCircle },
  rejected:  { bg: `${colors.rose}20`, text: colors.rose, label: 'Rejected', icon: XCircle },
}

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [showPayForm, setShowPayForm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [bankAmount, setBankAmount] = useState('')
  const [bankReference, setBankReference] = useState('')
  const [bankSlip, setBankSlip] = useState(null)
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [amountFocused, setAmountFocused] = useState(false)

  useEffect(() => { fetchPayments() }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const res = await api.getMyPayments()
      setPayments(res.payments || res || [])
    } catch (error) {
      console.error('Failed to fetch payments:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInitiateMpesa = async () => {
    if (!phone || !amount) { Alert.alert('Missing fields', 'Please enter phone and amount'); return; }
    try {
      setPaying(true)
      const fullPhone = phone.startsWith('254') ? phone : `254${phone.replace(/^0/, '')}`
      await api.initiateMpesa(Number(amount), fullPhone, 'subscription')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      toast.success('Prompt Sent', 'Check your phone for the M-Pesa prompt.')
      setShowPayForm(false)
      setPhone('')
      setAmount('')
      setTimeout(fetchPayments, 5000)
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      toast.error('Payment Failed', error.message || 'Failed to initiate payment')
    } finally {
      setPaying(false)
    }
  }

  const handlePickSlip = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission denied', 'Gallery access needed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 })
    if (!result.canceled) setBankSlip(result.assets[0].uri)
  }

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission denied', 'Camera access needed'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 })
    if (!result.canceled) setBankSlip(result.assets[0].uri)
  }

  const handleBankPayment = async () => {
    if (!bankAmount || !bankReference || !bankSlip) { Alert.alert('Missing fields', 'Fill all fields and upload bank slip'); return; }
    try {
      setPaying(true)
      const formData = new FormData()
      formData.append('amount', bankAmount)
      formData.append('bank_reference', bankReference)
      formData.append('bank_slip', { uri: bankSlip, type: 'image/jpeg', name: 'bank_slip.jpg' })
      await api.createBankPayment(formData)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      toast.success('Submitted', 'Your bank payment has been submitted for verification.')
      setShowPayForm(false)
      setBankAmount('')
      setBankReference('')
      setBankSlip(null)
      fetchPayments()
    } catch (error) {
      toast.error('Failed', error.message || 'Failed to submit')
    } finally {
      setPaying(false)
    }
  }

  const inputStyle = (focused) => ({
    backgroundColor: colors.background, borderRadius: 14,
    borderWidth: focused ? 1.5 : 1,
    borderColor: focused ? colors.purple : colors.border,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: colors.heading,
  })

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.heading, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}>
        <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Payments</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Manage your subscription & contributions</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>

        {/* Subscription Card */}
        <FadeInView delay={50}>
          <View style={cardStyle}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <IconBox icon={<Wallet color={colors.purple} size={20} />} color={colors.purple} />
                <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 16 }}>Monthly Subscription</Text>
              </View>
              <View style={{ backgroundColor: `${colors.rose}20`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: colors.rose, fontSize: 12, fontWeight: '700' }}>Unpaid</Text>
              </View>
            </View>

            <Text style={{ fontSize: 32, fontWeight: '800', color: colors.heading, letterSpacing: -0.3 }}>
              KES 500<Text style={{ fontSize: 15, fontWeight: '400', color: colors.body }}>/month</Text>
            </Text>

            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPayForm(!showPayForm); }}
              style={{ marginTop: 16, backgroundColor: colors.heading, borderRadius: 16, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 15 }}>{showPayForm ? 'Cancel' : 'Make Payment'}</Text>
              {showPayForm ? <ChevronUp color={colors.gold} size={18} /> : <ChevronDown color={colors.gold} size={18} />}
            </Pressable>

            {showPayForm && (
              <FadeInView delay={0}>
                <View style={{ marginTop: 16, gap: 10 }}>
                  {/* Method Toggle */}
                  <View style={{ flexDirection: 'row', backgroundColor: colors.background, borderRadius: 14, padding: 4 }}>
                    {[
                      { key: 'mpesa', label: 'M-Pesa', icon: CreditCard },
                      { key: 'bank', label: 'Bank Transfer', icon: Building2 },
                    ].map((m) => {
                      const Icon = m.icon;
                      const active = paymentMethod === m.key;
                      return (
                        <Pressable
                          key={m.key}
                          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPaymentMethod(m.key); }}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: active ? colors.surface : 'transparent' }}
                        >
                          <Icon color={active ? colors.purple : colors.muted} size={16} />
                          <Text style={{ color: active ? colors.purple : colors.muted, fontSize: 13, fontWeight: '600' }}>{m.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {paymentMethod === 'mpesa' ? (
                    <View style={{ gap: 10 }}>
                      <TextInput value={amount} onChangeText={setAmount} placeholder="Amount (KES)" keyboardType="numeric" placeholderTextColor={colors.muted} style={inputStyle(amountFocused)} onFocus={() => setAmountFocused(true)} onBlur={() => setAmountFocused(false)} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 14, borderWidth: phoneFocused ? 1.5 : 1, borderColor: phoneFocused ? colors.purple : colors.border, overflow: 'hidden' }}>
                        <View style={{ paddingHorizontal: 14, paddingVertical: 14, borderRightWidth: 1, borderRightColor: colors.border }}>
                          <Text style={{ color: colors.body, fontWeight: '600' }}>+254</Text>
                        </View>
                        <TextInput value={phone} onChangeText={setPhone} placeholder="712345678" keyboardType="phone-pad" maxLength={9} placeholderTextColor={colors.muted} style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: colors.heading }} onFocus={() => setPhoneFocused(true)} onBlur={() => setPhoneFocused(false)} />
                      </View>
                      <Pressable onPress={handleInitiateMpesa} disabled={paying} style={{ backgroundColor: colors.purple, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: paying ? 0.7 : 1 }}>
                        {paying ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Send M-Pesa Request</Text>}
                      </Pressable>
                    </View>
                  ) : (
                    <View style={{ gap: 10 }}>
                      <TextInput value={bankAmount} onChangeText={setBankAmount} placeholder="Amount (KES)" keyboardType="numeric" placeholderTextColor={colors.muted} style={inputStyle(false)} />
                      <TextInput value={bankReference} onChangeText={setBankReference} placeholder="Transaction reference" placeholderTextColor={colors.muted} style={inputStyle(false)} />
                      {bankSlip ? (
                        <View>
                          <Image source={{ uri: bankSlip }} style={{ width: '100%', height: 160, borderRadius: 14 }} resizeMode="cover" />
                          <Pressable onPress={() => setBankSlip(null)} style={{ marginTop: 8, alignItems: 'center' }}>
                            <Text style={{ color: colors.rose, fontSize: 13 }}>Remove photo</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <Pressable onPress={handlePickSlip} style={{ flex: 1, backgroundColor: colors.background, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                            <Text style={{ color: colors.body, fontSize: 13, fontWeight: '600' }}>📁 Gallery</Text>
                          </Pressable>
                          <Pressable onPress={handleTakePhoto} style={{ flex: 1, backgroundColor: colors.background, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                            <Text style={{ color: colors.body, fontSize: 13, fontWeight: '600' }}>📷 Camera</Text>
                          </Pressable>
                        </View>
                      )}
                      <Pressable onPress={handleBankPayment} disabled={paying} style={{ backgroundColor: colors.heading, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: paying ? 0.7 : 1 }}>
                        {paying ? <ActivityIndicator color={colors.gold} /> : <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 15 }}>Submit Bank Payment</Text>}
                      </Pressable>
                    </View>
                  )}
                </View>
              </FadeInView>
            )}
          </View>
        </FadeInView>

        {/* Payment History */}
        <FadeInView delay={100}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.heading, letterSpacing: -0.3, marginBottom: 12 }}>Payment History</Text>
          {loading ? <SkeletonList count={3} /> : payments.length === 0 ? (
            <View style={[cardStyle, { alignItems: 'center', paddingVertical: 40 }]}>
              <IconBox icon={<Wallet color={colors.muted} size={24} />} color={colors.muted} size={52} />
              <Text style={{ color: colors.muted, fontSize: 15, marginTop: 12 }}>No payments yet</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {payments.map((item, idx) => {
                const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                const StatusIcon = status.icon;
                return (
                  <View key={item._id} style={cardStyle}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.heading }}>KES {item.amount?.toLocaleString()}</Text>
                        <Text style={{ color: colors.body, fontSize: 13, marginTop: 2, textTransform: 'capitalize' }}>{item.payment_type?.replace('_', ' ')} · via {item.payment_method}</Text>
                        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{timeAgo(item.createdAt)}</Text>
                      </View>
                      <View style={{ backgroundColor: status.bg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', gap: 4 }}>
                        <StatusIcon color={status.text} size={16} />
                        <Text style={{ color: status.text, fontSize: 11, fontWeight: '700' }}>{status.label}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </FadeInView>
      </ScrollView>
    </View>
  )
}