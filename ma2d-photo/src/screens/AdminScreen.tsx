import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '@/components/PrimaryButton';
import { listBuildings } from '@/database/projectsRepository';
import { useProjects } from '@/hooks/useProjects';
import { RootStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Building } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>;

function BuildingRow({
  building,
  onEdit,
  onDelete,
}: {
  building: Building;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const configured = !!building.photoFolder.itemId;
  const hasError = !!building.photoFolder.lastError;
  return (
    <View style={styles.buildingRow}>
      <View style={{ flex: 1 }}>
        <Text style={typography.bodyBold}>
          {configured && !hasError ? '✓' : '⚠'} {building.name}
        </Text>
        <Text style={[styles.status, { color: configured && !hasError ? colors.success : colors.warning }]}>
          {configured && !hasError
            ? 'OneDrive connecté'
            : hasError
              ? building.photoFolder.lastError
              : 'Dossier non configuré'}
        </Text>
      </View>
      <Text onPress={onEdit} style={styles.link}>
        Modifier
      </Text>
      <Text onPress={onDelete} style={[styles.link, { color: colors.danger }]}>
        Suppr.
      </Text>
    </View>
  );
}

export default function AdminScreen({ navigation }: Props) {
  const { projects, removeProject, removeBuilding } = useProjects();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <PrimaryButton
        label="+ Ajouter un projet"
        onPress={() => navigation.navigate('AdminNewProject')}
        style={{ marginBottom: 24 }}
      />

      {projects.map((project) => (
        <ProjectSection
          key={project.id}
          projectId={project.id}
          projectName={project.name}
          onAddBuilding={() => navigation.navigate('AdminNewBuilding', { projectId: project.id })}
          onEditBuilding={(buildingId) =>
            navigation.navigate('AdminBuildingEdit', { buildingId, projectId: project.id })
          }
          onDeleteBuilding={(buildingId, name) =>
            Alert.alert('Supprimer', `Supprimer ${name} ?`, [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: () => removeBuilding(buildingId) },
            ])
          }
          onDeleteProject={() =>
            Alert.alert('Supprimer le projet', `Supprimer "${project.name}" et tous ses bâtiments ?`, [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: () => removeProject(project.id) },
            ])
          }
        />
      ))}

      <Text onPress={() => navigation.navigate('Diagnostics')} style={styles.diagnosticsLink}>
        🛠 Diagnostic technique
      </Text>
    </ScrollView>
  );
}

function ProjectSection({
  projectId,
  projectName,
  onAddBuilding,
  onEditBuilding,
  onDeleteBuilding,
  onDeleteProject,
}: {
  projectId: string;
  projectName: string;
  onAddBuilding: () => void;
  onEditBuilding: (buildingId: string) => void;
  onDeleteBuilding: (buildingId: string, name: string) => void;
  onDeleteProject: () => void;
}) {
  const { buildings } = useProjectBuildings(projectId);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={typography.h2}>{projectName.toUpperCase()}</Text>
        <Text onPress={onDeleteProject} style={[styles.link, { color: colors.danger }]}>
          Supprimer le projet
        </Text>
      </View>
      {buildings.map((b) => (
        <BuildingRow
          key={b.id}
          building={b}
          onEdit={() => onEditBuilding(b.id)}
          onDelete={() => onDeleteBuilding(b.id, b.name)}
        />
      ))}
      <Text onPress={onAddBuilding} style={styles.addBuilding}>
        + Ajouter un bâtiment
      </Text>
    </View>
  );
}

// Small local hook: re-reads buildings for one project (Admin screen lists all projects,
// while useProjects() only tracks a single "selected" project's buildings).
function useProjectBuildings(projectId: string) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  useFocusEffect(
    useCallback(() => {
      setBuildings(listBuildings(projectId));
    }, [projectId])
  );
  return { buildings };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  buildingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  status: { fontSize: 13, marginTop: 2 },
  link: { color: colors.primary, fontWeight: '700' },
  addBuilding: { color: colors.primary, fontWeight: '700', marginTop: 12 },
  diagnosticsLink: { textAlign: 'center', color: colors.textSecondary, marginTop: 12, marginBottom: 40 },
});
