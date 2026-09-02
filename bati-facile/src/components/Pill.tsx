import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '../styles/ThemeContext';

export function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.xl,
        backgroundColor: active ? colors.primary : colors.surfaceAlt,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text style={{ color: active ? colors.primaryText : colors.text, fontSize: typography.sizes.sm, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}
