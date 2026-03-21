import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import OTPScreen from './src/screens/OTPScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import "./global.css"
import ProfileCompletionScreen from './src/screens/ProfileCompletionScreen';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import { navigationRef } from './src/navigation/navigationRef';
import IncidentScreen from './src/screens/IncidentsScreen';
import ReportIncidentScreen from './src/screens/ReportIncidentScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileSettingsScreen from './src/screens/ProfileSettingsScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import SecuritySettingsScreen from './src/screens/SecuritySettingsScreen';
import ActiveSessionsScreen from './src/screens/ActiveSessionsScreen';
import ProxyAccountsScreen from './src/screens/ProxyAccountsScreen';
import DangerZoneScreen from './src/screens/DangerZoneScreen';
import GuardDashboardScreen from './src/screens/GuardDashboardScreen';
import VisitorVerificationScreen from './src/screens/VisitorVerificationScreen';
import GuardIncidentsScreen from './src/screens/GuardIncidentsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [tokenExists, setTokenExists] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    handleToken()
  },[])

  const handleToken = async() => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if(token){
        setTokenExists(true)
      }else{
        setTokenExists(false)
      }
    } catch (error) {
      console.error("Failed to save token", error)
    }finally{
      setLoading(false)
    }
  }

  if(loading) return (
  <View className="flex-1 items-center justify-center">
    <ActivityIndicator size="large" color="#16a34a" />
  </View>
)
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName={tokenExists ? 'Dashboard' : 'Login'}>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="OTP" 
          component={OTPScreen}
          options={{ title: 'Verify OTP' }}
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
        name="ProfileCompletion"
        component={ProfileCompletionScreen}
        options={{ title: 'Complete your profile'}}
        />
        <Stack.Screen
        name="Incidents"
        component={IncidentScreen}
        options={{ headerShown: false}}
        />
        <Stack.Screen
        name="ReportIncident"
        component={ReportIncidentScreen}
        options={{ headerShown: false}}
        />
        <Stack.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{ headerShown: false}}
        />
        <Stack.Screen
        name="Community"
        component={CommunityScreen}
        options={{ headerShown: false}}
        />
        <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false}}
        />
        <Stack.Screen
        name="ProfileSettings"
        component={ProfileSettingsScreen}
        options={{ headerShown: false}}
        />
        <Stack.Screen 
      name="NotificationSettings" 
      component={NotificationSettingsScreen} 
      options={{ headerShown: false }}
      />
      <Stack.Screen name="SecuritySettings" 
      component={SecuritySettingsScreen} 
      options={{ headerShown: false }} 
      />
      <Stack.Screen 
      name="ActiveSessions" 
      component={ActiveSessionsScreen} 
      options={{ headerShown: false }} 
      />
      <Stack.Screen 
      name="ProxyAccounts" 
      component={ProxyAccountsScreen} 
      options={{ headerShown: false }} 
      />
      <Stack.Screen 
      name="DangerZone" 
      component={DangerZoneScreen} 
      options={{ headerShown: false }} 
      />
      <Stack.Screen name="GuardDashboard" component={GuardDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VisitorVerification" component={VisitorVerificationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GuardIncidents" component={GuardIncidentsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

