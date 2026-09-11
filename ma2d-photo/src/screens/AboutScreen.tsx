import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/i18n/I18nContext';
import { ThemeColors } from '@/theme/colors';
import { useTheme, useThemedStyles } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const MA2D_WEBSITE_URL = 'https://www.ma2d.com/fr/entrepreneur-general-ma2d-construction';

export default function AboutScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.brandHeader}>
        <Image source={require('../../assets/ma2d-logo.jpg')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>MA2D Photo</Text>
        <Text style={styles.appTagline}>{t('about.tagline')}</Text>
        <View style={styles.versionPill}>
          <Text style={styles.versionText}>{t('about.version', { version: APP_VERSION })}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="business-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('about.company.title')}</Text>
        </View>
        <Text style={styles.paragraph}>{t('about.company.p1')}</Text>
        <Text style={styles.paragraph}>{t('about.company.p2')}</Text>
        <Pressable onPress={() => Linking.openURL(MA2D_WEBSITE_URL)} style={styles.linkRow}>
          <Ionicons name="globe-outline" size={16} color={colors.primary} />
          <Text style={styles.link}>{t('about.company.link')}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('about.security.title')}</Text>
        </View>
        <Text style={styles.paragraph}>{t('about.security.body')}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('about.author.title')}</Text>
        </View>
        <View style={styles.profileRow}>
          <Image source={require('../../assets/pierre-ngalaha.jpg')} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Pierre NGALAHA</Text>
            <Text style={styles.profileTitle}>{t('about.author.role')}</Text>
          </View>
        </View>
        <Text style={styles.paragraph}>{t('about.author.body')}</Text>
      </View>

      <Text style={styles.footer}>© {new Date().getFullYear()} MA2D Construction</Text>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  brandHeader: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 160, height: 90, marginBottom: 12 },
  appName: { ...typography.h1, color: colors.primary, textAlign: 'center' },
  appTagline: { color: colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  versionPill: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  versionText: { color: colors.textOnPrimary, fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { ...typography.bodyBold, color: colors.primary },
  paragraph: { ...typography.body, color: colors.textPrimary, lineHeight: 21, marginBottom: 10 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  link: { color: colors.primary, fontWeight: '700' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.border },
  profileInfo: { flex: 1 },
  profileName: { ...typography.bodyBold, color: colors.textPrimary },
  profileTitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  footer: { textAlign: 'center', color: colors.textSecondary, opacity: 0.6, fontSize: 12, marginTop: 8 },
});
