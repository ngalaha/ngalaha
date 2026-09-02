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
    const project = await createProject(newName.trim());
    setNewName('');
    refresh();
    navigation.navigate('ProjetDetail', { projectId: project.id });
  }

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: '700' }}>📁 Mes projets</Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="Nom du projet (ex: Villa Nkolbisson)"
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
          <View
            key={project.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radius.lg,
                shadowColor: colors.cardShadow,
              },
            ]}
          >
            <Text
              onPress={() => navigation.navigate('ProjetDetail', { projectId: project.id })}
              style={{ color: colors.text, fontWeight: '700', fontSize: typography.sizes.md }}
            >
              🏗️ {project.name}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: typography.sizes.sm }}>
              {project.wallCount} mur(s) • {project.totalBlocks} bloc(s) à commander
            </Text>
            <View style={[styles.row, { borderTopColor: colors.border }]}>
              <Text onPress={() => navigation.navigate('ProjetDetail', { projectId: project.id })} style={{ color: colors.primary, fontWeight: '600' }}>
                Ouvrir
              </Text>
              <Text onPress={async () => { await duplicateProject(project.id); refresh(); }} style={{ color: colors.secondary, fontWeight: '600' }}>
                Dupliquer
              </Text>
              <Text onPress={async () => { await deleteProject(project.id); refresh(); }} style={{ color: colors.danger, fontWeight: '600' }}>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 20,
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
});
