import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

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
        {buildings.map((building) => (
          <BuildingCell
            key={building.id}
            building={building}
            selected={building.id === selectedBuildingId}
            onSelect={onSelect}
          />
        ))}
      </View>
    </View>
  );
}

function BuildingCell({
  building,
  selected,
  onSelect,
}: {
  building: Building;
  selected: boolean;
  onSelect: (buildingId: string) => void;
}) {
  const configured = !!building.photoFolder.itemId;
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  return (
    <Animated.View style={[styles.cellWrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => onSelect(building.id)}
        onPressIn={() => animateTo(0.95)}
        onPressOut={() => animateTo(1)}
        style={[styles.cell, selected && styles.cellSelected]}
      >
        <Text style={[styles.cellText, selected && styles.cellTextSelected]}>
          {building.name.replace('Bâtiment ', '')}
        </Text>
        {!configured && (
          <Ionicons
            name="alert-circle"
            size={16}
            color={selected ? colors.accent : colors.warning}
            style={styles.warningIcon}
          />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textSecondary, marginBottom: 8, marginTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cellWrapper: { width: '30%' },
  cell: {
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
  warningIcon: { position: 'absolute', top: 8, right: 8 },
});
