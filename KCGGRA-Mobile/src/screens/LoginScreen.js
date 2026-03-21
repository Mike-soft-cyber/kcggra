import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';

export default function LoginScreen({ navigation }) {
  const [phoneDigits, setPhoneDigits] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    // Validate phone number
    if (phoneDigits.length !== 9) {
      Alert.alert('Error', 'Please enter 9 digits');
      return;
    }

    const fullPhone = `254${phoneDigits}`;
    setLoading(true);

    try {
      const response = await api.requestOTP(fullPhone);
      Alert.alert('Success', response.message);
      
      // Navigate to OTP screen
      navigation.navigate('OTP', { phone: fullPhone });
      
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 p-5 justify-center bg-white">
      {/* Title */}
      <Text className="text-3xl font-bold mb-10 text-center text-gray-900">
        KCGGRA Login
      </Text>
      
      {/* Phone Input */}
      <View className="flex-row items-center border border-gray-300 rounded-lg mb-5 px-3">
        <Text className="text-base mr-2 text-gray-600">+254</Text>
        <TextInput
          className="flex-1 h-12 text-base"
          placeholder="712345678"
          value={phoneDigits}
          onChangeText={setPhoneDigits}
          keyboardType="phone-pad"
          maxLength={9}
          editable={!loading}
        />
      </View>

      {/* Send OTP Button */}
      <Pressable 
        className={`p-4 rounded-lg items-center ${loading ? 'bg-green-400' : 'bg-green-600'}`}
        onPress={handleSendOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-base font-bold">Send OTP</Text>
        )}
      </Pressable>
    </View>
  );
}