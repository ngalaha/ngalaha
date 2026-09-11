import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/i18n/I18nContext';
import { TranslationKey } from '@/i18n/translate';
import { ThemeColors } from '@/theme/colors';
import { useTheme, useThemedStyles } from '@/theme/ThemeContext';
import { PhotoStatus } from '@/types';

/** Built from the active palette: a status colour differs between themes. */
function statusConfig(
  colors: ThemeColors
): Record<PhotoStatus, { labelKey: TranslationKey; color: string; icon: keyof typeof Ionicons.glyphMap }> {
  return {
    LOCAL: { labelKey: 'status.local', color: colors.textSecondary, icon: 'save-outline' },
    PENDING: { labelKey: 'status.pending', color: colors.warning, icon: 'time-outline' },
    UPLOADING: { labelKey: 'status.uploading', color: colors.primary, icon: 'sync' },
    UPLOADED: { labelKey: 'status.uploaded', color: colors.success, icon: 'checkmark-circle' },
    FAILED: { labelKey: 'status.failed', color: colors.danger, icon: 'alert-circle' },
  };
}

export default function PhotoStatusBadge({ status }: { status: PhotoStatus }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const config = statusConfig(colors)[status];
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status !== 'UPLOADING') return;
    rotation.setValue(0);
    const loop = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 900, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [status, rotation]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <Animated.View style={status === 'UPLOADING' ? { transform: [{ rotate: spin }] } : undefined}>
        <Ionicons name={config.icon} size={14} color={config.color} />
      </Animated.View>
      <Text style={[styles.text, { color: config.color }]}>{t(config.labelKey)}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 2 },
  text: { fontSize: 13, fontWeight: '700' },
});
