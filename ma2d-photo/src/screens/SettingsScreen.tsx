import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useTranslation } from '@/i18n/I18nContext';
import { LANGUAGES } from '@/i18n/languages';
import {
  AppSettings,
  PhotoQuality,
  ThemePreference,
  VIDEO_DURATION_CHOICES,
  getSettings,
  updateSettings,
} from '@/services/settings/appSettings';
import { ThemeColors } from '@/theme/colors';
import { useTheme, useThemedStyles } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';

const QUALITIES: PhotoQuality[] = ['high', 'balanced', 'light'];
const THEMES: ThemePreference[] = ['light', 'dark', 'system'];

function Section({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
  const styles = useThemedStyles(createStyles);
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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
  const styles = useThemedStyles(createStyles);
  const { t, language } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>(getSettings);

  const apply = (patch: Partial<AppSettings>) => setSettings(updateSettings(patch));

  const formatDuration = (seconds: number) =>
    seconds >= 60
      ? t('settings.duration.minutes', { count: seconds / 60 })
      : t('settings.duration.seconds', { count: seconds });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title={t('settings.section.language')} icon="language-outline">
        <Text style={styles.label}>{t('settings.language.label')}</Text>
        <View style={styles.choiceRow}>
          {LANGUAGES.map((entry) => (
            <Choice
              key={entry.code}
              // Each language names itself, so this list stays readable to
              // someone who cannot read the language currently in use.
              label={entry.label}
              selected={language === entry.code}
              onPress={() => apply({ language: entry.code })}
            />
          ))}
        </View>
        <Text style={styles.hint}>{t('settings.language.hint')}</Text>
      </Section>

      <Section title={t('settings.section.appearance')} icon="color-palette-outline">
        <Text style={styles.label}>{t('settings.theme.label')}</Text>
        <View style={styles.choiceRow}>
          {THEMES.map((theme) => (
            <Choice
              key={theme}
              label={t(`settings.theme.${theme}`)}
              selected={settings.theme === theme}
              onPress={() => apply({ theme })}
            />
          ))}
        </View>
        <Text style={styles.hint}>{t('settings.theme.hint')}</Text>
      </Section>

      <Section title={t('settings.section.capture')} icon="camera-outline">
        <Text style={styles.label}>{t('settings.quality.label')}</Text>
        <View style={styles.choiceRow}>
          {QUALITIES.map((quality) => (
            <Choice
              key={quality}
              label={t(`settings.quality.${quality}`)}
              detail={t(`settings.quality.${quality}.detail`)}
              selected={settings.photoQuality === quality}
              onPress={() => apply({ photoQuality: quality })}
            />
          ))}
        </View>

        <Text style={styles.label}>{t('settings.video.label')}</Text>
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

      <Section title={t('settings.section.upload')} icon="cloud-upload-outline">
        <Toggle
          label={t('settings.wifiOnly.label')}
          detail={t('settings.wifiOnly.detail')}
          value={settings.wifiOnlyUploads}
          onChange={(wifiOnlyUploads) => apply({ wifiOnlyUploads })}
        />
        <Toggle
          label={t('settings.keepLocal.label')}
          detail={t('settings.keepLocal.detail')}
          value={settings.keepLocalAfterUpload}
          onChange={(keepLocalAfterUpload) => apply({ keepLocalAfterUpload })}
        />
      </Section>

      <Text style={styles.footnote}>{t('settings.footnote')}</Text>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
  hint: { color: colors.textSecondary, fontSize: 12, lineHeight: 16, marginTop: 10 },
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
