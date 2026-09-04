import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import PrimaryButton from '@/components/PrimaryButton';
import { RootStackParamList } from '@/navigation/types';
import {
  clearWorkspace,
  getSyncState,
  getWorkspaceFolder,
  setWorkspaceFromShareLink,
  subscribeSync,
  syncNow,
} from '@/services/sync/configSyncService';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { AppError } from '@/utils/errorMessages';
import { OneDriveFolderRef } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminWorkspace'>;

function formatDate(iso: string | null): string {
  if (!iso) return 'jamais';
  return new Date(iso).toLocaleString('fr-CA');
}

/**
 * The one link to paste per phone. Everything else — projects, buildings,
 * apartments, and each building's Photo folder — then arrives on its own,
 * and anything created here reaches the other phones the same way.
 */
export default function AdminWorkspaceScreen({ navigation }: Props) {
  const [folder, setFolder] = useState<OneDriveFolderRef | null>(getWorkspaceFolder);
  const [state, setState] = useState(getSyncState);
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    setFolder(getWorkspaceFolder());
    setState(getSyncState());
  }, []);

  useEffect(() => subscribeSync(refresh), [refresh]);

  const connect = async () => {
    const trimmed = link.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const resolved = await setWorkspaceFromShareLink(trimmed);
      if (resolved.lastError) {
        Alert.alert('Lien non vérifié', resolved.lastError);
        return;
      }
      const result = await syncNow();
      refresh();
      setLink('');
      if (result.status === 'error') {
        Alert.alert('Synchronisation impossible', result.message ?? '');
        return;
      }
      Alert.alert(
        'Espace partagé connecté',
        `Dossier « ${resolved.itemName} ». La configuration de l'équipe est maintenant sur cet appareil.`
      );
      navigation.goBack();
    } catch (e) {
      const message = e instanceof AppError ? e.userMessage : "Le lien n'a pas pu être utilisé.";
      Alert.alert('Erreur', message);
    } finally {
      setBusy(false);
    }
  };

  const runSyncNow = async () => {
    setBusy(true);
    try {
      const result = await syncNow();
      refresh();
      if (result.status === 'error') {
        Alert.alert('Synchronisation impossible', result.message ?? '');
      } else {
        Alert.alert('Synchronisation terminée', 'La configuration est à jour sur cet appareil.');
      }
    } finally {
      setBusy(false);
    }
  };

  const disconnect = () => {
    Alert.alert(
      "Retirer l'espace partagé",
      "Cet appareil cessera de recevoir et de publier la configuration de l'équipe. Les projets, bâtiments et appartements déjà présents restent sur le téléphone.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => {
            clearWorkspace();
            refresh();
          },
        },
      ]
    );
  };

  const connected = !!folder?.itemId;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        L'espace partagé est un dossier OneDrive commun à l'équipe. L'application y garde la liste
        des projets, des bâtiments et des appartements : ce que vous créez ici apparaît sur les
        téléphones des collègues, et ce qu'ils créent apparaît ici. Un seul lien à coller par
        appareil.
      </Text>

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <Ionicons
            name={connected ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={connected ? colors.success : colors.warning}
          />
          <Text style={typography.bodyBold}>
            {connected ? `Dossier « ${folder?.itemName} »` : 'Aucun espace partagé'}
          </Text>
        </View>
        {connected && (
          <>
            <Text style={styles.detail}>Dernière synchronisation : {formatDate(state.lastSyncedAt)}</Text>
            {state.lastError && <Text style={styles.error}>{state.lastError}</Text>}
          </>
        )}
      </View>

      <Text style={styles.label}>
        {connected ? 'Remplacer par un autre dossier partagé :' : 'Lien du dossier partagé OneDrive :'}
      </Text>
      <TextInput
        value={link}
        onChangeText={setLink}
        placeholder="https://...-my.sharepoint.com/... ou https://1drv.ms/..."
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {busy ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : (
        <>
          <PrimaryButton
            label={connected ? 'Remplacer' : 'Connecter'}
            icon="link-outline"
            onPress={connect}
            style={{ marginTop: 16 }}
          />
          {connected && (
            <>
              <PrimaryButton
                label="Synchroniser maintenant"
                icon="sync-outline"
                variant="secondary"
                onPress={runSyncNow}
                style={{ marginTop: 12 }}
              />
              <Text onPress={disconnect} style={styles.disconnect}>
                Retirer l'espace partagé de cet appareil
              </Text>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  intro: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detail: { color: colors.textSecondary, fontSize: 13, marginTop: 8 },
  error: { color: colors.danger, fontSize: 13, marginTop: 8 },
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
  disconnect: {
    color: colors.danger,
    textAlign: 'center',
    marginTop: 24,
    textDecorationLine: 'underline',
  },
});
