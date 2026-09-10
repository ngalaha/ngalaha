import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { getSettings, subscribeSettings, ThemePreference } from '@/services/settings/appSettings';

import { DARK_COLORS, LIGHT_COLORS, ThemeColors } from './colors';

interface ThemeValue {
  colors: ThemeColors;
  /** What is actually on screen, once "system" has been resolved. */
  isDark: boolean;
}

const ThemeContext = createContext<ThemeValue>({ colors: LIGHT_COLORS, isDark: false });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() => getSettings().theme);
  const systemScheme = useColorScheme();

  useEffect(() => subscribeSettings((settings) => setPreference(settings.theme)), []);

  const value = useMemo<ThemeValue>(() => {
    const isDark = preference === 'dark' || (preference === 'system' && systemScheme === 'dark');
    return { colors: isDark ? DARK_COLORS : LIGHT_COLORS, isDark };
  }, [preference, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

type StyleFactory<T> = (colors: ThemeColors) => T;

/**
 * Builds a StyleSheet from the active palette, rebuilding it only when the
 * palette actually changes. Screens keep one `createStyles(colors)` factory
 * at the bottom of the file, exactly where their StyleSheet used to be.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(factory: StyleFactory<T>): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
