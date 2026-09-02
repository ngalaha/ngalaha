import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../styles/ThemeContext';

interface NumberFieldProps {
  label: string;
  value: string;
  onChangeValue: (raw: string) => void;
  placeholder?: string;
  suffix?: string;
}

/** Champ de saisie numérique décimal — système métrique uniquement, pas de conversion pieds/pouces. */
export function NumberField({ label, value, onChangeValue, placeholder, suffix }: NumberFieldProps) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>
        {label}
        {suffix ? ` (${suffix})` : ''}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeValue}
        placeholder={placeholder ?? '0'}
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        style={[
          styles.input,
          {
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            fontSize: typography.sizes.md,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
