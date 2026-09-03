import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Apartment } from '@/types';

import BottomSheet from './BottomSheet';

const COMMON_AREA_LABEL = 'Zone commune';
/** Show the search box once there are enough apartments that scrolling to find one gets tedious. */
const SEARCH_THRESHOLD = 8;

interface Props {
  apartments: Apartment[];
  /** null = "Zone commune" (the building in general, not a specific unit). */
  selectedApartmentId: string | null;
  onSelect: (apartmentId: string | null) => void;
}

export default function ApartmentPicker({ apartments, selectedApartmentId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabel = selectedApartmentId
    ? (apartments.find((a) => a.id === selectedApartmentId)?.name ?? COMMON_AREA_LABEL)
    : COMMON_AREA_LABEL;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apartments;
    return apartments.filter((a) => a.name.toLowerCase().includes(q));
  }, [apartments, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View>
      <Text style={[typography.caption, styles.label]}>Appartement</Text>
      <Pressable
        style={styles.trigger}
        onPress={() => setOpen(true)}
        android_ripple={{ color: 'rgba(15, 42, 67, 0.08)' }}
      >
        <Text style={styles.triggerText}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.primary} />
      </Pressable>

      <BottomSheet visible={open} onClose={close}>
        <Text style={[typography.h2, styles.sheetTitle]}>Choisir un appartement</Text>
        {apartments.length > SEARCH_THRESHOLD && (
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un appartement..."
            style={styles.search}
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
        <FlatList
          data={filtered}
          keyExtractor={(a) => a.id}
          ListHeaderComponent={
            !query ? (
              <Pressable
                style={styles.option}
                onPress={() => {
                  onSelect(null);
                  close();
                }}
                android_ripple={{ color: 'rgba(15, 42, 67, 0.08)' }}
              >
                <Text style={typography.bodyBold}>{COMMON_AREA_LABEL}</Text>
                {selectedApartmentId === null && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                )}
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.option}
              onPress={() => {
                onSelect(item.id);
                close();
              }}
              android_ripple={{ color: 'rgba(15, 42, 67, 0.08)' }}
            >
              <Text style={typography.bodyBold}>{item.name}</Text>
              {selectedApartmentId === item.id && (
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              )}
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Aucun résultat.</Text>}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textSecondary, marginBottom: 4 },
  trigger: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  triggerText: { ...typography.bodyBold, color: colors.primary },
  sheetTitle: { marginBottom: 12 },
  search: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 15,
  },
  option: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  empty: { color: colors.textSecondary, textAlign: 'center', paddingVertical: 20 },
});
