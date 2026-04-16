import { View, Text, ScrollView, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FadeInView from '../components/FadeInView';
import EmergencyButton from '../components/EmergencyButton';
import CommunityUpdates from '../components/CommunityUpdates';
import CapexProgress from '../components/CapExProgress';
import GuardPatrolMap from '../components/GuardPatrolMap';
import { colors } from '../themes/colors';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.heading} />

      {/* Header */}
      <View style={{ backgroundColor: colors.heading, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: colors.gold, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>KCGGRA</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Community Portal</Text>
          </View>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.gold}20`, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20 }}>🛡️</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView delay={50}>
          <EmergencyButton />
        </FadeInView>

        <FadeInView delay={50}>
          <CommunityUpdates />
        </FadeInView>

        <FadeInView delay={50}>
          <CapexProgress />
        </FadeInView>

        <FadeInView delay={50}>
          <GuardPatrolMap />
        </FadeInView>
      </ScrollView>
    </View>
  );
}