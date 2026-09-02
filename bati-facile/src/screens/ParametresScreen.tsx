import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Pill } from '../components/Pill';
import { useTheme } from '../styles/ThemeContext';
import type { ThemeMode } from '../settings/preferences';

const THEME_MODES: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: 'Système' },
  { key: 'light', label: 'Clair' },
  { key: 'dark', label: 'Sombre' },
];

export function ParametresScreen() {
  const { colors, spacing, typography, preferences, setThemeMode } = useTheme();

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700' }}>Paramètres</Text>

      <Text style={{ color: colors.textMuted }}>Apparence</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {THEME_MODES.map((m) => (
          <Pill key={m.key} label={m.label} active={preferences.themeMode === m.key} onPress={() => setThemeMode(m.key)} />
        ))}
      </View>

      <Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>
        Bâti Facile fonctionne entièrement hors ligne. Toutes les données sont sauvegardées localement sur
        l'appareil.
      </Text>

      <View style={{ alignItems: 'center', marginTop: spacing.lg, gap: 4 }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Bâti Facile</Text>
        <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>Version 1.0.0</Text>
        <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>Développé par Pierre NGALAHA</Text>
      </View>
    </Screen>
  );
}
