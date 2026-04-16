import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function FadeInView({ children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 400, delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 400, delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}