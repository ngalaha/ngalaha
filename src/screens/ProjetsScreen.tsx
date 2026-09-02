import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { useTheme } from '../styles/ThemeContext';
import { createProject, deleteProject, duplicateProject, getProjectSummaries } from '../storage/projects';
import type { ProjectSummary } from '../models/Project';
import { formatM3 } from '../calculationEngine/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Projets'>;

export function ProjetsScreen({ navigation }: Props) {
  const { colors, spacing, typography, radius } = useTheme();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [newName, setNewName] = useState('');

  const refresh = useCallback(() => {
    getProjectSummaries().then(setProjects);
  }, []);

  useFocusEffect(refresh);

  async function creerProjet() {
    if (!newName.trim()) return;
    await createProject(newName.trim());
    setNewName('');
    refresh();
  }

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700' }}>Mes projets</Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="Nom du nouveau projet"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { flex: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md },
          ]}
        />
        <Button label="Créer" onPress={creerProjet} />
      </View>

      {projects.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>Aucun projet pour l'instant. Créez-en un ci-dessus.</Text>
      ) : (
        projects.map((project) => (
          <View key={project.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
            <Text
              onPress={() => navigation.navigate('ProjetDetail', { projectId: project.id })}
              style={{ color: colors.text, fontWeight: '700', fontSize: typography.sizes.md }}
            >
              {project.name}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>
              {project.concreteElementCount} élément(s) béton • {project.panelElementCount} panneau(x) • {formatM3(project.totalConcreteVolume)}
            </Text>
            <View style={styles.row}>
              <Text onPress={() => navigation.navigate('ProjetDetail', { projectId: project.id })} style={{ color: colors.primary }}>
                Ouvrir
              </Text>
              <Text onPress={async () => { await duplicateProject(project.id); refresh(); }} style={{ color: colors.secondary }}>
                Dupliquer
              </Text>
              <Text onPress={async () => { await deleteProject(project.id); refresh(); }} style={{ color: colors.danger }}>
                Supprimer
              </Text>
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  card: {
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
});
