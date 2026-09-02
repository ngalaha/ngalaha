import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Pill } from '../components/Pill';
import { useTheme } from '../styles/ThemeContext';
import { lengthToMeters, m2ToFt2, m3ToFt3, metersToLength, ft3ToM3, type LengthUnit } from '../calculationEngine/conversions';
import { rectangleArea, triangleArea, circleAreaFromDiameter } from '../calculationEngine/surfaces';
import { formatFeetInches, formatNumber } from '../calculationEngine/format';
import { parseMeasurement } from '../calculationEngine/measurementParser';

type Category = 'longueur' | 'superficie' | 'volume';
const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'longueur', label: 'Longueur' },
  { key: 'superficie', label: 'Superficie' },
  { key: 'volume', label: 'Volume' },
];

const LENGTH_UNITS: LengthUnit[] = ['ft', 'in', 'm', 'cm', 'mm', 'yd'];

export function ConversionsScreen() {
  const [category, setCategory] = useState<Category>('longueur');

  return (
    <Screen>
      <View style={styles.pillRow}>
        {CATEGORIES.map((c) => (
          <Pill key={c.key} label={c.label} active={category === c.key} onPress={() => setCategory(c.key)} />
        ))}
      </View>

      {category === 'longueur' && <LengthConverter />}
      {category === 'superficie' && <AreaConverter />}
      {category === 'volume' && <VolumeConverter />}
    </Screen>
  );
}

function LengthConverter() {
  const { colors, spacing, radius } = useTheme();
  const [value, setValue] = useState('');
  const [from, setFrom] = useState<LengthUnit>('ft');

  const meters = useMemo(() => {
    const n = parseFloat(value.replace(',', '.'));
    return Number.isFinite(n) ? lengthToMeters(n, from) : null;
  }, [value, from]);

  return (
    <View style={{ gap: spacing.sm }}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="ex: 12.5"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md }]}
      />
      <View style={styles.pillRow}>
        {LENGTH_UNITS.map((u) => (
          <Pill key={u} label={u} active={from === u} onPress={() => setFrom(u)} />
        ))}
      </View>

      {meters !== null && (
        <View style={[styles.resultBox, { backgroundColor: colors.surfaceAlt }]}>
          {LENGTH_UNITS.map((u) => (
            <Text key={u} style={{ color: colors.text }}>
              {u} : {formatNumber(metersToLength(meters, u), 4)}
            </Text>
          ))}
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{formatFeetInches(meters)}</Text>
        </View>
      )}
    </View>
  );
}

type AreaShape = 'rectangle' | 'triangle' | 'cercle';

function AreaConverter() {
  const { colors, spacing, radius } = useTheme();
  const [shape, setShape] = useState<AreaShape>('rectangle');
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  const area = useMemo(() => {
    const pa = parseMeasurement(a);
    if (!pa.ok) return null;
    if (shape === 'cercle') return circleAreaFromDiameter(pa.meters);
    const pb = parseMeasurement(b);
    if (!pb.ok) return null;
    return shape === 'rectangle' ? rectangleArea(pa.meters, pb.meters) : triangleArea(pa.meters, pb.meters);
  }, [shape, a, b]);

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.pillRow}>
        <Pill label="Rectangle" active={shape === 'rectangle'} onPress={() => setShape('rectangle')} />
        <Pill label="Triangle" active={shape === 'triangle'} onPress={() => setShape('triangle')} />
        <Pill label="Cercle" active={shape === 'cercle'} onPress={() => setShape('cercle')} />
      </View>
      <TextInput
        value={a}
        onChangeText={setA}
        placeholder={shape === 'cercle' ? 'Diamètre' : shape === 'triangle' ? 'Base' : 'Longueur'}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md }]}
      />
      {shape !== 'cercle' && (
        <TextInput
          value={b}
          onChangeText={setB}
          placeholder={shape === 'triangle' ? 'Hauteur' : 'Largeur'}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md }]}
        />
      )}
      {area !== null && (
        <View style={[styles.resultBox, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={{ color: colors.text }}>{formatNumber(area, 4)} m²</Text>
          <Text style={{ color: colors.text }}>{formatNumber(m2ToFt2(area), 4)} pi²</Text>
        </View>
      )}
    </View>
  );
}

function VolumeConverter() {
  const { colors, spacing, radius } = useTheme();
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'m3' | 'ft3'>('m3');

  const m3 = useMemo(() => {
    const n = parseFloat(value.replace(',', '.'));
    if (!Number.isFinite(n)) return null;
    return unit === 'm3' ? n : ft3ToM3(n);
  }, [value, unit]);

  return (
    <View style={{ gap: spacing.sm }}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="ex: 2.5"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md }]}
      />
      <View style={styles.pillRow}>
        <Pill label="m³" active={unit === 'm3'} onPress={() => setUnit('m3')} />
        <Pill label="pi³" active={unit === 'ft3'} onPress={() => setUnit('ft3')} />
      </View>
      {m3 !== null && (
        <View style={[styles.resultBox, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={{ color: colors.text }}>{formatNumber(m3, 4)} m³</Text>
          <Text style={{ color: colors.text }}>{formatNumber(m3ToFt3(m3), 4)} pi³</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  resultBox: {
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
});
