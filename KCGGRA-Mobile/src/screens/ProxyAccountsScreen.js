import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

export default function ProxyAccountsScreen() {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [proxyAccounts, setProxyAccounts] = useState([])
  const [phone, setPhone] = useState('')

  useEffect(() => { fetchProxies() }, [])

  const fetchProxies = async () => {
    try {
      setLoading(true)
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
    if (!phone || phone.length < 9) {
      Alert.alert('Invalid phone', 'Please enter a valid phone number')
      return
    }
    try {
      setAdding(true)
      const fullPhone = phone.startsWith('254') ? phone : `254${phone.replace(/^0/, '')}`
      await api.addProxyAccount({ phone: fullPhone })
      Alert.alert('✅ Added', 'Proxy account added successfully!')
      setPhone('')
      setShowForm(false)
      fetchProxies()
    } catch (error) {
      Alert.alert('Failed', error.message || 'Failed to add proxy account')
    } finally {
      setAdding(false)
    }
  }

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ backgroundColor: '#16a34a' }} className="px-6 pt-14 pb-6">
        <Pressable onPress={() => navigation.goBack()} className="mb-4">
          <Text className="text-green-200 font-medium">← Back</Text>
        </Pressable>
        <Text className="text-white text-2xl font-bold">Proxy Accounts</Text>
        <Text className="text-green-200 text-sm mt-1">Manage accounts that can act on your behalf</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {proxyAccounts.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center"
            style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
            <Text className="text-gray-400 text-base">No proxy accounts yet</Text>
            <Text className="text-gray-300 text-sm mt-1">Add a trusted person to act on your behalf</Text>
          </View>
        ) : (
          <View className="gap-3">
            {proxyAccounts.map((account, index) => (
              <View key={index} className="bg-white rounded-2xl p-4 flex-row items-center"
                style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Text className="text-green-700 font-bold">
                    {account.username?.charAt(0) || '?'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium text-sm">{account.username || 'Unknown'}</Text>
                  <Text className="text-gray-400 text-xs">{account.phone}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {!showForm ? (
          <Pressable
            onPress={() => setShowForm(true)}
            className="bg-green-600 rounded-2xl py-4 items-center"
          >
            <Text className="text-white font-bold">+ Add Proxy Account</Text>
          </Pressable>
        ) : (
          <View className="bg-white rounded-2xl p-5 gap-4"
            style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
            <Text className="text-base font-bold text-gray-900">Add Proxy Account</Text>
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
              onPress={handleAddProxy}
              disabled={adding}
              className="bg-green-600 rounded-2xl py-3 items-center"
              style={{ opacity: adding ? 0.7 : 1 }}
            >
              {adding ? <ActivityIndicator color="#fff" /> : (
                <Text className="text-white font-bold">Add Account</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setShowForm(false)} className="items-center">
              <Text className="text-gray-400 text-sm">Cancel</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  )
}