import React from 'react';
import { ActivityIndicator, GestureResponderEvent, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface Props {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function PrimaryButton({ label, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const backgroundColor =
    variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : colors.surface;
  const textColor = variant === 'secondary' ? colors.primary : colors.textOnPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'secondary' && styles.secondaryBorder,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[typography.button, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  secondaryBorder: {
    borderWidth: 2,
    borderColor: '#0F2A43',
  },
});
