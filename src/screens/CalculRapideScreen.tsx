import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { MeasurementField } from '../components/MeasurementField';
import { Button } from '../components/Button';
import { Pill } from '../components/Pill';
import { useTheme } from '../styles/ThemeContext';
import { parseMeasurement } from '../calculationEngine/measurementParser';
import { computeQuickCalc, type QuickCalcResult } from '../calculationEngine/calculations';
import { formatM2, formatM3 } from '../calculationEngine/format';
import { addHistoryEntry } from '../storage/history';
import type { LengthUnit } from '../calculationEngine/conversions';

type Mode = 'volumeSimple' | 'dalleSurface' | 'surface' | 'volume' | 'conversion' | 'additionVolumes';

const MODES: { key: Mode; label: string }[] = [
  { key: 'volumeSimple', label: 'L × l × e' },
  { key: 'dalleSurface', label: 'L × l × H' },
  { key: 'surface', label: 'Surface' },
  { key: 'volume', label: 'Volume' },
  { key: 'conversion', label: 'Conversion' },
  { key: 'additionVolumes', label: '+ Volumes' },
];

const UNITS: LengthUnit[] = ['m', 'cm', 'mm', 'ft', 'in', 'yd'];

export function CalculRapideScreen() {
  const { colors, spacing, typography } = useTheme();
  const [mode, setMode] = useState<Mode>('volumeSimple');

  const [longueur, setLongueur] = useState('');
  const [largeur, setLargeur] = useState('');
  const [hauteur, setHauteur] = useState('');

  const [convValue, setConvValue] = useState('');
  const [convFrom, setConvFrom] = useState<LengthUnit>('ft');
  const [convTo, setConvTo] = useState<LengthUnit>('m');

  const [volumeRows, setVolumeRows] = useState<string[]>(['']);

  const [result, setResult] = useState<QuickCalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resultLabel(): string {
    if (!result) return '';
    switch (result.mode) {
      case 'volumeSimple':
      case 'dalleSurface':
      case 'volume':
        return formatM3(result.volume);
      case 'surface':
        return formatM2(result.surface);
      case 'longueur':
        return `${result.longueur.toFixed(4)} m`;
      case 'conversion':
        return `${result.value.toFixed(4)} ${result.unit}`;
      case 'additionVolumes':
        return `${formatM3(result.total)} (${result.count} éléments)`;
      default:
        return '';
    }
  }

  function calculer() {
    setError(null);
    setResult(null);

    if (mode === 'conversion') {
      const value = parseFloat(convValue.replace(',', '.'));
      const calc = computeQuickCalc({ mode: 'conversion', valeur: value, from: convFrom, to: convTo });
      if (!calc.ok) return setError(calc.errors.map((e) => e.message).join('\n'));
      setResult(calc.value);
      addHistoryEntry({ mode: 'conversion', valeur: value, from: convFrom, to: convTo }, calc.value);
      return;
    }

    if (mode === 'additionVolumes') {
      const volumes: number[] = [];
      for (const row of volumeRows) {
        if (!row.trim()) continue;
        const parsed = parseMeasurement(row);
        if (!parsed.ok) return setError(parsed.error);
        volumes.push(parsed.meters);
      }
      const calc = computeQuickCalc({ mode: 'additionVolumes', volumes });
      if (!calc.ok) return setError(calc.errors.map((e) => e.message).join('\n'));
      setResult(calc.value);
      addHistoryEntry({ mode: 'additionVolumes', volumes }, calc.value);
      return;
    }

    const l = parseMeasurement(longueur);
    if (!l.ok) return setError(`Longueur : ${l.error}`);
    const w = parseMeasurement(largeur);
    if (!w.ok) return setError(`Largeur : ${w.error}`);

    if (mode === 'surface') {
      const calc = computeQuickCalc({ mode: 'surface', longueur: l.meters, largeur: w.meters });
      if (!calc.ok) return setError(calc.errors.map((e) => e.message).join('\n'));
      setResult(calc.value);
      addHistoryEntry({ mode: 'surface', longueur: l.meters, largeur: w.meters }, calc.value);
      return;
    }

    const h = parseMeasurement(hauteur);
    if (!h.ok) return setError(`Épaisseur/hauteur : ${h.error}`);

    if (mode === 'volumeSimple') {
      const calc = computeQuickCalc({ mode: 'volumeSimple', longueur: l.meters, largeur: w.meters, epaisseur: h.meters });
      if (!calc.ok) return setError(calc.errors.map((e) => e.message).join('\n'));
      setResult(calc.value);
      addHistoryEntry({ mode: 'volumeSimple', longueur: l.meters, largeur: w.meters, epaisseur: h.meters }, calc.value);
      return;
    }

    const calc = computeQuickCalc({ mode, longueur: l.meters, largeur: w.meters, hauteur: h.meters });
    if (!calc.ok) return setError(calc.errors.map((e) => e.message).join('\n'));
    setResult(calc.value);
    addHistoryEntry({ mode, longueur: l.meters, largeur: w.meters, hauteur: h.meters }, calc.value);
  }

  return (
    <Screen>
      <View style={styles.pillRow}>
        {MODES.map((m) => (
          <Pill key={m.key} label={m.label} active={mode === m.key} onPress={() => { setMode(m.key); setResult(null); setError(null); }} />
        ))}
      </View>

      {(mode === 'volumeSimple' || mode === 'dalleSurface' || mode === 'volume' || mode === 'surface') && (
        <>
          <MeasurementField label="Longueur (L)" value={longueur} onChangeValue={setLongueur} />
          <MeasurementField label="Largeur (l)" value={largeur} onChangeValue={setLargeur} />
          {mode !== 'surface' && (
            <MeasurementField
              label={mode === 'volumeSimple' ? 'Épaisseur (e)' : 'Hauteur (H)'}
              value={hauteur}
              onChangeValue={setHauteur}
            />
          )}
        </>
      )}

      {mode === 'conversion' && (
        <>
          <MeasurementField label="Valeur" value={convValue} onChangeValue={setConvValue} placeholder="ex: 12.5" />
          <Text style={{ color: colors.textMuted }}>De :</Text>
          <View style={styles.pillRow}>
            {UNITS.map((u) => (
              <Pill key={u} label={u} active={convFrom === u} onPress={() => setConvFrom(u)} />
            ))}
          </View>
          <Text style={{ color: colors.textMuted }}>Vers :</Text>
          <View style={styles.pillRow}>
            {UNITS.map((u) => (
              <Pill key={u} label={u} active={convTo === u} onPress={() => setConvTo(u)} />
            ))}
          </View>
        </>
      )}

      {mode === 'additionVolumes' && (
        <View style={{ gap: spacing.sm }}>
          {volumeRows.map((row, index) => (
            <MeasurementField
              key={index}
              label={`Volume ${index + 1} (m³)`}
              value={row}
              onChangeValue={(v) => setVolumeRows((rows) => rows.map((r, i) => (i === index ? v : r)))}
              placeholder="ex: 2.5"
            />
          ))}
          <Button label="+ Ajouter un volume" variant="secondary" onPress={() => setVolumeRows((rows) => [...rows, ''])} />
        </View>
      )}

      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

      <Button label="Calculer" onPress={calculer} big />

      {result ? (
        <View style={[styles.resultBox, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>Résultat</Text>
          <Text style={{ color: colors.primary, fontSize: typography.sizes.xl, fontWeight: '700' }}>
            {resultLabel()}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resultBox: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
});
