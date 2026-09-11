import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTranslation } from '@/i18n/I18nContext';
import { userMessage } from '@/utils/errorMessages';
import PrimaryButton from '@/components/PrimaryButton';
import { createBuilding, updateBuildingFolder } from '@/database/projectsRepository';
import { RootStackParamList } from '@/navigation/types';
import { syncSoon } from '@/services/sync/configSyncService';
import { resolveShareLink } from '@/services/microsoftGraph/oneDriveService';
import { ThemeColors } from '@/theme/colors';
import { useTheme, useThemedStyles } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminNewBuilding'>;

export default function AdminNewBuildingScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { projectId } = route.params;
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('newProject.nameRequired.title'), t('newBuilding.nameRequired.body'));
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
            t('newBuilding.created.title'),
            t('newBuilding.created.unverified', { error: userMessage(resolved.lastError) })
          );
        }
      }
      syncSoon(true);
      navigation.navigate('Admin');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={typography.h2}>{t('newBuilding.title')}</Text>

      <Text style={styles.label}>{t('newBuilding.nameLabel')}</Text>
      <TextInput value={name} onChangeText={setName} placeholder={t('newBuilding.namePlaceholder')} style={styles.input} />

      <Text style={styles.label}>{t('newBuilding.linkLabel')}</Text>
      <TextInput
        value={link}
        onChangeText={setLink}
        placeholder={t('buildingEdit.linkPlaceholder')}
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
        <PrimaryButton label={t('common.save')} onPress={onSave} style={{ marginTop: 24 }} />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
