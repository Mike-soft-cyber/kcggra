import { View } from 'react-native';

export default function IconBox({ icon, color, size = 40 }) {
  return (
    <View style={{
      width: size, height: size,
      borderRadius: 12,
      backgroundColor: `${color}25`,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {icon}
    </View>
  )
}