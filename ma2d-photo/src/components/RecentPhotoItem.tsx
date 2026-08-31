import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { formatShortTime } from '@/utils/dateUtils';
import { PhotoRecord } from '@/types';

import PhotoStatusBadge from './PhotoStatusBadge';

interface Props {
  photo: PhotoRecord;
  onRetry?: (photoId: string) => void;
}

export default function RecentPhotoItem({ photo, onRetry }: Props) {
  return (
    <View style={styles.row}>
      <Image source={{ uri: photo.localUri }} style={styles.thumb} />
      <View style={styles.info}>
        <Text style={typography.bodyBold}>{formatShortTime(photo.capturedAt)}</Text>
        <Text style={styles.building}>{photo.buildingName}</Text>
        <PhotoStatusBadge status={photo.status} />
      </View>
      {photo.status === 'FAILED' && onRetry && (
        <Pressable onPress={() => onRetry(photo.id)} style={styles.retryButton}>
          <Text style={styles.retryText}>Réessayer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: colors.border },
  info: { flex: 1, gap: 2 },
  building: { color: colors.textSecondary, fontSize: 14 },
  retryButton: {
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
});
