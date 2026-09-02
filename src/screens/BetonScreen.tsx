import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Pill } from '../components/Pill';
import { useTheme } from '../styles/ThemeContext';
import { CONCRETE_TYPES } from '../materials/concrete';
import { CONCRETE_FIELD_CONFIG } from './betonFieldConfig';
import {
  CONCRETE_ELEMENT_LABELS,
  computeConcreteVolume,
  type ConcreteElementInput,
  type ConcreteElementType,
} from '../calculationEngine/concrete';
import { parseMeasurement } from '../calculationEngine/measurementParser';
import { formatM3 } from '../calculationEngine/format';
import { createProject, saveConcreteElement } from '../storage/projects';

type Props = NativeStackScreenProps<RootStackParamList, 'Beton'>;

interface AddedElement {
  id: string;
  input: ConcreteElementInput;
  volume: number;
}

export function BetonScreen({ route, navigation }: Props) {
  const { colors, spacing, typography } = useTheme();
  const [type, setType] = useState<ConcreteElementType>('semelleFilante');
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [elements, setElements] = useState<AddedElement[]>([]);
  const [projectName, setProjectName] = useState('');
  const [saved, setSaved] = useState(false);

  const fields = CONCRETE_FIELD_CONFIG[type];
  const total = elements.reduce((sum, el) => sum + el.volume, 0);

  function selectType(t: ConcreteElementType) {
    setType(t);
    setValues({});
    setError(null);
  }

  function ajouter() {
    setError(null);
    const dims: Record<string, number> = {};

    for (const field of fields) {
      const raw = values[field.key] ?? '';
      if (field.isMeasurement) {
        const parsed = parseMeasurement(raw);
        if (!parsed.ok) return setError(`${field.label} : ${parsed.error}`);
        dims[field.key] = parsed.meters;
      } else {
        const num = parseFloat(raw.replace(',', '.'));
        if (!Number.isFinite(num)) return setError(`${field.label} : valeur invalide`);
        dims[field.key] = num;
      }
    }

    const input = { type, dims } as unknown as ConcreteElementInput;
    const result = computeConcreteVolume(input);
    if (!result.ok) return setError(result.errors.map((e) => e.message).join('\n'));

    setElements((prev) => [...prev, { id: `${Date.now()}`, input, volume: result.value }]);
    setValues({});
  }

  function retirer(id: string) {
    setElements((prev) => prev.filter((el) => el.id !== id));
  }

  async function enregistrer() {
    if (elements.length === 0) return;
    let projectId = route.params?.projectId;
    if (!projectId) {
      const name = projectName.trim() || `Béton ${new Date().toLocaleDateString('fr-CA')}`;
      const project = await createProject(name);
      projectId = project.id;
    }
    for (const el of elements) {
      await saveConcreteElement({ projectId, category: 'Béton', input: el.input, volume: el.volume });
    }
    setSaved(true);
    setElements([]);
  }

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700' }}>
        Calculateur Béton
      </Text>

      <View style={styles.pillRow}>
        {CONCRETE_TYPES.map((t) => (
          <Pill key={t.type} label={t.label} active={type === t.type} onPress={() => selectType(t.type)} />
        ))}
      </View>

      <View style={{ gap: spacing.sm }}>
        {fields.map((field) => (
          <View key={field.key} style={{ gap: 4 }}>
            <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>{field.label}</Text>
            <TextInput
              value={values[field.key] ?? ''}
              onChangeText={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
              placeholder={field.isMeasurement ? "ex: 12'-6\"" : 'ex: 12'}
              placeholderTextColor={colors.textMuted}
              keyboardType={field.isMeasurement ? 'default' : 'numeric'}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.text,
                backgroundColor: colors.surface,
              }}
            />
          </View>
        ))}
      </View>

      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

      <Button label={`+ Ajouter (${CONCRETE_ELEMENT_LABELS[type]})`} onPress={ajouter} />

      {elements.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Éléments ajoutés</Text>
          {elements.map((el) => (
            <View
              key={el.id}
              style={[styles.row, { backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: spacing.sm }]}
            >
              <Text style={{ color: colors.text }}>{CONCRETE_ELEMENT_LABELS[el.input.type]}</Text>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{formatM3(el.volume)}</Text>
              <Text onPress={() => retirer(el.id)} style={{ color: colors.danger }}>
                ✕
              </Text>
            </View>
          ))}
          <View style={[styles.resultBox, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={{ color: colors.textMuted }}>Volume total</Text>
            <Text style={{ color: colors.primary, fontSize: typography.sizes.xl, fontWeight: '700' }}>
              {formatM3(total)}
            </Text>
          </View>

          {!route.params?.projectId && (
            <TextInput
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Nom du projet (optionnel)"
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.text,
                backgroundColor: colors.surface,
              }}
            />
          )}
          <Button label="Enregistrer dans un projet" variant="secondary" onPress={enregistrer} />
        </View>
      )}

      {saved ? (
        <Text style={{ color: colors.success }}>Enregistré. Consultez l'onglet Projets.</Text>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultBox: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
});
