import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { formatShortTime } from '@/utils/dateUtils';
import { PhotoRecord } from '@/types';

import PhotoStatusBadge from './PhotoStatusBadge';

interface Props {
  photo: PhotoRecord;
  onRetry?: (photoId: string) => void;
  onDiscard?: (photo: PhotoRecord) => void;
}

export default function RecentPhotoItem({ photo, onRetry, onDiscard }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={[styles.row, { opacity, transform: [{ translateY }] }]}>
      {/* An uploaded file's local copy is deleted once OneDrive confirms it
          (uploadQueueService), so there is no image left to show — a cloud
          tile says "it is safe over there" instead of a grey square. */}
      {photo.status === 'UPLOADED' ? (
        <View style={[styles.thumb, styles.uploadedThumb]}>
          <Ionicons name="cloud-done-outline" size={24} color={colors.success} />
        </View>
      ) : photo.mediaType === 'video' ? (
        <View style={[styles.thumb, styles.videoThumb]}>
          <Ionicons name="videocam" size={22} color={colors.textOnPrimary} />
        </View>
      ) : (
        <Image source={{ uri: photo.localUri }} style={styles.thumb} />
      )}
      <View style={styles.info}>
        <Text style={typography.bodyBold}>{formatShortTime(photo.capturedAt)}</Text>
        <Text style={styles.building}>
          {photo.buildingName}
          {photo.apartmentName ? ` — ${photo.apartmentName}` : ''}
        </Text>
        <PhotoStatusBadge status={photo.status} />
      </View>
      {photo.status === 'FAILED' && (
        <View style={styles.failedActions}>
          {onRetry && (
            <Pressable onPress={() => onRetry(photo.id)} style={styles.retryButton}>
              <Ionicons name="refresh" size={14} color={colors.danger} />
              <Text style={styles.retryText}>Réessayer</Text>
            </Pressable>
          )}
          {/* Without this, a file that can never succeed — a folder that no
              longer exists, a photo taken by mistake — stays in the queue
              for good, since nothing else deletes a record that never
              reached OneDrive. */}
          {onDiscard && (
            <Text onPress={() => onDiscard(photo)} style={styles.discardText}>
              Retirer
            </Text>
          )}
        </View>
      )}
    </Animated.View>
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
  videoThumb: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  uploadedThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: { flex: 1, gap: 2 },
  building: { color: colors.textSecondary, fontSize: 14 },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  failedActions: { alignItems: 'flex-end', gap: 6 },
  discardText: { color: colors.textSecondary, fontSize: 12, textDecorationLine: 'underline' },
});
