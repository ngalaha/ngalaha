import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useAuth } from '@/hooks/useAuth';
import AdminBuildingEditScreen from '@/screens/AdminBuildingEditScreen';
import AdminNewBuildingScreen from '@/screens/AdminNewBuildingScreen';
import AdminNewProjectScreen from '@/screens/AdminNewProjectScreen';
import AdminScreen from '@/screens/AdminScreen';
import DiagnosticsScreen from '@/screens/DiagnosticsScreen';
import HomeScreen from '@/screens/HomeScreen';
import LoginScreen from '@/screens/LoginScreen';
import { colors } from '@/theme/colors';

import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isSignedIn, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.textOnPrimary,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        {!isSignedIn ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'MA2D Construction' }} />
            <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Administration' }} />
            <Stack.Screen
              name="AdminNewProject"
              component={AdminNewProjectScreen}
              options={{ title: 'Nouveau projet' }}
            />
            <Stack.Screen
              name="AdminNewBuilding"
              component={AdminNewBuildingScreen}
              options={{ title: 'Nouveau bâtiment' }}
            />
            <Stack.Screen
              name="AdminBuildingEdit"
              component={AdminBuildingEditScreen}
              options={{ title: 'Dossier OneDrive' }}
            />
            <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} options={{ title: 'Diagnostic' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
