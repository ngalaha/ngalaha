import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

/** The app's single most important control — large enough to hit reliably with gloves on. */
export default function BigCameraButton({ onPress, disabled }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.92)}
        onPressOut={() => animateTo(1)}
        disabled={disabled}
        android_ripple={disabled ? undefined : { color: 'rgba(255, 255, 255, 0.3)', borderless: false }}
        style={[styles.circle, { opacity: disabled ? 0.5 : 1 }]}
      >
        <Ionicons name="camera" size={64} color={colors.textOnPrimary} />
        <Text style={styles.label}>PRENDRE UNE PHOTO</Text>
      </Pressable>
    </Animated.View>
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
  label: {
    color: colors.textOnPrimary,
    fontWeight: '800',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
