import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTranslation } from '@/i18n/I18nContext';
import { LOCALES, Language } from '@/i18n/languages';
import { translate } from '@/i18n/translate';
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
import { ThemeColors } from '@/theme/colors';
import { useTheme, useThemedStyles } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { AppError, userMessage } from '@/utils/errorMessages';
import { OneDriveFolderRef } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminWorkspace'>;

function formatDate(iso: string | null, language: Language): string {
  if (!iso) return translate('admin.workspace.never', undefined, language);
  return new Date(iso).toLocaleString(LOCALES[language]);
}

/**
 * The one link to paste per phone. Everything else — projects, buildings,
 * apartments, and each building's Photo folder — then arrives on its own,
 * and anything created here reaches the other phones the same way.
 */
export default function AdminWorkspaceScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t, language } = useTranslation();
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
        Alert.alert(t('buildingEdit.linkUnverified.title'), userMessage(resolved.lastError));
        return;
      }
      const result = await syncNow();
      refresh();
      setLink('');
      if (result.status === 'error') {
        Alert.alert(t('workspace.syncFailed.title'), result.message ? userMessage(result.message) : '');
        return;
      }
      Alert.alert(
        t('workspace.connected.title'),
        t('workspace.connected.body', { name: resolved.itemName ?? '' })
      );
      navigation.goBack();
    } catch (e) {
      const message = userMessage(
        e instanceof AppError ? e.userMessage : 'workspace.linkUnusable'
      );
      Alert.alert(t('common.error'), message);
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
        Alert.alert(t('workspace.syncFailed.title'), result.message ? userMessage(result.message) : '');
      } else {
        Alert.alert(t('workspace.synced.title'), t('workspace.synced.body'));
      }
    } finally {
      setBusy(false);
    }
  };

  const disconnect = () => {
    Alert.alert(
      t('workspace.disconnect.title'),
      t('workspace.disconnect.body'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('photo.discard'),
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
      <Text style={styles.intro}>{t('workspace.intro')}</Text>

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <Ionicons
            name={connected ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={connected ? colors.success : colors.warning}
          />
          <Text style={typography.bodyBold}>
            {connected
              ? t('admin.workspace.folder', { name: folder?.itemName ?? '' })
              : t('workspace.none')}
          </Text>
        </View>
        {connected && (
          <>
            <Text style={styles.detail}>
              {t('workspace.lastSync', { when: formatDate(state.lastSyncedAt, language) })}
            </Text>
            {state.lastError && (
              <Text style={styles.error}>{userMessage(state.lastError)}</Text>
            )}
          </>
        )}
      </View>

      <Text style={styles.label}>
        {connected ? t('workspace.label.replace') : t('workspace.label.connect')}
      </Text>
      <TextInput
        value={link}
        onChangeText={setLink}
        placeholder={t('buildingEdit.linkPlaceholder')}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {busy ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : (
        <>
          <PrimaryButton
            label={connected ? t('workspace.action.replace') : t('workspace.action.connect')}
            icon="link-outline"
            onPress={connect}
            style={{ marginTop: 16 }}
          />
          {connected && (
            <>
              <PrimaryButton
                label={t('workspace.action.syncNow')}
                icon="sync-outline"
                variant="secondary"
                onPress={runSyncNow}
                style={{ marginTop: 12 }}
              />
              <Text onPress={disconnect} style={styles.disconnect}>
                {t('workspace.action.disconnect')}
              </Text>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
