import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAdminPinGate } from '@/components/AdminPinGate';
import PrimaryButton from '@/components/PrimaryButton';
import { deleteBuilding, listBuildings } from '@/database/projectsRepository';
import { useAuth } from '@/hooks/useAuth';
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
  const ok = configured && !hasError;
  return (
    <View style={styles.buildingRow}>
      <View style={{ flex: 1 }}>
        <View style={styles.buildingNameRow}>
          <Ionicons name={ok ? 'checkmark-circle' : 'alert-circle'} size={16} color={ok ? colors.success : colors.warning} />
          <Text style={typography.bodyBold}>{building.name}</Text>
        </View>
        <Text style={[styles.status, { color: ok ? colors.success : colors.warning }]}>
          {ok
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
  const { projects, renameProject, removeProject } = useProjects();
  const { account } = useAuth();
  const { requireAdmin, promptPinChange, promptElement } = useAdminPinGate();

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        <PrimaryButton
          label="+ Ajouter un projet"
          onPress={() => requireAdmin(() => navigation.navigate('AdminNewProject'))}
          style={{ marginBottom: 24 }}
        />

        {projects.map((project) => (
          <ProjectSection
            key={project.id}
            projectId={project.id}
            projectName={project.name}
            requireAdmin={requireAdmin}
            onRenameProject={(name) => renameProject(project.id, name)}
            onAddBuilding={() => navigation.navigate('AdminNewBuilding', { projectId: project.id })}
            onEditBuilding={(buildingId) =>
              navigation.navigate('AdminBuildingEdit', { buildingId, projectId: project.id })
            }
            onDeleteProject={() =>
              Alert.alert('Supprimer le projet', `Supprimer "${project.name}" et tous ses bâtiments ?`, [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: () => requireAdmin(() => removeProject(project.id)) },
              ])
            }
          />
        ))}

        <View style={styles.section}>
          <Text style={typography.h2}>SÉCURITÉ</Text>
          <View style={styles.securityRow}>
            <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.securityText} numberOfLines={1}>
              {account ? `Connecté : ${account.username}` : 'Aucun compte Microsoft connecté'}
            </Text>
          </View>
          <Text onPress={promptPinChange} style={[styles.link, { marginTop: 12 }]}>
            Changer le code PIN administrateur
          </Text>
        </View>

        <Text onPress={() => navigation.navigate('Diagnostics')} style={styles.diagnosticsLink}>
          <Ionicons name="construct-outline" size={14} color={colors.textSecondary} /> Diagnostic technique
        </Text>

        <Text onPress={() => navigation.navigate('About')} style={styles.credit}>
          MA2D Construction — Application développée par Pierre NGALAHA
        </Text>
      </ScrollView>
      {promptElement}
    </>
  );
}

function ProjectSection({
  projectId,
  projectName,
  requireAdmin,
  onRenameProject,
  onAddBuilding,
  onEditBuilding,
  onDeleteProject,
}: {
  projectId: string;
  projectName: string;
  requireAdmin: (action: () => void) => void;
  onRenameProject: (name: string) => void;
  onAddBuilding: () => void;
  onEditBuilding: (buildingId: string) => void;
  onDeleteProject: () => void;
}) {
  const { buildings, refresh } = useProjectBuildings(projectId);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(projectName);

  const onDeleteBuilding = (buildingId: string, name: string) => {
    Alert.alert('Supprimer', `Supprimer ${name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          requireAdmin(() => {
            // Deletes and refreshes this section's own list directly — this
            // screen renders every project's buildings, not just the one
            // "selected" project useProjects() tracks for the Home screen,
            // so it must not depend on that hook's (differently-scoped) state.
            deleteBuilding(buildingId);
            refresh();
          }),
      },
    ]);
  };

  const saveRename = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== projectName) onRenameProject(trimmed);
    setRenaming(false);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {renaming ? (
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            autoFocus
            style={styles.renameInput}
            onSubmitEditing={saveRename}
          />
        ) : (
          <Text style={typography.h2}>{projectName.toUpperCase()}</Text>
        )}
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {renaming ? (
            <Text onPress={saveRename} style={styles.link}>
              Enregistrer
            </Text>
          ) : (
            <Text
              onPress={() => {
                setNameDraft(projectName);
                setRenaming(true);
              }}
              style={styles.link}
            >
              Renommer
            </Text>
          )}
          <Text onPress={onDeleteProject} style={[styles.link, { color: colors.danger }]}>
            Supprimer
          </Text>
        </View>
      </View>
      {buildings.map((b) => (
        <BuildingRow
          key={b.id}
          building={b}
          onEdit={() => onEditBuilding(b.id)}
          onDelete={() => onDeleteBuilding(b.id, b.name)}
        />
      ))}
      <Text onPress={() => requireAdmin(onAddBuilding)} style={styles.addBuilding}>
        + Ajouter un bâtiment
      </Text>
    </View>
  );
}

// Small local hook: re-reads buildings for one project (Admin screen lists all projects,
// while useProjects() only tracks a single "selected" project's buildings).
function useProjectBuildings(projectId: string) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const refresh = useCallback(() => {
    setBuildings(listBuildings(projectId));
  }, [projectId]);
  useFocusEffect(refresh);
  return { buildings, refresh };
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
  renameInput: {
    flex: 1,
    ...typography.h2,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 2,
    marginRight: 12,
  },
  buildingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  buildingNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  status: { fontSize: 13, marginTop: 2 },
  link: { color: colors.primary, fontWeight: '700' },
  securityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  securityText: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  addBuilding: { color: colors.primary, fontWeight: '700', marginTop: 12 },
  credit: { textAlign: 'center', color: colors.textSecondary, opacity: 0.6, fontSize: 12, marginBottom: 24 },
  diagnosticsLink: { textAlign: 'center', color: colors.textSecondary, marginTop: 12, marginBottom: 12 },
});
