import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export default function OTPScreen({ navigation, route }) {
  const { phone } = route.params; // Get phone from previous screen
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await api.verifyOTP(phone, otp);
      console.log(response)
      await SecureStore.setItemAsync('token', response.token);
      
      // Check if new user (needs profile completion)
      if (response.user.username.startsWith('User_')) { // ✅ Changed from response.data.user
  navigation.navigate('ProfileCompletion'); // Temporary
} else {
  
  // Check role and navigate accordingly
  if (response.user.role === 'admin') { // ✅ Changed from response.data.user
    navigation.navigate('Dashboard');
  } else if (response.user.role === 'guard') { // ✅ Changed from response.data.user
    navigation.navigate('GuardDashboard');
  } else {
    navigation.navigate('Dashboard');
  }
}
      
    } catch (error) {
      console.error(error)
      Alert.alert('Error', error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 p-5 justify-center bg-white">
      <Text className="text-2xl font-bold mb-2 text-center text-gray-900">
        Verify OTP
      </Text>
      
      <Text className="text-sm text-gray-600 text-center mb-8">
        Enter the 6-digit code sent to {phone}
      </Text>

      {/* OTP Input */}
      <TextInput
        className="border border-gray-300 rounded-lg px-4 h-12 text-base text-center mb-5"
        placeholder="000000"
        value={otp}
        onChangeText={setOTP}
        keyboardType="number-pad"
        maxLength={6}
        editable={!loading}
      />

      {/* Verify Button */}
      <Pressable 
        className={`p-4 rounded-lg items-center ${loading ? 'bg-green-400' : 'bg-green-600'}`}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-base font-bold">Verify OTP</Text>
        )}
      </Pressable>

      {/* Back Button */}
      <Pressable 
        className="mt-4 p-2"
        onPress={() => navigation.goBack()}
      >
        <Text className="text-green-600 text-center">← Back to Login</Text>
      </Pressable>
    </View>
  );
}