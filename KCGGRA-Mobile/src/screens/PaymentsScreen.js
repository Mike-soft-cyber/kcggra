import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, TextInput, Alert, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

const STATUS_STYLES = {
  verified:  { bg: '#dcfce7', text: '#166534', label: 'Verified'  },
  pending:   { bg: '#fef9c3', text: '#854d0e', label: 'Pending'   },
  failed:    { bg: '#fee2e2', text: '#991b1b', label: 'Failed'    },
  rejected:  { bg: '#fee2e2', text: '#991b1b', label: 'Rejected'  },
}

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function PaymentsScreen() {
  const navigation = useNavigation()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [showPayForm, setShowPayForm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('mpesa')

  // M-Pesa state
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')

  // Bank state
  const [bankAmount, setBankAmount] = useState('')
  const [bankReference, setBankReference] = useState('')
  const [bankSlip, setBankSlip] = useState(null)

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
    if (!phone || !amount) {
      Alert.alert('Missing fields', 'Please enter your phone number and amount')
      return
    }
    try {
      setPaying(true)
      const fullPhone = phone.startsWith('254') ? phone : `254${phone.replace(/^0/, '')}`
      await api.initiateMpesa(Number(amount), fullPhone, 'subscription')
      Alert.alert(
        '📱 STK Push Sent',
        'Check your phone for the M-Pesa prompt and enter your PIN.',
        [{ text: 'OK', onPress: () => {
          setShowPayForm(false)
          setPhone('')
          setAmount('')
          setTimeout(fetchPayments, 5000)
        }}]
      )
    } catch (error) {
      console.error('Payment error:', error.response?.data)
      Alert.alert('Payment Failed', error.message || 'Failed to initiate payment')
    } finally {
      setPaying(false)
    }
  }

  const handlePickSlip = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need access to your gallery to upload a bank slip')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })
    if (!result.canceled) {
      setBankSlip(result.assets[0].uri)
    }
  }

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera access to take a photo of the bank slip')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    })
    if (!result.canceled) {
      setBankSlip(result.assets[0].uri)
    }
  }

  const handleBankPayment = async () => {
    if (!bankAmount || !bankReference || !bankSlip) {
      Alert.alert('Missing fields', 'Please fill in all fields and upload a bank slip')
      return
    }
    try {
      setPaying(true)
      const formData = new FormData()
      formData.append('amount', bankAmount)
      formData.append('bank_reference', bankReference)
      formData.append('bank_slip', {
        uri: bankSlip,
        type: 'image/jpeg',
        name: 'bank_slip.jpg',
      })
      await api.createBankPayment(formData)
      Alert.alert(
        '✅ Submitted',
        'Your bank payment has been submitted for verification.',
        [{ text: 'OK', onPress: () => {
          setShowPayForm(false)
          setBankAmount('')
          setBankReference('')
          setBankSlip(null)
          fetchPayments()
        }}]
      )
    } catch (error) {
      Alert.alert('Failed', error.message || 'Failed to submit bank payment')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ backgroundColor: '#16a34a' }} className="px-6 pt-14 pb-6">
        <Text className="text-white text-2xl font-bold">Payments</Text>
        <Text className="text-green-200 text-sm mt-1">Manage your subscription & contributions</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>

        {/* Subscription Card */}
        <View className="bg-white rounded-2xl p-5"
          style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold text-gray-900">Monthly Subscription</Text>
            <View className="bg-red-50 rounded-full px-3 py-1">
              <Text className="text-red-600 text-xs font-semibold">Unpaid</Text>
            </View>
          </View>

          <View className="flex-row items-baseline gap-1 mb-4">
            <Text className="text-3xl font-bold text-gray-900">KES 500</Text>
            <Text className="text-gray-400 text-sm">/month</Text>
          </View>

          {!showPayForm ? (
            <Pressable
              onPress={() => setShowPayForm(true)}
              className="bg-green-600 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-bold">Make Payment</Text>
            </Pressable>
          ) : (
            <View className="gap-4">

              {/* Payment Method Toggle */}
              <View className="flex-row bg-gray-100 rounded-xl p-1">
                <Pressable
                  onPress={() => setPaymentMethod('mpesa')}
                  className="flex-1 py-2.5 rounded-lg items-center"
                  style={{ backgroundColor: paymentMethod === 'mpesa' ? '#fff' : 'transparent' }}
                >
                  <Text style={{ color: paymentMethod === 'mpesa' ? '#16a34a' : '#6b7280' }}
                    className="text-sm font-semibold">
                    📱 M-Pesa
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setPaymentMethod('bank')}
                  className="flex-1 py-2.5 rounded-lg items-center"
                  style={{ backgroundColor: paymentMethod === 'bank' ? '#fff' : 'transparent' }}
                >
                  <Text style={{ color: paymentMethod === 'bank' ? '#16a34a' : '#6b7280' }}
                    className="text-sm font-semibold">
                    🏦 Bank Transfer
                  </Text>
                </Pressable>
              </View>

              {/* M-Pesa Form */}
              {paymentMethod === 'mpesa' && (
                <View className="gap-3">
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="Amount (KES)"
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                    style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
                  />
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4"
                    style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
                    <Text className="text-gray-500 text-sm">+254</Text>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="712345678"
                      keyboardType="phone-pad"
                      maxLength={9}
                      placeholderTextColor="#9ca3af"
                      className="flex-1 py-3 px-2 text-gray-900"
                    />
                  </View>
                  <Pressable
                    onPress={handleInitiateMpesa}
                    disabled={paying}
                    className="bg-green-600 rounded-xl py-3 items-center"
                    style={{ opacity: paying ? 0.7 : 1 }}
                  >
                    {paying ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator color="#fff" size="small" />
                        <Text className="text-white font-bold ml-2">Sending STK Push...</Text>
                      </View>
                    ) : (
                      <Text className="text-white font-bold">Send Prompt</Text>
                    )}
                  </Pressable>
                </View>
              )}

              {/* Bank Form */}
              {paymentMethod === 'bank' && (
                <View className="gap-3">
                  <TextInput
                    value={bankAmount}
                    onChangeText={setBankAmount}
                    placeholder="Amount (KES)"
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                    style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
                  />
                  <TextInput
                    value={bankReference}
                    onChangeText={setBankReference}
                    placeholder="Transaction reference number"
                    placeholderTextColor="#9ca3af"
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                    style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
                  />

                  {/* Bank Slip Upload */}
                  <Text className="text-sm font-semibold text-gray-700">Bank Slip Photo</Text>

                  {bankSlip ? (
                    <View>
                      <Image
                        source={{ uri: bankSlip }}
                        className="w-full h-40 rounded-xl"
                        resizeMode="cover"
                      />
                      <Pressable
                        onPress={() => setBankSlip(null)}
                        className="mt-2 items-center"
                      >
                        <Text className="text-red-400 text-sm">Remove photo</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={handlePickSlip}
                        className="flex-1 bg-gray-50 rounded-xl py-3 items-center"
                        style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
                      >
                        <Text className="text-gray-600 text-sm font-medium">📁 Gallery</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleTakePhoto}
                        className="flex-1 bg-gray-50 rounded-xl py-3 items-center"
                        style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
                      >
                        <Text className="text-gray-600 text-sm font-medium">📷 Camera</Text>
                      </Pressable>
                    </View>
                  )}

                  <Pressable
                    onPress={handleBankPayment}
                    disabled={paying}
                    className="bg-green-600 rounded-xl py-3 items-center"
                    style={{ opacity: paying ? 0.7 : 1 }}
                  >
                    {paying ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator color="#fff" size="small" />
                        <Text className="text-white font-bold ml-2">Submitting...</Text>
                      </View>
                    ) : (
                      <Text className="text-white font-bold">Submit Bank Payment</Text>
                    )}
                  </Pressable>
                </View>
              )}

              <Pressable
                onPress={() => setShowPayForm(false)}
                className="items-center py-2"
              >
                <Text className="text-gray-400 text-sm">Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Payment History */}
        <View>
          <Text className="text-lg font-bold text-gray-900 mb-3">Payment History</Text>
          {payments.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center"
              style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
              <Text className="text-gray-400 text-base">No payments yet</Text>
              <Text className="text-gray-300 text-sm mt-1">Your payment history will appear here</Text>
            </View>
          ) : (
            <View className="gap-3">
              {payments.map((item) => {
                const status = STATUS_STYLES[item.status] || STATUS_STYLES.pending
                return (
                  <View key={item._id} className="bg-white rounded-2xl p-4"
                    style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-base font-bold text-gray-900">
                        KES {item.amount?.toLocaleString()}
                      </Text>
                      <View style={{ backgroundColor: status.bg }} className="rounded-full px-3 py-0.5">
                        <Text style={{ color: status.text }} className="text-xs font-semibold">
                          {status.label}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-500 text-xs capitalize">{item.type?.replace('_', ' ')}</Text>
                      <Text className="text-gray-400 text-xs">{timeAgo(item.createdAt)}</Text>
                    </View>
                    <Text className="text-gray-400 text-xs mt-1 capitalize">via {item.payment_method}</Text>
                  </View>
                )
              })}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  )
}