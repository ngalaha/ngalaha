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
          Bâti Facile
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: typography.sizes.md }}>
          Calculez vos parpaings et matériaux avec précision
        </Text>
      </View>

      <View style={[styles.grid, { gap: spacing.md }]}>
        <Card icon="📁" title="Mes projets" subtitle="Créer ou reprendre un calcul" onPress={() => navigation.navigate('Projets')} />
        <Card icon="⚙️" title="Paramètres" subtitle="Apparence, marge par défaut" onPress={() => navigation.navigate('Parametres')} />
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
