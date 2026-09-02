import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../styles/ThemeContext';
import { parseMeasurement } from '../calculationEngine/measurementParser';

interface MeasurementFieldProps {
  label: string;
  value: string;
  onChangeValue: (raw: string) => void;
  placeholder?: string;
}

const QUICK_INSERTS = ['6"', '8"', '10"', '12"', "1'", "2'"];

/**
 * Champ de saisie "pieds + pouces intelligente" : accepte librement les
 * formats du cahier des charges (12'-6", 12 pi 6 po, 3.81 m, ...) et affiche
 * la valeur exacte convertie ainsi qu'un jeu de boutons rapides de chantier.
 */
export function MeasurementField({ label, value, onChangeValue, placeholder }: MeasurementFieldProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const [touched, setTouched] = useState(false);

  const parsed = useMemo(() => (value.trim() ? parseMeasurement(value) : undefined), [value]);
  const showError = touched && value.trim().length > 0 && parsed && !parsed.ok;

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeValue}
        onBlur={() => setTouched(true)}
        placeholder={placeholder ?? "ex: 12'-6\""}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            borderColor: showError ? colors.danger : colors.border,
            color: colors.text,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            fontSize: typography.sizes.md,
          },
        ]}
      />
      <View style={styles.quickRow}>
        {QUICK_INSERTS.map((token) => (
          <Text
            key={token}
            onPress={() => onChangeValue(value.trim().length > 0 ? `${value.trim()} ${token}` : token)}
            style={[
              styles.chip,
              {
                backgroundColor: colors.surfaceAlt,
                color: colors.text,
                borderRadius: radius.sm,
                fontSize: typography.sizes.sm,
              },
            ]}
          >
            {token}
          </Text>
        ))}
      </View>
      {showError && !parsed?.ok ? (
        <Text style={{ color: colors.danger, fontSize: typography.sizes.xs }}>{parsed && !parsed.ok ? parsed.error : ''}</Text>
      ) : null}
      {parsed?.ok ? (
        <Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>
          = {parsed.meters.toFixed(4)} m
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
});
