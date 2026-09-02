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
  const { colors, spacing, typography, preferences, setThemeMode, setChantierMode } = useTheme();

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700' }}>Paramètres</Text>

      <Text style={{ color: colors.textMuted }}>Apparence</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {THEME_MODES.map((m) => (
          <Pill key={m.key} label={m.label} active={preferences.themeMode === m.key} onPress={() => setThemeMode(m.key)} />
        ))}
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.textMuted }}>Mode Chantier (gros boutons, interface simplifiée)</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pill label="Désactivé" active={!preferences.chantierMode} onPress={() => setChantierMode(false)} />
          <Pill label="Activé" active={preferences.chantierMode} onPress={() => setChantierMode(true)} />
        </View>
      </View>

      <Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>
        Calcul Chantier fonctionne entièrement hors ligne. Toutes les données sont sauvegardées localement sur
        l'appareil.
      </Text>
    </Screen>
  );
}
