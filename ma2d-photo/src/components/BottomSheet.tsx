import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme/colors';

const OFFSCREEN_OFFSET = 320;

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number | `${number}%`;
}

/**
 * A bottom sheet that slides up from the bottom edge on open (rather than
 * just fading in) for a more native, fluid feel — shared by ProjectPicker
 * and ApartmentPicker.
 */
export default function BottomSheet({ visible, onClose, children, maxHeight = '70%' }: Props) {
  const translateY = useRef(new Animated.Value(OFFSCREEN_OFFSET)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : OFFSCREEN_OFFSET,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.sheet, { maxHeight, transform: [{ translateY }] }]}>
          {children}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
});
