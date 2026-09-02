import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import type { RootStackParamList } from './types';
import { useTheme } from '../styles/ThemeContext';
import { HomeScreen } from '../screens/HomeScreen';
import { ProjetsScreen } from '../screens/ProjetsScreen';
import { ProjetDetailScreen } from '../screens/ProjetDetailScreen';
import { MursScreen } from '../screens/MursScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { ParametresScreen } from '../screens/ParametresScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { colors, isDark } = useTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            title: 'Bâti Facile',
            headerRight: () => (
              <Text onPress={() => navigation.navigate('Parametres')} style={{ color: colors.primary, fontSize: 20 }}>
                ⚙️
              </Text>
            ),
          })}
        />
        <Stack.Screen name="Projets" component={ProjetsScreen} options={{ title: 'Projets' }} />
        <Stack.Screen name="ProjetDetail" component={ProjetDetailScreen} options={{ title: 'Devis' }} />
        <Stack.Screen name="Murs" component={MursScreen} options={{ title: 'Murs' }} />
        <Stack.Screen name="Plan" component={PlanScreen} options={{ title: 'Relevé sur plan' }} />
        <Stack.Screen name="Parametres" component={ParametresScreen} options={{ title: 'Paramètres' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
