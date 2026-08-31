import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '@/components/PrimaryButton';
import { logger, LogEntry } from '@/services/logging/logger';
import { runSync } from '@/services/upload/uploadQueueService';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

const LEVEL_COLOR: Record<LogEntry['level'], string> = {
  info: colors.textSecondary,
  warn: colors.warning,
  error: colors.danger,
};

export default function DiagnosticsScreen() {
  const [entries, setEntries] = useState<LogEntry[]>(logger.getEntries());

  useEffect(() => logger.subscribe(() => setEntries(logger.getEntries())), []);

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <PrimaryButton label="Forcer la synchronisation" onPress={() => runSync()} style={{ flex: 1 }} />
        <PrimaryButton label="Effacer" variant="secondary" onPress={() => logger.clear()} style={{ flex: 1 }} />
      </View>
      <FlatList
        data={entries}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <Text style={[styles.time]}>{new Date(item.timestamp).toLocaleTimeString('fr-CA')}</Text>
            <Text style={[typography.body, { color: LEVEL_COLOR[item.level] }]}>{item.message}</Text>
            {item.data && <Text style={styles.data}>{JSON.stringify(item.data)}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun journal pour le moment.</Text>}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  actions: { flexDirection: 'row', gap: 12, padding: 16 },
  entry: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 },
  time: { fontSize: 11, color: colors.textSecondary },
  data: { fontSize: 11, color: colors.textSecondary, fontFamily: 'monospace' },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: 40 },
});
