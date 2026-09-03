import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '@/components/PrimaryButton';
import { useAuth } from '@/hooks/useAuth';
import { isMicrosoftAuthConfigured } from '@/config/env';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export default function LoginScreen() {
  const { signIn, loading, error } = useAuth();
  const configured = isMicrosoftAuthConfigured();

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 8 }),
    ]).start();
  }, [opacity, scale]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <Image source={require('../../assets/ma2d-logo.jpg')} style={styles.logoImage} resizeMode="contain" />
        </Animated.View>
        <Text style={styles.logo}>MA2D PHOTO</Text>
        <Text style={styles.subtitle}>CONSTRUCTION</Text>
        <Text style={[typography.body, styles.tagline]}>
          Photos de chantier, classées automatiquement dans OneDrive.
        </Text>

        {!configured && (
          <View style={styles.warningRow}>
            <Ionicons name="warning" size={16} color={colors.warning} />
            <Text style={styles.warning}>
              Configuration Microsoft manquante. Voir docs/ENTRA_ID_SETUP.md pour renseigner
              MICROSOFT_CLIENT_ID.
            </Text>
          </View>
        )}
        {error && (
          <View style={styles.warningRow}>
            <Ionicons name="warning" size={16} color={colors.warning} />
            <Text style={styles.warning}>{error}</Text>
          </View>
        )}

        <PrimaryButton
          label="Se connecter avec Microsoft"
          icon="log-in-outline"
          onPress={signIn}
          loading={loading}
          disabled={!configured}
          style={styles.button}
        />
      </View>

      <Text style={styles.credit}>Développé par Pierre NGALAHA</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // White throughout: the MA2D wordmark is dark brown/red and was
  // unreadable on the navy background it used to sit on.
  container: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logoImage: { width: 220, height: 120, marginBottom: 16 },
  logo: { fontSize: 44, fontWeight: '900', color: colors.primary, letterSpacing: 2 },
  subtitle: { fontSize: 16, fontWeight: '700', color: colors.accent, letterSpacing: 4, marginBottom: 24 },
  tagline: { color: colors.textSecondary, textAlign: 'center', marginBottom: 40 },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 20, paddingHorizontal: 8 },
  warning: { color: colors.warning, textAlign: 'left', flex: 1 },
  button: { width: '100%' },
  credit: {
    color: colors.textSecondary,
    opacity: 0.7,
    textAlign: 'center',
    fontSize: 12,
    paddingBottom: 16,
  },
});
