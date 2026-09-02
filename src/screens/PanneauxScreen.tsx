import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Screen } from '../components/Screen';
import { MeasurementField } from '../components/MeasurementField';
import { Button } from '../components/Button';
import { Pill } from '../components/Pill';
import { useTheme } from '../styles/ThemeContext';
import { PANEL_MATERIALS } from '../materials/panels';
import { DEFAULT_PANEL_LOSS_MARGIN_PERCENT, LOSS_MARGIN_PRESETS } from '../materials/defaults';
import {
  STANDARD_PANEL_FORMATS,
  computePanelCount,
  type PanelFormat,
  type PanelMaterialType,
} from '../calculationEngine/panels';
import { rectangleArea } from '../calculationEngine/surfaces';
import { parseMeasurement } from '../calculationEngine/measurementParser';
import { formatM2 } from '../calculationEngine/format';
import type { QuantityResult } from '../calculationEngine/types';
import { createProject, savePanelElement } from '../storage/projects';

type Props = NativeStackScreenProps<RootStackParamList, 'Panneaux'>;

const FORMAT_KEYS = Object.keys(STANDARD_PANEL_FORMATS);

export function PanneauxScreen({ route }: Props) {
  const { colors, typography } = useTheme();
  const [materialType, setMaterialType] = useState<PanelMaterialType>('contreplaque');
  const [formatKey, setFormatKey] = useState(FORMAT_KEYS[0]);
  const [customLargeur, setCustomLargeur] = useState('');
  const [customLongueur, setCustomLongueur] = useState('');
  const [zoneLongueur, setZoneLongueur] = useState('');
  const [zoneLargeur, setZoneLargeur] = useState('');
  const [margin, setMargin] = useState<number>(DEFAULT_PANEL_LOSS_MARGIN_PERCENT);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuantityResult | null>(null);
  const [lastFormat, setLastFormat] = useState<PanelFormat | null>(null);
  const [lastSurface, setLastSurface] = useState<number>(0);
  const [saved, setSaved] = useState(false);

  const isCustom = formatKey === 'custom';

  function resolveFormat(): PanelFormat | null {
    if (!isCustom) return STANDARD_PANEL_FORMATS[formatKey];
    const l = parseMeasurement(customLargeur);
    const len = parseMeasurement(customLongueur);
    if (!l.ok || !len.ok) return null;
    return { label: 'Personnalisé', largeur: l.meters, longueur: len.meters };
  }

  function calculer() {
    setError(null);
    setResult(null);
    setSaved(false);

    const l = parseMeasurement(zoneLongueur);
    if (!l.ok) return setError(`Longueur de la surface : ${l.error}`);
    const w = parseMeasurement(zoneLargeur);
    if (!w.ok) return setError(`Largeur de la surface : ${w.error}`);

    let format: PanelFormat;
    if (isCustom) {
      const pl = parseMeasurement(customLargeur);
      if (!pl.ok) return setError(`Largeur du panneau : ${pl.error}`);
      const plen = parseMeasurement(customLongueur);
      if (!plen.ok) return setError(`Longueur du panneau : ${plen.error}`);
      format = { label: 'Personnalisé', largeur: pl.meters, longueur: plen.meters };
    } else {
      format = STANDARD_PANEL_FORMATS[formatKey];
    }

    const surfaceTotale = rectangleArea(l.meters, w.meters);
    const calc = computePanelCount({ materialType, surfaceTotale, format, marginPercent: margin });
    if (!calc.ok) return setError(calc.errors.map((e) => e.message).join('\n'));

    setResult(calc.value);
    setLastFormat(format);
    setLastSurface(surfaceTotale);
  }

  async function enregistrer() {
    if (!result || !lastFormat) return;
    let projectId = route.params?.projectId;
    if (!projectId) {
      const project = await createProject(`Panneaux ${new Date().toLocaleDateString('fr-CA')}`);
      projectId = project.id;
    }

    await savePanelElement({
      projectId,
      category: 'Panneaux',
      input: { materialType, surfaceTotale: lastSurface, format: lastFormat, marginPercent: margin },
      result,
    });
    setSaved(true);
  }

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700' }}>
        Calculateur Panneaux
      </Text>

      <View style={styles.pillRow}>
        {PANEL_MATERIALS.map((m) => (
          <Pill key={m.type} label={m.label} active={materialType === m.type} onPress={() => setMaterialType(m.type)} />
        ))}
      </View>

      <Text style={{ color: colors.textMuted }}>Format du panneau</Text>
      <View style={styles.pillRow}>
        {FORMAT_KEYS.map((key) => (
          <Pill key={key} label={STANDARD_PANEL_FORMATS[key].label} active={formatKey === key} onPress={() => setFormatKey(key)} />
        ))}
        <Pill label="Personnalisé" active={isCustom} onPress={() => setFormatKey('custom')} />
      </View>

      {isCustom && (
        <>
          <MeasurementField label="Largeur du panneau" value={customLargeur} onChangeValue={setCustomLargeur} />
          <MeasurementField label="Longueur du panneau" value={customLongueur} onChangeValue={setCustomLongueur} />
        </>
      )}

      <Text style={{ color: colors.textMuted }}>Surface à couvrir</Text>
      <MeasurementField label="Longueur de la surface" value={zoneLongueur} onChangeValue={setZoneLongueur} />
      <MeasurementField label="Largeur de la surface" value={zoneLargeur} onChangeValue={setZoneLargeur} />

      <Text style={{ color: colors.textMuted }}>Marge de perte</Text>
      <View style={styles.pillRow}>
        {LOSS_MARGIN_PRESETS.map((p) => (
          <Pill key={p} label={`${p}%`} active={margin === p} onPress={() => setMargin(p)} />
        ))}
      </View>

      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

      <Button label="Calculer" onPress={calculer} big />

      {result ? (
        <View style={[styles.resultBox, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={{ color: colors.textMuted }}>Surface : {formatM2(lastSurface)}</Text>
          <Text style={{ color: colors.primary, fontSize: typography.sizes.xl, fontWeight: '700' }}>
            {result.recommended} panneaux
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>
            Théorique : {result.exact.toFixed(3)} — avec marge : {result.withMargin.toFixed(3)}
          </Text>
          <Button label="Enregistrer dans un projet" variant="secondary" onPress={enregistrer} />
        </View>
      ) : null}

      {saved ? <Text style={{ color: colors.success }}>Enregistré. Consultez l'onglet Projets.</Text> : null}
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
