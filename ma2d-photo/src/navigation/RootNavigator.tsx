import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable } from 'react-native';

import SideMenu from '@/components/SideMenu';
import { useAuth } from '@/hooks/useAuth';
import AboutScreen from '@/screens/AboutScreen';
import AdminApartmentsScreen from '@/screens/AdminApartmentsScreen';
import AdminBuildingEditScreen from '@/screens/AdminBuildingEditScreen';
import AdminNewBuildingScreen from '@/screens/AdminNewBuildingScreen';
import AdminNewProjectScreen from '@/screens/AdminNewProjectScreen';
import AdminScreen from '@/screens/AdminScreen';
import DiagnosticsScreen from '@/screens/DiagnosticsScreen';
import HomeScreen from '@/screens/HomeScreen';
import LoginScreen from '@/screens/LoginScreen';
import { colors } from '@/theme/colors';

import { navigationRef } from './navigationRef';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isSignedIn, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) return null;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.textOnPrimary,
          headerTitleStyle: { fontWeight: '700' },
          headerRight: () => (
            <Pressable onPress={() => setMenuOpen(true)} hitSlop={10} style={{ paddingHorizontal: 4 }}>
              <Ionicons name="menu" size={26} color={colors.textOnPrimary} />
            </Pressable>
          ),
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
            <Stack.Screen
              name="AdminApartments"
              component={AdminApartmentsScreen}
              options={{ title: 'Appartements' }}
            />
            <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} options={{ title: 'Diagnostic' }} />
            <Stack.Screen name="About" component={AboutScreen} options={{ title: 'À propos' }} />
          </>
        )}
      </Stack.Navigator>
      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </NavigationContainer>
  );
}
