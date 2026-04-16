import { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { colors } from '../themes/colors';

function SkeletonItem({ width = '100%', height = 20, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: colors.border, opacity }, style]} />
  );
}

export function SkeletonCard() {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 20, elevation: 2, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <SkeletonItem width={40} height={40} borderRadius={12} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonItem width="60%" height={14} />
          <SkeletonItem width="40%" height={12} />
        </View>
      </View>
      <SkeletonItem height={12} style={{ marginBottom: 6 }} />
      <SkeletonItem width="80%" height={12} />
    </View>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </View>
  );
}

export function SkeletonMapBox() {
  return (
    <View style={{ height: 250, borderRadius: 18, backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
      <SkeletonItem width="100%" height={250} borderRadius={18} />
    </View>
  );
}