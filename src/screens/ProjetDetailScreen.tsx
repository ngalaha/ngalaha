import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { useTheme } from '../styles/ThemeContext';
import {
  deleteConcreteElement,
  deletePanelElement,
  getProject,
  listConcreteElements,
  listPanelElements,
} from '../storage/projects';
import type { Project } from '../models/Project';
import type { ConcreteElement } from '../models/ConcreteElement';
import type { PanelElement } from '../models/PanelElement';
import { CONCRETE_ELEMENT_LABELS } from '../calculationEngine/concrete';
import { PANEL_MATERIAL_LABELS } from '../calculationEngine/panels';
import { formatM3 } from '../calculationEngine/format';

type Props = NativeStackScreenProps<RootStackParamList, 'ProjetDetail'>;

export function ProjetDetailScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const { colors, typography, radius } = useTheme();
  const [project, setProject] = useState<Project | undefined>();
  const [concreteElements, setConcreteElements] = useState<ConcreteElement[]>([]);
  const [panelElements, setPanelElements] = useState<PanelElement[]>([]);

  const refresh = useCallback(() => {
    getProject(projectId).then(setProject);
    listConcreteElements(projectId).then(setConcreteElements);
    listPanelElements(projectId).then(setPanelElements);
  }, [projectId]);

  useFocusEffect(refresh);

  const totalVolume = concreteElements.reduce((sum, el) => sum + el.volume, 0);

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700' }}>
        {project?.name ?? 'Projet'}
      </Text>

      <View style={styles.actionsRow}>
        <Button label="+ Béton" onPress={() => navigation.navigate('Beton', { projectId })} variant="secondary" />
        <Button label="+ Panneaux" onPress={() => navigation.navigate('Panneaux', { projectId })} variant="secondary" />
        <Button label="Commande" onPress={() => navigation.navigate('Commandes', { projectId })} />
      </View>

      <View style={[styles.resultBox, { backgroundColor: colors.surfaceAlt }]}>
        <Text style={{ color: colors.textMuted }}>Volume béton total</Text>
        <Text style={{ color: colors.primary, fontSize: typography.sizes.xl, fontWeight: '700' }}>
          {formatM3(totalVolume)}
        </Text>
      </View>

      <Text style={{ color: colors.text, fontWeight: '700' }}>Éléments béton</Text>
      {concreteElements.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>Aucun élément béton.</Text>
      ) : (
        concreteElements.map((el) => (
          <View key={el.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            <View>
              <Text style={{ color: colors.text }}>{CONCRETE_ELEMENT_LABELS[el.input.type]}</Text>
              <Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>{el.category}</Text>
            </View>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{formatM3(el.volume)}</Text>
            <Text onPress={async () => { await deleteConcreteElement(el.id); refresh(); }} style={{ color: colors.danger }}>
              ✕
            </Text>
          </View>
        ))
      )}

      <Text style={{ color: colors.text, fontWeight: '700' }}>Panneaux</Text>
      {panelElements.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>Aucun calcul de panneaux.</Text>
      ) : (
        panelElements.map((el) => (
          <View key={el.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            <View>
              <Text style={{ color: colors.text }}>{PANEL_MATERIAL_LABELS[el.input.materialType]}</Text>
              <Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>{el.input.format.label}</Text>
            </View>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{el.result.recommended} pan.</Text>
            <Text onPress={async () => { await deletePanelElement(el.id); refresh(); }} style={{ color: colors.danger }}>
              ✕
            </Text>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
  },
});
