import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAdminPinGate } from '@/components/AdminPinGate';
import PrimaryButton from '@/components/PrimaryButton';
import { createApartments, deleteApartment, listApartments } from '@/database/apartmentsRepository';
import { getBuilding } from '@/database/projectsRepository';
import { RootStackParamList } from '@/navigation/types';
import { parseApartmentNames } from '@/utils/apartmentNames';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Apartment } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminApartments'>;

export default function AdminApartmentsScreen({ route }: Props) {
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
      const skipped = names.length - createdCount;
      Alert.alert(
        'Appartements ajoutés',
        `${createdCount} appartement(s) ajouté(s).` +
          (skipped > 0 ? `\n${skipped} ignoré(s) (déjà existant(s)).` : '')
      );
    });
  };

  const onDelete = (apartment: Apartment) => {
    Alert.alert('Supprimer', `Supprimer l'appartement "${apartment.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          requireAdmin(() => {
            deleteApartment(apartment.id);
            refresh();
          }),
      },
    ]);
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
            <Text style={styles.hint}>
              Ajoutez les noms des appartements de ce bâtiment : un par ligne ou séparés par des virgules.
              Pour une série complète, écrivez simplement la plage — « 101-127 » crée les 27 appartements
              d'un coup, et « A-1 - A-5 » fonctionne aussi. Le dossier OneDrive de chaque appartement est
              créé automatiquement dans le dossier Photo du bâtiment dès la première photo prise pour cet
              appartement — rien d'autre à configurer ici.
            </Text>
            <TextInput
              value={bulkText}
              onChangeText={setBulkText}
              placeholder={'101-127\nZone commune'}
              style={styles.textarea}
              multiline
              numberOfLines={5}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <PrimaryButton label="Ajouter" onPress={onAdd} style={{ marginTop: 12, marginBottom: 24 }} />
            <Text style={styles.count}>
              {apartments.length} appartement{apartments.length > 1 ? 's' : ''}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={typography.body}>{item.name}</Text>
            <Text onPress={() => onDelete(item)} style={styles.delete}>
              Suppr.
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun appartement pour le moment.</Text>}
      />
      {promptElement}
    </>
  );
}

const styles = StyleSheet.create({
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
