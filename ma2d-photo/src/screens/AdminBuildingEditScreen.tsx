import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import PrimaryButton from '@/components/PrimaryButton';
import { getBuilding, updateBuildingFolder, updateBuildingName } from '@/database/projectsRepository';
import { RootStackParamList } from '@/navigation/types';
import { resolveShareLink } from '@/services/microsoftGraph/oneDriveService';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Building, emptyOneDriveFolderRef } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminBuildingEdit'>;

export default function AdminBuildingEditScreen({ route, navigation }: Props) {
  const { buildingId } = route.params;
  const [building, setBuilding] = useState<Building | null>(null);
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const b = getBuilding(buildingId);
    setBuilding(b);
    setName(b?.name ?? '');
    setLink(b?.photoFolder.shareUrl ?? '');
  }, [buildingId]);

  if (!building) return null;

  const onSave = async () => {
    setSaving(true);
    try {
      if (name.trim() && name.trim() !== building.name) {
        updateBuildingName(buildingId, name.trim());
      }
      const trimmedLink = link.trim();
      if (trimmedLink !== (building.photoFolder.shareUrl ?? '')) {
        if (!trimmedLink) {
          // Field cleared on purpose: unlink the folder rather than asking
          // Graph to resolve an empty string.
          updateBuildingFolder(buildingId, emptyOneDriveFolderRef());
        } else {
          const resolved = await resolveShareLink(trimmedLink);
          updateBuildingFolder(buildingId, resolved);
          if (resolved.lastError) {
            Alert.alert('Lien non vérifié', resolved.lastError);
            return;
          }
          Alert.alert('Dossier connecté', `Dossier OneDrive vérifié : "${resolved.itemName}".`);
        }
      }
      navigation.navigate('Admin');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={typography.h2}>{building.name}</Text>

      <Text style={styles.label}>Nom du bâtiment :</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />

      <Text style={styles.label}>Lien dossier Photo OneDrive :</Text>
      <TextInput
        value={link}
        onChangeText={setLink}
        placeholder="https://...-my.sharepoint.com/... ou https://1drv.ms/..."
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {building.photoFolder.itemId && (
        <View style={styles.infoBox}>
          <Text style={styles.infoLine}>Drive ID : {building.photoFolder.driveId}</Text>
          <Text style={styles.infoLine}>Item ID : {building.photoFolder.itemId}</Text>
          {building.photoFolder.verifiedAt && (
            <Text style={styles.infoLine}>
              Vérifié le : {new Date(building.photoFolder.verifiedAt).toLocaleString('fr-CA')}
            </Text>
          )}
        </View>
      )}

      {saving ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : (
        <PrimaryButton label="Enregistrer" onPress={onSave} style={{ marginTop: 24 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  label: { marginTop: 20, marginBottom: 8, color: colors.textSecondary },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
  infoBox: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoLine: { fontSize: 12, color: colors.textSecondary, fontFamily: 'monospace' },
});
