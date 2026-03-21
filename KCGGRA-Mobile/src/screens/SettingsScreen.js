import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      { label: 'Profile Information', icon: '👤', route: 'ProfileSettings', desc: 'Update your name, email, street' },
      { label: 'Security', icon: '🔒', route: 'SecuritySettings', desc: 'Password & two-factor auth' },
      { label: 'Proxy Accounts', icon: '👥', route: 'ProxyAccounts', desc: 'Manage linked accounts' },
    ]
  },
  {
    title: 'Preferences',
    items: [
      { label: 'Notifications', icon: '🔔', route: 'NotificationSettings', desc: 'Manage your alerts' },
    ]
  },
  {
    title: 'Other',
    items: [
      { label: 'Danger Zone', icon: '⚠️', route: 'DangerZone', desc: 'Delete account & data' },
    ]
  },
]

export default function SettingsScreen() {
  const navigation = useNavigation()

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token')
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ backgroundColor: '#16a34a' }} className="px-6 pt-14 pb-6">
        <Text className="text-white text-2xl font-bold">Settings</Text>
        <Text className="text-green-200 text-sm mt-1">Manage your account & preferences</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
        {SETTINGS_SECTIONS.map((section) => (
          <View key={section.title}>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
              {section.title}
            </Text>
            <View className="bg-white rounded-2xl overflow-hidden"
              style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}>
              {section.items.map((item, index) => (
                <Pressable
                  key={item.route}
                  onPress={() => navigation.navigate(item.route)}
                  className="flex-row items-center px-4 py-4 active:bg-gray-50"
                  style={{
                    borderTopWidth: index === 0 ? 0 : 0.5,
                    borderTopColor: '#f3f4f6'
                  }}
                >
                  <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center mr-3">
                    <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium text-sm">{item.label}</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">{item.desc}</Text>
                  </View>
                  <Text className="text-gray-300 text-lg">›</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          className="bg-white rounded-2xl py-4 items-center"
          style={{ borderWidth: 0.5, borderColor: '#fecaca' }}
        >
          <Text className="text-red-500 font-semibold">Sign Out</Text>
        </Pressable>

        <Text className="text-center text-gray-300 text-xs pb-4">
          KCGGRA Community Portal v1.0
        </Text>
      </ScrollView>
    </View>
  )
}