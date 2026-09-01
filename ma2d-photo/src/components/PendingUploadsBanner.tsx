import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

interface Props {
  pendingCount: number;
  syncing: boolean;
  isOnline: boolean;
}

export default function PendingUploadsBanner({ pendingCount, syncing, isOnline }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: pendingCount > 0 ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [pendingCount, opacity]);

  if (pendingCount === 0) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {syncing ? (
        <ActivityIndicator size="small" color={colors.textOnPrimary} style={styles.icon} />
      ) : (
        <Ionicons name="cloud-upload-outline" size={18} color={colors.textOnPrimary} style={styles.icon} />
      )}
      <Text style={styles.text}>
        {pendingCount} photo{pendingCount > 1 ? 's' : ''} en attente
        {!isOnline ? ' (hors ligne)' : ''}
      </Text>
    </Animated.View>
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
  icon: { marginRight: 8 },
  text: { color: colors.textOnPrimary, fontWeight: '700' },
});
