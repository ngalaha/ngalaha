import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { navigationRef } from '@/navigation/navigationRef';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

const PANEL_WIDTH = Math.min(320, Dimensions.get('window').width * 0.82);

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * App-wide slide-out menu (right to left), reachable from the hamburger
 * icon in every screen's header (see RootNavigator). Each row here is a
 * link to a full screen — the menu itself stays a short list, not content.
 */
export default function SideMenu({ visible, onClose }: Props) {
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : PANEL_WIDTH,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [visible, translateX]);

  const goTo = (screen: 'About') => {
    onClose();
    if (navigationRef.isReady()) navigationRef.navigate(screen);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.panel, { width: PANEL_WIDTH, transform: [{ translateX }] }]}>
          <View style={styles.header}>
            <Text style={typography.h2}>Menu</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.primary} />
            </Pressable>
          </View>

          <Pressable
            style={styles.menuItem}
            onPress={() => goTo('About')}
            android_ripple={{ color: 'rgba(15, 42, 67, 0.08)' }}
          >
            <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
            <Text style={styles.menuItemText}>À propos</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, flexDirection: 'row', justifyContent: 'flex-end' },
  panel: {
    backgroundColor: colors.surface,
    height: '100%',
    paddingTop: 56,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: -4, height: 0 },
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  closeButton: { padding: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  menuItemText: { ...typography.bodyBold, color: colors.textPrimary, flex: 1 },
});
