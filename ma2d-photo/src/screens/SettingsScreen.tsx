import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import {
  AppSettings,
  PhotoQuality,
  VIDEO_DURATION_CHOICES,
  getSettings,
  updateSettings,
} from '@/services/settings/appSettings';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

const QUALITY_LABELS: Record<PhotoQuality, { title: string; detail: string }> = {
  high: { title: 'Haute', detail: 'Plus de détail, fichiers plus lourds' },
  balanced: { title: 'Équilibrée', detail: 'Recommandé pour le chantier' },
  light: { title: 'Légère', detail: 'Fichiers légers, forfait limité' },
};

function formatDuration(seconds: number): string {
  return seconds >= 60 ? `${seconds / 60} min` : `${seconds} s`;
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={17} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Choice({
  label,
  detail,
  selected,
  onPress,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
      suppressHighlighting
    >
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
      {detail ? <Text style={styles.choiceDetail}>{`\n${detail}`}</Text> : null}
    </Text>
  );
}

function Toggle({
  label,
  detail,
  value,
  onChange,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={typography.bodyBold}>{label}</Text>
        <Text style={styles.toggleDetail}>{detail}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.accent, false: colors.border }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

/**
 * Per-device preferences. Everything here concerns this phone — its data
 * plan, its storage — so nothing is published to the shared configuration.
 */
export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);

  const apply = (patch: Partial<AppSettings>) => setSettings(updateSettings(patch));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title="PRISE DE VUE" icon="camera-outline">
        <Text style={styles.label}>Qualité des photos</Text>
        <View style={styles.choiceRow}>
          {(Object.keys(QUALITY_LABELS) as PhotoQuality[]).map((quality) => (
            <Choice
              key={quality}
              label={QUALITY_LABELS[quality].title}
              detail={QUALITY_LABELS[quality].detail}
              selected={settings.photoQuality === quality}
              onPress={() => apply({ photoQuality: quality })}
            />
          ))}
        </View>

        <Text style={styles.label}>Durée maximale des vidéos</Text>
        <View style={styles.choiceRow}>
          {VIDEO_DURATION_CHOICES.map((seconds) => (
            <Choice
              key={seconds}
              label={formatDuration(seconds)}
              selected={settings.maxVideoSeconds === seconds}
              onPress={() => apply({ maxVideoSeconds: seconds })}
            />
          ))}
        </View>
      </Section>

      <Section title="ENVOI" icon="cloud-upload-outline">
        <Toggle
          label="Envoyer uniquement en Wi-Fi"
          detail="Les photos attendent le Wi-Fi au lieu de consommer les données mobiles. Rien n'est perdu : la file part toute seule."
          value={settings.wifiOnlyUploads}
          onChange={(wifiOnlyUploads) => apply({ wifiOnlyUploads })}
        />
        <Toggle
          label="Conserver une copie sur le téléphone"
          detail="Après l'envoi, la copie locale est gardée au lieu d'être supprimée. Utile pour vérifier, mais occupe la mémoire du téléphone."
          value={settings.keepLocalAfterUpload}
          onChange={(keepLocalAfterUpload) => apply({ keepLocalAfterUpload })}
        />
      </Section>

      <Text style={styles.footnote}>
        Ces réglages ne concernent que cet appareil. Ils ne sont pas partagés avec les autres
        téléphones de l'équipe.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { ...typography.bodyBold, color: colors.primary },
  label: { color: colors.textSecondary, fontSize: 13, marginTop: 14, marginBottom: 8 },
  choiceRow: { flexDirection: 'row', gap: 8 },
  choice: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    textAlign: 'center',
    overflow: 'hidden',
  },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.background },
  choiceLabel: { ...typography.bodyBold, color: colors.textSecondary },
  choiceLabelSelected: { color: colors.primary },
  choiceDetail: { color: colors.textSecondary, fontSize: 11, lineHeight: 15 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 10,
  },
  toggleText: { flex: 1, gap: 3 },
  toggleDetail: { color: colors.textSecondary, fontSize: 12, lineHeight: 16 },
  footnote: { color: colors.textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 17 },
});
