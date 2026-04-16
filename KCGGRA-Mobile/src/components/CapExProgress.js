import { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import api from '../services/api';
import { colors } from '../themes/colors';
import { cardStyle } from './Card';
import IconBox from './IconBox';
import { SkeletonList } from './SkeletonLoader';

function ProgressBar({ progress, color }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: progress, duration: 800,
      useNativeDriver: false, // width can't use native driver
    }).start();
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 999, overflow: 'hidden' }}>
      <Animated.View style={[{ height: 6, borderRadius: 999, backgroundColor: color }, animStyle]} />
    </View>
  );
}

export default function CapexProgress() {
  const [capex, setCapex] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await api.getProjects()
      setCapex(Array.isArray(res) ? res : res.projects || [])
    } catch (error) {
      console.error('Failed to get Capex Progress:', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={cardStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.heading, letterSpacing: -0.3 }}>CapEx Projects</Text>
        <Text style={{ fontSize: 12, color: colors.muted }}>{capex.length} projects</Text>
      </View>

      {loading ? <SkeletonList count={2} /> : capex.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <IconBox icon={<TrendingUp color={colors.muted} size={24} />} color={colors.muted} size={52} />
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 12 }}>No projects yet</Text>
        </View>
      ) : (
        <Animated.View layout={LinearTransition.springify().damping(15)} style={{ gap: 16 }}>
          {capex.map((item, index) => {
            const progress = Math.min(Math.round((item.currentAmount / item.targetAmount) * 100), 100);
            const isCompleted = item.status === 'completed';
            const barColor = isCompleted ? colors.emerald : colors.purple;

            return (
              <Animated.View
                key={item._id}
                entering={FadeInDown.delay(index * 50).duration(400)}
              >
                <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 999, overflow: 'hidden' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ color: colors.heading, fontWeight: '700', fontSize: 14, flex: 1 }} numberOfLines={1}>{item.projectName}</Text>
                    <View style={{ backgroundColor: isCompleted ? `${colors.emerald}20` : `${colors.purple}20`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ color: isCompleted ? colors.emerald : colors.purple, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>{item.status}</Text>
                    </View>
                  </View>
                  <Animated.View style={{
        height: 6, borderRadius: 999,
        backgroundColor: color,
        width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
      }} />
                  <ProgressBar progress={progress} color={barColor} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: colors.body }}>KES {item.currentAmount?.toLocaleString() ?? 0}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: barColor }}>{progress}%</Text>
                    <Text style={{ fontSize: 12, color: colors.body }}>of {item.targetAmount?.toLocaleString()}</Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>
      )}
    </View>
  )
}