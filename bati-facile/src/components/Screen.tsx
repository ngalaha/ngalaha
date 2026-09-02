import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../styles/ThemeContext';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const { colors, spacing } = useTheme();
  const Container = scroll ? ScrollView : View;

  return (
    <Container
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={scroll ? { padding: spacing.md, gap: spacing.md } : undefined}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
