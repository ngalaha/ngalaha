import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { PhotoStatus } from '@/types';

const STATUS_CONFIG: Record<
  PhotoStatus,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  LOCAL: { label: 'Locale', color: colors.textSecondary, icon: 'save-outline' },
  PENDING: { label: 'En attente', color: colors.warning, icon: 'time-outline' },
  UPLOADING: { label: 'Envoi...', color: colors.primary, icon: 'sync' },
  UPLOADED: { label: 'Envoyée', color: colors.success, icon: 'checkmark-circle' },
  FAILED: { label: 'Échec', color: colors.danger, icon: 'alert-circle' },
};

export default function PhotoStatusBadge({ status }: { status: PhotoStatus }) {
  const config = STATUS_CONFIG[status];
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
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 2 },
  text: { fontSize: 13, fontWeight: '700' },
});
