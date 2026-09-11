import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getSettings, subscribeSettings } from '@/services/settings/appSettings';

import { Language } from './languages';
import { translate, TranslationKey, TranslationValues } from './translate';

interface I18nValue {
  language: Language;
  t: (key: TranslationKey, values?: TranslationValues) => string;
}

const I18nContext = createContext<I18nValue>({
  language: getSettings().language,
  t: (key, values) => translate(key, values),
});

/**
 * Mirrors ThemeProvider: the chosen language lives in the per-device settings,
 * and changing it there re-renders every screen without restarting the app.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => getSettings().language);

  useEffect(() => subscribeSettings((settings) => setLanguage(settings.language)), []);

  const value = useMemo<I18nValue>(
    () => ({
      language,
      // Bound to the language in state rather than reading the settings again,
      // so a screen cannot render half in one language and half in another.
      t: (key, values) => translate(key, values, language),
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nValue {
  return useContext(I18nContext);
}
