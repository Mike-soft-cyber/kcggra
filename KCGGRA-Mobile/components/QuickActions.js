import { useNavigation } from '@react-navigation/native';
import { Pressable, View, Text } from 'react-native'

const QUICK_ACTIONS = [
  { label: 'Incidents', icon: '🚨', route: 'Incidents' },
  { label: 'Payments',  icon: '💳', route: 'Payments'  },
  { label: 'Community', icon: '👥', route: 'Community' },
  { label: 'Settings',  icon: '⚙️', route: 'Settings'  },
]

export default function QuickActions() {
  const navigation = useNavigation();
  
  return(
    <View className="px-4 py-2">
      <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>
      <View className="flex-row justify-between">
        {QUICK_ACTIONS.map((q) => (
          <Pressable
            key={q.route}
            onPress={() => navigation.navigate(q.route)}
            className="flex-1 mx-1 bg-white rounded-2xl py-4 items-center"
            style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
          >
            <Text style={{ fontSize: 24 }}>{q.icon}</Text>
            <Text 
            className="text-xs text-gray-600 font-medium mt-2"
            numberOfLines={1}
            adjustsFontSizeToFit
            >
              {q.label}
              </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}