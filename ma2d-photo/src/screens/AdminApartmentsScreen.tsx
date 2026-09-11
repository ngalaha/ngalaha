import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTranslation } from '@/i18n/I18nContext';
import { useAdminPinGate } from '@/components/AdminPinGate';
import PrimaryButton from '@/components/PrimaryButton';
import { createApartments, deleteApartment, listApartments } from '@/database/apartmentsRepository';
import { getBuilding } from '@/database/projectsRepository';
import { RootStackParamList } from '@/navigation/types';
import { syncSoon } from '@/services/sync/configSyncService';
import { parseApartmentNames } from '@/utils/apartmentNames';
import { ThemeColors } from '@/theme/colors';
import { useTheme, useThemedStyles } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { Apartment } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminApartments'>;

export default function AdminApartmentsScreen({ route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { buildingId } = route.params;
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [bulkText, setBulkText] = useState('');
  const building = getBuilding(buildingId);
  const { requireAdmin, promptElement } = useAdminPinGate();

  const refresh = useCallback(() => {
    setApartments(listApartments(buildingId));
  }, [buildingId]);

  useFocusEffect(refresh);

  const onAdd = () => {
    const names = parseApartmentNames(bulkText);
    if (!names.length) return;

    requireAdmin(() => {
      const createdCount = createApartments(buildingId, names);
      setBulkText('');
      refresh();
      syncSoon(true);
      const skipped = names.length - createdCount;
      Alert.alert(
        t('apartments.added.title'),
        t('apartments.added.body', { count: createdCount }) +
          (skipped > 0 ? t('apartments.added.skipped', { count: skipped }) : '')
      );
    });
  };

  const onDelete = (apartment: Apartment) => {
    Alert.alert(
      t('admin.deleteBuilding.title'),
      t('apartments.delete.body', { name: apartment.name }),
      [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          requireAdmin(() => {
            deleteApartment(apartment.id);
            refresh();
            syncSoon(true);
          }),
      },
      ]
    );
  };

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={{ padding: 20 }}
        data={apartments}
        keyExtractor={(a) => a.id}
        ListHeaderComponent={
          <View>
            <Text style={typography.h2}>{building?.name ?? ''}</Text>
            <Text style={styles.hint}>{t('apartments.hint')}</Text>
            <TextInput
              value={bulkText}
              onChangeText={setBulkText}
              placeholder={`101-127\n${t('picker.commonArea')}`}
              style={styles.textarea}
              multiline
              numberOfLines={5}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <PrimaryButton label={t('apartments.add')} onPress={onAdd} style={{ marginTop: 12, marginBottom: 24 }} />
            <Text style={styles.count}>
              {apartments.length > 1
                ? t('apartments.count.many', { count: apartments.length })
                : t('apartments.count.one', { count: apartments.length })}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={typography.body}>{item.name}</Text>
            <Text onPress={() => onDelete(item)} style={styles.delete}>
              {t('admin.deleteShort')}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('apartments.empty')}</Text>}
      />
      {promptElement}
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hint: { color: colors.textSecondary, fontSize: 13, marginTop: 8, marginBottom: 16, lineHeight: 18 },
  textarea: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: colors.surface,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  count: { color: colors.textSecondary, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  delete: { color: colors.danger, fontWeight: '700' },
  empty: { color: colors.textSecondary, textAlign: 'center', paddingVertical: 20 },
});
