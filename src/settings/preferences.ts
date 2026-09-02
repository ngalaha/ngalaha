import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Preferences {
  themeMode: ThemeMode;
  chantierMode: boolean; // mode simplifié avec gros boutons
  defaultLossMarginPercent: number;
}

export const DEFAULT_PREFERENCES: Preferences = {
  themeMode: 'system',
  chantierMode: false,
  defaultLossMarginPercent: 5,
};

const KEY = '@calcul_chantier/preferences';

export async function loadPreferences(): Promise<Preferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}
