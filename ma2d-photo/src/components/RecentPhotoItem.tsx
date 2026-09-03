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
}

export default function RecentPhotoItem({ photo, onRetry }: Props) {
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
      <Image source={{ uri: photo.localUri }} style={styles.thumb} />
      <View style={styles.info}>
        <Text style={typography.bodyBold}>{formatShortTime(photo.capturedAt)}</Text>
        <Text style={styles.building}>
          {photo.buildingName}
          {photo.apartmentName ? ` — ${photo.apartmentName}` : ''}
        </Text>
        <PhotoStatusBadge status={photo.status} />
      </View>
      {photo.status === 'FAILED' && onRetry && (
        <Pressable onPress={() => onRetry(photo.id)} style={styles.retryButton}>
          <Ionicons name="refresh" size={14} color={colors.danger} />
          <Text style={styles.retryText}>Réessayer</Text>
        </Pressable>
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
});
