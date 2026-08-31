import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import PrimaryButton from '@/components/PrimaryButton';
import { createBuilding, updateBuildingFolder } from '@/database/projectsRepository';
import { RootStackParamList } from '@/navigation/types';
import { resolveShareLink } from '@/services/microsoftGraph/oneDriveService';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminNewBuilding'>;

export default function AdminNewBuildingScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Indiquez le nom du bâtiment.');
      return;
    }
    setSaving(true);
    try {
      const building = createBuilding(projectId, name.trim());
      if (link.trim()) {
        const resolved = await resolveShareLink(link.trim());
        updateBuildingFolder(building.id, resolved);
        if (resolved.lastError) {
          Alert.alert(
            'Bâtiment créé',
            `Le bâtiment a été créé, mais le lien OneDrive n'a pas pu être vérifié : ${resolved.lastError}\nVous pourrez le corriger depuis Administration.`
          );
        }
      }
      navigation.navigate('Admin');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={typography.h2}>Nouveau bâtiment</Text>

      <Text style={styles.label}>Nom du bâtiment :</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Ex : Bâtiment G" style={styles.input} />

      <Text style={styles.label}>Lien dossier Photo OneDrive (optionnel maintenant) :</Text>
      <TextInput
        value={link}
        onChangeText={setLink}
        placeholder="https://...-my.sharepoint.com/... ou https://1drv.ms/..."
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.hint}>
        Dans OneDrive, ouvrez le dossier "Photo" du bâtiment, touchez "Partager" puis "Copier le lien",
        et collez-le ici. L'application vérifiera qu'il est accessible avec ce compte Microsoft.
      </Text>

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
  hint: { marginTop: 8, color: colors.textSecondary, fontSize: 13 },
});
