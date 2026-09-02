import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../styles/ThemeContext';

interface CardProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

export function Card({ icon, title, subtitle, onPress }: CardProps) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.md }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: typography.sizes.sm }]}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 120,
    justifyContent: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    lineHeight: 18,
  },
});
