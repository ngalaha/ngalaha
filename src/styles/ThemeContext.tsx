import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ColorPalette } from './colors';
import { spacing, radius } from './spacing';
import { typography } from './typography';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type Preferences,
  type ThemeMode,
} from '../settings/preferences';

interface ThemeContextValue {
  colors: ColorPalette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  isDark: boolean;
  preferences: Preferences;
  setThemeMode: (mode: ThemeMode) => void;
  setChantierMode: (enabled: boolean) => void;
  setDefaultLossMarginPercent: (percent: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    loadPreferences().then(setPreferences);
  }, []);

  const updatePreferences = (updates: Partial<Preferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updates };
      savePreferences(next);
      return next;
    });
  };

  const isDark =
    preferences.themeMode === 'dark' || (preferences.themeMode === 'system' && systemScheme === 'dark');

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      spacing,
      radius,
      typography,
      isDark,
      preferences,
      setThemeMode: (mode) => updatePreferences({ themeMode: mode }),
      setChantierMode: (enabled) => updatePreferences({ chantierMode: enabled }),
      setDefaultLossMarginPercent: (percent) => updatePreferences({ defaultLossMarginPercent: percent }),
    }),
    [isDark, preferences]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé à l\'intérieur de ThemeProvider');
  return ctx;
}
