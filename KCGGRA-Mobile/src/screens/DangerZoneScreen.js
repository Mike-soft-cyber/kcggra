import { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, AlertOctagon, UserX, Trash2 } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from '../components/Card';
import IconBox from '../components/IconBox';
import FadeInView from '../components/FadeInView';
import { toast } from '../utils/toast';

export default function DangerZoneScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)

  const handleDeleteAccount = () => {
    Alert.alert('⚠️ Delete Account', 'This is permanent and cannot be undone. All your data will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Account', style: 'destructive', onPress: async () => {
        try {
          setLoading(true)
          await api.deleteAccount()
          await SecureStore.deleteItemAsync('token')
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
        } catch (error) {
          toast.error('Failed', error.message || 'Failed to delete account')
        } finally {
          setLoading(false)
        }
      }}
    ])
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.rose, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ArrowLeft color="rgba(255,255,255,0.7)" size={20} />
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Back</Text>
        </Pressable>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Danger Zone</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>Irreversible account actions</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}>
        {/* Warning */}
        <FadeInView delay={0}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: `${colors.rose}10`, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${colors.rose}30` }}>
            <AlertOctagon color={colors.rose} size={20} />
            <Text style={{ color: colors.rose, fontSize: 13, flex: 1, lineHeight: 20 }}>Actions in this section are permanent and cannot be undone. Please proceed with extreme caution.</Text>
          </View>
        </FadeInView>

        {/* Deactivate */}
        <FadeInView delay={50}>
          <View style={cardStyle}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <IconBox icon={<UserX color="#E97C3A" size={18} />} color="#E97C3A" />
              <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 16 }}>Deactivate Account</Text>
            </View>
            <Text style={{ color: colors.body, fontSize: 13, lineHeight: 20, marginBottom: 14 }}>Temporarily disable your account. You can reactivate by contacting admin.</Text>
            <Pressable
              onPress={() => Alert.alert('Contact Admin', 'Please contact your admin to deactivate your account.')}
              style={{ borderWidth: 1.5, borderColor: '#E97C3A', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#E97C3A', fontWeight: '700', fontSize: 15 }}>Deactivate Account</Text>
            </Pressable>
          </View>
        </FadeInView>

        {/* Delete */}
        <FadeInView delay={100}>
          <View style={[cardStyle, { borderWidth: 1, borderColor: `${colors.rose}30` }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <IconBox icon={<Trash2 color={colors.rose} size={18} />} color={colors.rose} />
              <Text style={{ color: colors.rose, fontWeight: '700', fontSize: 16 }}>Delete Account</Text>
            </View>
            <Text style={{ color: colors.body, fontSize: 13, lineHeight: 20, marginBottom: 14 }}>Permanently delete your account and all associated data. This cannot be undone.</Text>
            <Pressable
              onPress={handleDeleteAccount}
              disabled={loading}
              style={{ backgroundColor: colors.rose, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Delete My Account</Text>}
            </Pressable>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  )
}