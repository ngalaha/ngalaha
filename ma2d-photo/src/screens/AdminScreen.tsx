import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTranslation } from '@/i18n/I18nContext';
import { LOCALES } from '@/i18n/languages';
import { userMessage } from '@/utils/errorMessages';
import { useAdminPinGate } from '@/components/AdminPinGate';
import PrimaryButton from '@/components/PrimaryButton';
import { deleteBuilding, listBuildings } from '@/database/projectsRepository';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { RootStackParamList } from '@/navigation/types';
import {
  getSyncState,
  getWorkspaceFolder,
  subscribeSync,
  syncSoon,
} from '@/services/sync/configSyncService';
import { ThemeColors } from '@/theme/colors';
import { useTheme, useThemedStyles } from '@/theme/ThemeContext';
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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
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
            ? t('admin.building.connected')
            : hasError
              ? userMessage(building.photoFolder.lastError!)
              : t('admin.building.notConfigured')}
        </Text>
      </View>
      <Text onPress={onEdit} style={styles.link}>
        {t('admin.edit')}
      </Text>
      <Text onPress={onDelete} style={[styles.link, { color: colors.danger }]}>
        {t('admin.deleteShort')}
      </Text>
    </View>
  );
}

export default function AdminScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, language } = useTranslation();
  const { projects, renameProject, removeProject, refresh: refreshProjects } = useProjects();
  const { account } = useAuth();
  const { requireAdmin, promptPinChange, promptElement } = useAdminPinGate();
  const [workspace, setWorkspace] = useState(() => ({
    folder: getWorkspaceFolder(),
    state: getSyncState(),
  }));

  // A sync can replace every project and building under this screen, so
  // follow it rather than showing what was there before it ran.
  useEffect(
    () =>
      subscribeSync(() => {
        setWorkspace({ folder: getWorkspaceFolder(), state: getSyncState() });
        refreshProjects();
      }),
    [refreshProjects]
  );

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        <PrimaryButton
          label={t('admin.addProject')}
          onPress={() => requireAdmin(() => navigation.navigate('AdminNewProject'))}
          style={{ marginBottom: 24 }}
        />

        {projects.map((project) => (
          <ProjectSection
            key={project.id}
            projectId={project.id}
            projectName={project.name}
            requireAdmin={requireAdmin}
            onRenameProject={(name) => {
              renameProject(project.id, name);
              syncSoon(true);
            }}
            onAddBuilding={() => navigation.navigate('AdminNewBuilding', { projectId: project.id })}
            onEditBuilding={(buildingId) =>
              navigation.navigate('AdminBuildingEdit', { buildingId, projectId: project.id })
            }
            onDeleteProject={() =>
              Alert.alert(
                t('admin.deleteProject.title'),
                t('admin.deleteProject.body', { name: project.name }),
                [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('common.delete'),
                  style: 'destructive',
                  onPress: () =>
                    requireAdmin(() => {
                      removeProject(project.id);
                      syncSoon(true);
                    }),
                },
                ]
              )
            }
          />
        ))}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={typography.h2}>{t('admin.workspace.section')}</Text>
            <Text onPress={() => requireAdmin(() => navigation.navigate('AdminWorkspace'))} style={styles.link}>
              {t('admin.workspace.configure')}
            </Text>
          </View>
          <View style={styles.securityRow}>
            <Ionicons
              name={workspace.folder?.itemId ? 'checkmark-circle' : 'alert-circle'}
              size={16}
              color={workspace.folder?.itemId ? colors.success : colors.warning}
            />
            <Text style={styles.securityText} numberOfLines={1}>
              {workspace.folder?.itemId
                ? t('admin.workspace.folder', { name: workspace.folder.itemName ?? '' })
                : t('admin.workspace.none')}
            </Text>
          </View>
          {workspace.folder?.itemId && (
            <Text style={styles.securityText}>
              {t('admin.workspace.lastSync', {
                when: workspace.state.lastSyncedAt
                  ? new Date(workspace.state.lastSyncedAt).toLocaleString(LOCALES[language])
                  : t('admin.workspace.never'),
              })}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={typography.h2}>{t('admin.security.section')}</Text>
          <View style={styles.securityRow}>
            <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.securityText} numberOfLines={1}>
              {account
                ? t('admin.security.signedIn', { user: account.username })
                : t('admin.security.noAccount')}
            </Text>
          </View>
          <Text onPress={promptPinChange} style={[styles.link, { marginTop: 12 }]}>
            {t('admin.security.changePin')}
          </Text>
        </View>

        <Text onPress={() => navigation.navigate('Diagnostics')} style={styles.diagnosticsLink}>
          <Ionicons name="construct-outline" size={14} color={colors.textSecondary} /> {t('admin.diagnosticsLink')}
        </Text>

        <Text onPress={() => navigation.navigate('About')} style={styles.credit}>
          {t('admin.credit')}
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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { buildings, refresh } = useProjectBuildings(projectId);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(projectName);

  const onDeleteBuilding = (buildingId: string, name: string) => {
    Alert.alert(t('admin.deleteBuilding.title'), t('admin.deleteBuilding.body', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          requireAdmin(() => {
            // Deletes and refreshes this section's own list directly — this
            // screen renders every project's buildings, not just the one
            // "selected" project useProjects() tracks for the Home screen,
            // so it must not depend on that hook's (differently-scoped) state.
            deleteBuilding(buildingId);
            refresh();
            syncSoon(true);
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
              {t('common.save')}
            </Text>
          ) : (
            <Text
              onPress={() => {
                setNameDraft(projectName);
                setRenaming(true);
              }}
              style={styles.link}
            >
              {t('admin.rename')}
            </Text>
          )}
          <Text onPress={onDeleteProject} style={[styles.link, { color: colors.danger }]}>
            {t('common.delete')}
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
        {t('admin.addBuilding')}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
