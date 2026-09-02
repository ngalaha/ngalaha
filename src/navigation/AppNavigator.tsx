import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import type { RootStackParamList } from './types';
import { useTheme } from '../styles/ThemeContext';
import { HomeScreen } from '../screens/HomeScreen';
import { CalculRapideScreen } from '../screens/CalculRapideScreen';
import { BetonScreen } from '../screens/BetonScreen';
import { PanneauxScreen } from '../screens/PanneauxScreen';
import { ConversionsScreen } from '../screens/ConversionsScreen';
import { CommandesScreen } from '../screens/CommandesScreen';
import { ProjetsScreen } from '../screens/ProjetsScreen';
import { ProjetDetailScreen } from '../screens/ProjetDetailScreen';
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
            title: 'Calcul Chantier',
            headerRight: () => (
              <Text onPress={() => navigation.navigate('Parametres')} style={{ color: colors.primary, fontSize: 20 }}>
                ⚙️
              </Text>
            ),
          })}
        />
        <Stack.Screen name="CalculRapide" component={CalculRapideScreen} options={{ title: 'Calcul rapide' }} />
        <Stack.Screen name="Beton" component={BetonScreen} options={{ title: 'Béton' }} />
        <Stack.Screen name="Panneaux" component={PanneauxScreen} options={{ title: 'Panneaux' }} />
        <Stack.Screen name="Conversions" component={ConversionsScreen} options={{ title: 'Conversions' }} />
        <Stack.Screen name="Commandes" component={CommandesScreen} options={{ title: 'Commande' }} />
        <Stack.Screen name="Projets" component={ProjetsScreen} options={{ title: 'Projets' }} />
        <Stack.Screen name="ProjetDetail" component={ProjetDetailScreen} options={{ title: 'Projet' }} />
        <Stack.Screen name="Parametres" component={ParametresScreen} options={{ title: 'Paramètres' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
