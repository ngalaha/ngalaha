import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

const PANEL_WIDTH = Math.min(320, Dimensions.get('window').width * 0.82);
const MA2D_WEBSITE_URL = 'https://www.ma2d.com/fr/entrepreneur-general-ma2d-construction';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * App-wide slide-out menu (right to left), reachable from the hamburger
 * icon in every screen's header (see RootNavigator). Currently a single
 * "À propos" section — more sections can be added below it later.
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

          <View style={styles.sectionHeaderRow}>
            <Ionicons name="business-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>À propos</Text>
          </View>
          <Text style={styles.paragraph}>
            MA2D Construction est un entrepreneur général fondé en 2010, spécialisé dans les projets de
            développement immobilier résidentiel, commercial et industriel dans la région métropolitaine.
          </Text>
          <Text style={styles.paragraph}>
            Cette application permet aux équipes de chantier de photographier l'avancement des travaux et de
            les classer automatiquement dans OneDrive, par projet, bâtiment et appartement.
          </Text>
          <Pressable onPress={() => Linking.openURL(MA2D_WEBSITE_URL)} style={styles.linkRow}>
            <Ionicons name="globe-outline" size={16} color={colors.primary} />
            <Text style={styles.link}>Visiter le site de MA2D</Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.version}>Version {APP_VERSION}</Text>
          </View>
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
    paddingHorizontal: 20,
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
    marginBottom: 20,
  },
  closeButton: { padding: 4 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { ...typography.bodyBold, color: colors.primary, fontSize: 16 },
  paragraph: { ...typography.body, color: colors.textPrimary, lineHeight: 20, marginBottom: 12 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  link: { color: colors.primary, fontWeight: '700' },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  version: { color: colors.textSecondary, fontSize: 13 },
});
