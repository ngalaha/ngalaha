import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

/** The app's single most important control — large enough to hit reliably with gloves on. */
export default function BigCameraButton({ onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.circle,
        { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={styles.icon}>📷</Text>
      <Text style={styles.label}>PRENDRE UNE PHOTO</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  icon: { fontSize: 56 },
  label: {
    color: colors.textOnPrimary,
    fontWeight: '800',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
