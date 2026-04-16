import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import { navigationRef } from './src/navigation/navigationRef';
import { colors } from './src/themes/colors';
import Toast from 'react-native-toast-message';

// Auth Screens
import LoginScreen from './src/screens/LoginScreen';
import OTPScreen from './src/screens/OTPScreen';
import ProfileCompletionScreen from './src/screens/ProfileCompletionScreen';

// Resident Screens
import DashboardScreen from './src/screens/DashboardScreen';
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

// Guard Screens
import GuardDashboardScreen from './src/screens/GuardDashboardScreen';
import VisitorVerificationScreen from './src/screens/VisitorVerificationScreen';
import GuardIncidentsScreen from './src/screens/GuardIncidentsScreen';

import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Resident Tab Navigator ──
function ResidentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.heading,
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Incidents"
        component={IncidentScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🚨</Text>,
          tabBarLabel: 'Incidents',
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💳</Text>,
          tabBarLabel: 'Payments',
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👥</Text>,
          tabBarLabel: 'Community',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  )
}

// ── Guard Tab Navigator ──
function GuardTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.heading,
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="GuardHome"
        component={GuardDashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🛡️</Text>,
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="GuardIncidents"
        component={GuardIncidentsScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🚨</Text>,
          tabBarLabel: 'Incidents',
        }}
      />
      <Tab.Screen
        name="VisitorVerification"
        component={VisitorVerificationScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔍</Text>,
          tabBarLabel: 'Visitors',
        }}
      />
      <Tab.Screen
        name="GuardSettings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  const [tokenExists, setTokenExists] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    handleToken()
  }, [])

  const handleToken = async () => {
    try {
      const token = await SecureStore.getItemAsync('token')
      if (token) {
        setTokenExists(true)
        // Decode token to get role
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserRole(payload.role)
      } else {
        setTokenExists(false)
      }
    } catch (error) {
      console.error('Failed to get token', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.terracotta} />
    </View>
  )

  const getInitialRoute = () => {
    if (!tokenExists) return 'Login'
    if (userRole === 'guard') return 'GuardTabs'
    return 'ResidentTabs'
  }

  return (
    <SafeAreaProvider>
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
      initialRouteName={getInitialRoute()} 
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
        }}>
        
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} options={{ headerShown: true, title: 'Verify OTP' }} />
        <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} options={{ headerShown: true, title: 'Complete your profile' }} />

        {/* Resident Tab Navigator */}
        <Stack.Screen name="ResidentTabs" component={ResidentTabs} />

        {/* Guard Tab Navigator */}
        <Stack.Screen name="GuardTabs" component={GuardTabs} />

        {/* Stack screens (pushed on top of tabs) */}
        <Stack.Screen name="ReportIncident" component={ReportIncidentScreen} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
        <Stack.Screen name="ActiveSessions" component={ActiveSessionsScreen} />
        <Stack.Screen name="ProxyAccounts" component={ProxyAccountsScreen} />
        <Stack.Screen name="DangerZone" component={DangerZoneScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    <Toast />
    </SafeAreaProvider>
  );
}