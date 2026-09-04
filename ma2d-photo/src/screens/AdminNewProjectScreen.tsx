import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import PrimaryButton from '@/components/PrimaryButton';
import { useProjects } from '@/hooks/useProjects';
import { RootStackParamList } from '@/navigation/types';
import { syncSoon } from '@/services/sync/configSyncService';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminNewProject'>;

export default function AdminNewProjectScreen({ navigation }: Props) {
  const { addProject } = useProjects();
  const [name, setName] = useState('');

  const onCreate = () => {
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Indiquez le nom du projet.');
      return;
    }
    addProject(name.trim());
    // Publish it to the other phones right away.
    syncSoon(true);
    navigation.navigate('Admin');
  };

  return (
    <View style={styles.container}>
      <Text style={typography.h2}>+ NOUVEAU PROJET</Text>
      <Text style={styles.label}>Nom du projet :</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Ex : Projet Laval"
        style={styles.input}
        autoFocus
      />
      <PrimaryButton label="Créer" onPress={onCreate} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
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
