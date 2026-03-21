import { ScrollView, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import EmergencyButton from '../../components/EmergencyButton';
import CommunityUpdates from '../../components/CommunityUpdates';
import QuickActions from '../../components/QuickActions';
import CapexProgress from '../../components/CapExProgress';
import GuardPatrolMap from '../../components/GuardPatrolMap';

export default function DashboardScreen() {

  const handleLogout = async() => {
    try {
      await SecureStore.deleteItemAsync('token')
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    } catch (error) {
      console.error('Failed to remove token!')
    }
  }
  return (
    <ScrollView className="flex-1 bg-white">
      <EmergencyButton />
      <CommunityUpdates />
      <QuickActions />
      <CapexProgress />
      <GuardPatrolMap />
    </ScrollView>
  );
}