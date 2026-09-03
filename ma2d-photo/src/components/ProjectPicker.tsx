import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Project } from '@/types';

import BottomSheet from './BottomSheet';

interface Props {
  projects: Project[];
  selectedProject: Project | null;
  onSelect: (projectId: string) => void;
}

export default function ProjectPicker({ projects, selectedProject, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Text style={[typography.caption, styles.label]}>Projet</Text>
      <Pressable
        style={styles.trigger}
        onPress={() => setOpen(true)}
        android_ripple={{ color: 'rgba(15, 42, 67, 0.08)' }}
      >
        <Text style={styles.triggerText}>
          {selectedProject ? selectedProject.name.toUpperCase() : 'Sélectionner un projet'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.primary} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} maxHeight="60%">
        <Text style={[typography.h2, styles.sheetTitle]}>Choisir un projet</Text>
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.option}
              onPress={() => {
                onSelect(item.id);
                setOpen(false);
              }}
              android_ripple={{ color: 'rgba(15, 42, 67, 0.08)' }}
            >
              <Text style={typography.bodyBold}>{item.name}</Text>
              {selectedProject?.id === item.id && (
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              )}
            </Pressable>
          )}
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
  option: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
