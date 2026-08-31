import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

interface Props {
  pendingCount: number;
  syncing: boolean;
  isOnline: boolean;
}

export default function PendingUploadsBanner({ pendingCount, syncing, isOnline }: Props) {
  if (pendingCount === 0) return null;

  return (
    <View style={styles.container}>
      {syncing && <ActivityIndicator size="small" color={colors.textOnPrimary} style={{ marginRight: 8 }} />}
      <Text style={styles.text}>
        📤 {pendingCount} photo{pendingCount > 1 ? 's' : ''} en attente
        {!isOnline ? ' (hors ligne)' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  text: { color: colors.textOnPrimary, fontWeight: '700' },
});
