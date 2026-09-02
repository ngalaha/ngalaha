import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Pill } from '../components/Pill';
import { useTheme } from '../styles/ThemeContext';
import { listConcreteElements, listPanelElements, getProject } from '../storage/projects';
import { saveOrder } from '../storage/orders';
import { buildQuantityResult } from '../calculationEngine/quantity';
import { CONCRETE_ELEMENT_LABELS } from '../calculationEngine/concrete';
import { PANEL_MATERIAL_LABELS } from '../calculationEngine/panels';
import { formatNumber } from '../calculationEngine/format';
import { LOSS_MARGIN_PRESETS, ORDER_ROUNDING_PRESETS, type OrderLine } from '../models/Order';
import type { RoundingRule } from '../calculationEngine/types';
import { generateOrderPdf } from '../export/pdf';
import { writeOrderCsvFile } from '../export/csv';
import { shareFile } from '../export/share';

type Props = NativeStackScreenProps<RootStackParamList, 'Commandes'>;

export function CommandesScreen({ route }: Props) {
  const { colors, spacing, typography, radius } = useTheme();
  const projectId = route.params?.projectId;

  const [orderName, setOrderName] = useState('Commande');
  const [marginPercent, setMarginPercent] = useState<number>(5);
  const [rounding, setRounding] = useState<RoundingRule>(ORDER_ROUNDING_PRESETS[1].rule);
  const [baseVolumes, setBaseVolumes] = useState<{ id: string; description: string; exact: number }[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const project = await getProject(projectId);
      if (project) setOrderName(`Commande — ${project.name}`);

      const [concreteItems, panelItems] = await Promise.all([
        listConcreteElements(projectId),
        listPanelElements(projectId),
      ]);

      const concreteLines = concreteItems.map((el) => ({
        id: el.id,
        description: `${CONCRETE_ELEMENT_LABELS[el.input.type]}${el.input.label ? ` — ${el.input.label}` : ''}`,
        exact: el.volume,
      }));
      setBaseVolumes(concreteLines);

      if (panelItems.length > 0) {
        setStatus(
          `Note : ${panelItems.length} calcul(s) de panneaux (${panelItems
            .map((p) => `${PANEL_MATERIAL_LABELS[p.input.materialType]}: ${p.result.recommended}`)
            .join(', ')}) déjà arrondis, à commander séparément.`
        );
      }
    })();
  }, [projectId]);

  const lines: OrderLine[] = useMemo(
    () =>
      baseVolumes.map((v) => ({
        id: v.id,
        description: v.description,
        result: buildQuantityResult(v.exact, 'm³', marginPercent, rounding),
        notes: notes[v.id],
      })),
    [baseVolumes, marginPercent, rounding, notes]
  );

  function addManualLine() {
    setBaseVolumes((prev) => [...prev, { id: `manuel-${Date.now()}`, description: 'Élément manuel', exact: 0 }]);
  }

  function updateManualDescription(id: string, description: string) {
    setBaseVolumes((prev) => prev.map((v) => (v.id === id ? { ...v, description } : v)));
  }

  function updateManualVolume(id: string, raw: string) {
    const value = parseFloat(raw.replace(',', '.'));
    setBaseVolumes((prev) => prev.map((v) => (v.id === id ? { ...v, exact: Number.isFinite(value) ? value : 0 } : v)));
  }

  async function buildOrder() {
    return saveOrder({ projectId, name: orderName, marginPercent, rounding, lines });
  }

  async function exporterPdf() {
    setStatus(null);
    const order = await buildOrder();
    const uri = await generateOrderPdf(order);
    await shareFile(uri, 'application/pdf', 'Partager la commande (PDF)');
  }

  async function exporterCsv() {
    setStatus(null);
    const order = await buildOrder();
    const uri = writeOrderCsvFile(order);
    await shareFile(uri, 'text/csv', 'Partager la commande (CSV)');
  }

  const totalRecommended = lines.reduce((sum, l) => sum + l.result.recommended, 0);

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700' }}>
        Préparation de commande
      </Text>

      <TextInput
        value={orderName}
        onChangeText={setOrderName}
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md }]}
      />

      <Text style={{ color: colors.textMuted }}>Marge de perte</Text>
      <View style={styles.pillRow}>
        {LOSS_MARGIN_PRESETS.map((p) => (
          <Pill key={p} label={`${p}%`} active={marginPercent === p} onPress={() => setMarginPercent(p)} />
        ))}
      </View>

      <Text style={{ color: colors.textMuted }}>Arrondi de commande (m³)</Text>
      <View style={styles.pillRow}>
        {ORDER_ROUNDING_PRESETS.map((p) => (
          <Pill
            key={p.label}
            label={p.label}
            active={rounding.type === 'step' && p.rule.type === 'step' && rounding.step === p.rule.step}
            onPress={() => setRounding(p.rule)}
          />
        ))}
      </View>

      <Text style={{ color: colors.text, fontWeight: '700' }}>Lignes de commande</Text>
      {lines.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>Aucune ligne. Ajoutez un élément manuel ci-dessous.</Text>
      ) : (
        lines.map((line, index) => (
          <View key={line.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            {baseVolumes[index]?.id.startsWith('manuel-') ? (
              <>
                <TextInput
                  value={baseVolumes[index].description}
                  onChangeText={(v) => updateManualDescription(line.id, v)}
                  style={[styles.inputSmall, { borderColor: colors.border, color: colors.text }]}
                />
                <TextInput
                  value={String(baseVolumes[index].exact || '')}
                  onChangeText={(v) => updateManualVolume(line.id, v)}
                  placeholder="Volume exact (m³)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={[styles.inputSmall, { borderColor: colors.border, color: colors.text }]}
                />
              </>
            ) : (
              <Text style={{ color: colors.text }}>{line.description}</Text>
            )}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              {formatNumber(line.result.recommended, 3)} m³ à commander
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>
              théorique {formatNumber(line.result.exact, 3)} — avec marge {formatNumber(line.result.withMargin, 3)}
            </Text>
            <TextInput
              value={notes[line.id] ?? ''}
              onChangeText={(v) => setNotes((prev) => ({ ...prev, [line.id]: v }))}
              placeholder="Note (optionnel)"
              placeholderTextColor={colors.textMuted}
              style={[styles.inputSmall, { borderColor: colors.border, color: colors.text }]}
            />
          </View>
        ))
      )}

      <Button label="+ Ajouter une ligne manuelle" variant="secondary" onPress={addManualLine} />

      <View style={[styles.resultBox, { backgroundColor: colors.surfaceAlt }]}>
        <Text style={{ color: colors.textMuted }}>Total à commander</Text>
        <Text style={{ color: colors.primary, fontSize: typography.sizes.xl, fontWeight: '700' }}>
          {formatNumber(totalRecommended, 3)} m³
        </Text>
      </View>

      {status ? <Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>{status}</Text> : null}

      <View style={styles.pillRow}>
        <Button label="Exporter PDF" onPress={exporterPdf} />
        <Button label="Exporter CSV" variant="secondary" onPress={exporterCsv} />
      </View>
    </Screen>
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
    fontWeight: '700',
  },
  inputSmall: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  card: {
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  resultBox: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
});
