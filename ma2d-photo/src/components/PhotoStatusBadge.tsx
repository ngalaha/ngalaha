import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { PhotoStatus } from '@/types';

const STATUS_CONFIG: Record<PhotoStatus, { label: string; color: string }> = {
  LOCAL: { label: '💾 Locale', color: colors.textSecondary },
  PENDING: { label: '⏳ En attente', color: colors.warning },
  UPLOADING: { label: '🔄 Envoi...', color: colors.primary },
  UPLOADED: { label: '✅ Envoyée', color: colors.success },
  FAILED: { label: '⚠ Échec', color: colors.danger },
};

export default function PhotoStatusBadge({ status }: { status: PhotoStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 2 },
  text: { fontSize: 13, fontWeight: '700' },
});
