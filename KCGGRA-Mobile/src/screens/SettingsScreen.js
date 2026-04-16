import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { User, Bell, Lock, Users, AlertOctagon, ChevronRight, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../themes/colors';

const SECTIONS = [
  {
    title: 'Account',
    items: [
      { label: 'Profile Information', desc: 'Name, email, street address', icon: User, color: colors.purple, route: 'ProfileSettings' },
      { label: 'Security', desc: 'Password & two-factor auth', icon: Lock, color: colors.emerald, route: 'SecuritySettings' },
      { label: 'Proxy Accounts', desc: 'Manage linked accounts', icon: Users, color: '#4A7C6F', route: 'ProxyAccounts' },
    ]
  },
  {
    title: 'Preferences',
    items: [
      { label: 'Notifications', desc: 'Manage your alerts', icon: Bell, color: '#E97C3A', route: 'NotificationSettings' },
    ]
  },
  {
    title: 'Danger Zone',
    items: [
      { label: 'Danger Zone', desc: 'Delete account & data', icon: AlertOctagon, color: colors.rose, route: 'DangerZone' },
    ]
  },
];

function SettingItem({ item, index, isLast }) {
  const navigation = useNavigation();
  const Icon = item.icon;
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate(item.route);
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: pressed ? colors.background : colors.surface,
        borderTopWidth: index === 0 ? 0 : 0.5,
        borderTopColor: colors.border,
      })}
    >
      {/* Icon box */}
      <View style={{
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: `${item.color}20`,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
        flexShrink: 0,
      }}>
        <Icon color={item.color} size={20} />
      </View>

      {/* Text — flex:1 pushes chevron to the right */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.heading, fontWeight: '600', fontSize: 15 }}>{item.label}</Text>
        <Text style={{ color: colors.body, fontSize: 12, marginTop: 2 }}>{item.desc}</Text>
      </View>

      <ChevronRight color={colors.muted} size={18} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.heading, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}>
        <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Settings</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Manage your account & preferences</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: insets.bottom + 24 }}>
        {SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={{
              fontSize: 11, fontWeight: '700', color: colors.muted,
              textTransform: 'uppercase', letterSpacing: 1.5,
              marginBottom: 8, paddingLeft: 4,
            }}>
              {section.title}
            </Text>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              {section.items.map((item, index) => (
                <SettingItem
                  key={item.route}
                  item={item}
                  index={index}
                  isLast={index === section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            backgroundColor: pressed ? `${colors.rose}10` : colors.surface,
            borderRadius: 20,
            paddingVertical: 18,
            borderWidth: 1.5,
            borderColor: `${colors.rose}30`,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 1,
          })}
        >
          <LogOut color={colors.rose} size={20} />
          <Text style={{ color: colors.rose, fontWeight: '700', fontSize: 15 }}>Sign Out</Text>
        </Pressable>

        <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 12 }}>
          KCGGRA Community Portal v1.0
        </Text>
      </ScrollView>
    </View>
  );
}