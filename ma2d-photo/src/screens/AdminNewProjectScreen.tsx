import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTranslation } from '@/i18n/I18nContext';
import PrimaryButton from '@/components/PrimaryButton';
import { useProjects } from '@/hooks/useProjects';
import { RootStackParamList } from '@/navigation/types';
import { syncSoon } from '@/services/sync/configSyncService';
import { ThemeColors } from '@/theme/colors';
import { useTheme, useThemedStyles } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminNewProject'>;

export default function AdminNewProjectScreen({ navigation }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { addProject } = useProjects();
  const [name, setName] = useState('');

  const onCreate = () => {
    if (!name.trim()) {
      Alert.alert(t('newProject.nameRequired.title'), t('newProject.nameRequired.body'));
      return;
    }
    addProject(name.trim());
    // Publish it to the other phones right away.
    syncSoon(true);
    navigation.navigate('Admin');
  };

  return (
    <View style={styles.container}>
      <Text style={typography.h2}>{t('newProject.title')}</Text>
      <Text style={styles.label}>{t('newProject.label')}</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('newProject.placeholder')}
        style={styles.input}
        autoFocus
      />
      <PrimaryButton label={t('newProject.create')} onPress={onCreate} style={{ marginTop: 24 }} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  label: { marginTop: 24, marginBottom: 8, color: colors.textSecondary },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
});
