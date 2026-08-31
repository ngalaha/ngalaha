import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '@/components/PrimaryButton';
import { useAuth } from '@/hooks/useAuth';
import { isMicrosoftAuthConfigured } from '@/config/env';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export default function LoginScreen() {
  const { signIn, loading, error } = useAuth();
  const configured = isMicrosoftAuthConfigured();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>MA2D</Text>
        <Text style={styles.subtitle}>CONSTRUCTION</Text>
        <Text style={[typography.body, styles.tagline]}>
          Photos de chantier, classées automatiquement dans OneDrive.
        </Text>

        {!configured && (
          <Text style={styles.warning}>
            ⚠️ Configuration Microsoft manquante. Voir docs/ENTRA_ID_SETUP.md pour renseigner
            MICROSOFT_CLIENT_ID.
          </Text>
        )}
        {error && <Text style={styles.warning}>{error}</Text>}

        <PrimaryButton
          label="Se connecter avec Microsoft"
          onPress={signIn}
          loading={loading}
          disabled={!configured}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 48, fontWeight: '900', color: colors.textOnPrimary, letterSpacing: 2 },
  subtitle: { fontSize: 16, fontWeight: '700', color: colors.accent, letterSpacing: 4, marginBottom: 24 },
  tagline: { color: colors.textOnPrimary, textAlign: 'center', marginBottom: 40, opacity: 0.85 },
  warning: { color: colors.accent, textAlign: 'center', marginBottom: 20 },
  button: { width: '100%' },
});
