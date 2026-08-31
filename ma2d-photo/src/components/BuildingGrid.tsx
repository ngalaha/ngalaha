import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Building } from '@/types';

interface Props {
  buildings: Building[];
  selectedBuildingId: string | null;
  onSelect: (buildingId: string) => void;
}

export default function BuildingGrid({ buildings, selectedBuildingId, onSelect }: Props) {
  return (
    <View>
      <Text style={[typography.caption, styles.label]}>Bâtiment</Text>
      <View style={styles.grid}>
        {buildings.map((building) => {
          const selected = building.id === selectedBuildingId;
          const configured = !!building.photoFolder.itemId;
          return (
            <Pressable
              key={building.id}
              onPress={() => onSelect(building.id)}
              style={[styles.cell, selected && styles.cellSelected]}
            >
              <Text style={[styles.cellText, selected && styles.cellTextSelected]}>
                {building.name.replace('Bâtiment ', '')}
              </Text>
              {!configured && <Text style={styles.warningDot}>⚠</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textSecondary, marginBottom: 8, marginTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: {
    width: '30%',
    aspectRatio: 1.3,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: { backgroundColor: colors.primary },
  cellText: { ...typography.h2, color: colors.primary },
  cellTextSelected: { color: colors.textOnPrimary },
  warningDot: { position: 'absolute', top: 6, right: 8, fontSize: 14 },
});
