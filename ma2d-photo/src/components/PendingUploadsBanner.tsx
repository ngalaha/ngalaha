import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';

interface Props {
  pendingCount: number;
  syncing: boolean;
  isOnline: boolean;
  /** Sends the queue right away — see the note on the banner itself. */
  onPress?: () => void;
}

export default function PendingUploadsBanner({ pendingCount, syncing, isOnline, onPress }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: pendingCount > 0 ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [pendingCount, opacity]);

  if (pendingCount === 0) return null;

  // The queue otherwise only moves on a new capture, on reconnection or on
  // the background pass — after configuring a building's folder, tapping
  // here is how the waiting files leave immediately.
  const canSend = !!onPress && !syncing && isOnline;

  return (
    <Animated.View style={{ opacity }}>
      <Pressable
        style={styles.container}
        onPress={canSend ? onPress : undefined}
        android_ripple={canSend ? { color: 'rgba(255,255,255,0.15)' } : undefined}
      >
        {syncing ? (
          <ActivityIndicator size="small" color={colors.textOnPrimary} style={styles.icon} />
        ) : (
          <Ionicons name="cloud-upload-outline" size={18} color={colors.textOnPrimary} style={styles.icon} />
        )}
        <Text style={styles.text}>
          {pendingCount} photo{pendingCount > 1 ? 's' : ''} en attente
          {!isOnline ? ' (hors ligne)' : canSend ? ' — envoyer maintenant' : ''}
        </Text>
      </Pressable>
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
