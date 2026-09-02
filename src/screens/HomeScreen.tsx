import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { useTheme } from '../styles/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { colors, spacing, typography } = useTheme();

  return (
    <Screen>
      <View>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xxl }]}>
          Calcul Chantier
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: typography.sizes.md }}>
          Calculez vos matériaux avec précision
        </Text>
      </View>

      <View style={[styles.grid, { gap: spacing.md }]}>
        <Card icon="⚡" title="Calcul rapide" subtitle="Sans créer de projet" onPress={() => navigation.navigate('CalculRapide')} />
        <Card icon="🧱" title="Béton" subtitle="Volumes et commandes" onPress={() => navigation.navigate('Beton', undefined)} />
        <Card icon="📐" title="Panneaux" subtitle="Plywood, OSB, coffrage" onPress={() => navigation.navigate('Panneaux', undefined)} />
        <Card icon="📏" title="Conversions" subtitle="Pieds, pouces, mètres" onPress={() => navigation.navigate('Conversions')} />
        <Card icon="🧾" title="Commandes" subtitle="Préparer une commande" onPress={() => navigation.navigate('Commandes', undefined)} />
        <Card icon="📁" title="Projets" subtitle="Sauvegarder vos calculs" onPress={() => navigation.navigate('Projets')} />
      </View>

      <Text style={[styles.footer, { color: colors.textMuted, fontSize: typography.sizes.xs }]}>
        Développé par Pierre NGALAHA
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    textAlign: 'center',
    marginTop: 8,
  },
});
