import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const MA2D_WEBSITE_URL = 'https://www.ma2d.com/fr/entrepreneur-general-ma2d-construction';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.brandHeader}>
        <Image source={require('../../assets/ma2d-logo.jpg')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>MA2D Construction</Text>
        <Text style={styles.appTagline}>Gestion automatique des photos de chantier</Text>
        <View style={styles.versionPill}>
          <Text style={styles.versionText}>Version {APP_VERSION}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="business-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>À propos de MA2D Construction</Text>
        </View>
        <Text style={styles.paragraph}>
          MA2D Construction est un entrepreneur général fondé en 2010, spécialisé dans les projets de
          développement immobilier résidentiel, commercial et industriel dans la région métropolitaine.
        </Text>
        <Text style={styles.paragraph}>
          Cette application permet aux équipes de chantier de photographier l'avancement des travaux et
          de les classer automatiquement dans OneDrive, par projet, bâtiment et appartement — sans
          manipulation manuelle sur le terrain.
        </Text>
        <Pressable onPress={() => Linking.openURL(MA2D_WEBSITE_URL)} style={styles.linkRow}>
          <Ionicons name="globe-outline" size={16} color={colors.primary} />
          <Text style={styles.link}>Visiter le site de MA2D</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Conception et développement</Text>
        </View>
        <View style={styles.profileRow}>
          <Image source={require('../../assets/pierre-ngalaha.jpg')} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Pierre NGALAHA</Text>
            <Text style={styles.profileTitle}>Adjoint de chantier — MA2D Construction</Text>
          </View>
        </View>
        <Text style={styles.paragraph}>
          Application conçue et développée en interne pour répondre aux besoins réels des
          équipes de chantier de MA2D Construction.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Sécurité</Text>
        </View>
        <Text style={styles.paragraph}>
          Connexion via Microsoft Entra ID. Aucun mot de passe ni identifiant Microsoft n'est
          stocké dans l'application — uniquement une session sécurisée gérée par Microsoft.
        </Text>
      </View>

      <Text style={styles.footer}>© {new Date().getFullYear()} MA2D Construction</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
