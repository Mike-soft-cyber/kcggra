import { View } from 'react-native';
import { colors } from '../themes/colors';

export const cardStyle = {
  backgroundColor: colors.surface,
  borderRadius: 24,
  padding: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 12,
  elevation: 2,
}

export default function Card({ children, style }) {
  return <View style={[cardStyle, style]}>{children}</View>
}