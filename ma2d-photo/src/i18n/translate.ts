import { DEFAULT_LANGUAGE, Language } from './languages';
import { TRANSLATIONS } from './translations';

export type TranslationKey = keyof (typeof TRANSLATIONS)['fr'];
export type TranslationValues = Record<string, string | number>;

/**
 * Looks a key up in the chosen language, falling back to French and, failing
 * that, to the key itself. A missing translation must never blank out a button
 * or throw in the middle of a screen: showing the key is ugly but usable, and
 * it names exactly what to add.
 */
export function translate(
  key: TranslationKey,
  values?: TranslationValues,
  language?: Language,
): string {
  const resolved = language ?? readLanguageFromSettings();
  const table = TRANSLATIONS[resolved] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
  const template = table[key] ?? TRANSLATIONS[DEFAULT_LANGUAGE][key] ?? key;
  return values ? fill(template, values) : template;
}

/** Replaces every {name} with the matching value, leaving unknown ones alone. */
function fill(template: string, values: TranslationValues): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

/**
 * Read lazily and through a function rather than imported at module load:
 * appSettings reads the database, and the services that call translate() are
 * imported long before the database is open.
 */
function readLanguageFromSettings(): Language {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { getSettings } = require('@/services/settings/appSettings');
    return getSettings().language;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}
