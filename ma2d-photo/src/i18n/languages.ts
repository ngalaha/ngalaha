/**
 * The languages the interface is available in. French first: it is the
 * language of the site, of the drawings and of the people using the app every
 * day. English and Spanish are there because a crew is rarely uniform.
 */
export type Language = 'fr' | 'en' | 'es';

export const LANGUAGES: { code: Language; label: string }[] = [
  // Each label is written in its own language: someone who does not read the
  // current one still has to be able to find their own in the list.
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

export const DEFAULT_LANGUAGE: Language = 'fr';

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((entry) => entry.code === value);
}

/**
 * BCP 47 tag for dates and numbers. French stays fr-CA: the app is used in
 * Quebec, where 2026-09-11 is the ordinary way to write a date.
 */
export const LOCALES: Record<Language, string> = {
  fr: 'fr-CA',
  en: 'en-CA',
  es: 'es',
};
