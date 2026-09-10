/**
 * MA2D Construction colour palettes — high-contrast, professional,
 * readable in bright outdoor light and usable with work gloves
 * (large touch targets are defined in components, not here).
 *
 * Two palettes with identical keys: a screen styles itself once, against
 * whichever one the theme provides. The light one stays the default —
 * outdoors, in sunlight, it is the readable one.
 */

export const LIGHT_COLORS = {
  background: '#F4F6F8',
  surface: '#FFFFFF',
  primary: '#0F2A43', // deep construction blue
  primaryDark: '#081A2C',
  accent: '#F5A623', // safety orange/amber — call to action
  success: '#1E8E3E',
  warning: '#D9822B',
  danger: '#C62828',
  textPrimary: '#141B22',
  textSecondary: '#5B6572',
  textOnPrimary: '#FFFFFF',
  border: '#D8DEE4',
  overlay: 'rgba(15, 42, 67, 0.55)',
} as const;

export type ThemeColors = { [K in keyof typeof LIGHT_COLORS]: string };

export const DARK_COLORS: ThemeColors = {
  background: '#101418',
  surface: '#1A2028',
  // Inverted on purpose: the deep blue disappears on a dark ground, so the
  // "primary" role is carried by a light tint and headers become surfaces.
  primary: '#8FB4D9',
  primaryDark: '#0B0F14',
  accent: '#F5A623', // the safety amber reads well on both grounds
  success: '#4CAF6A',
  warning: '#E0A15A',
  danger: '#EF5350',
  textPrimary: '#ECEFF3',
  textSecondary: '#9AA5B1',
  textOnPrimary: '#101418',
  border: '#2B3440',
  overlay: 'rgba(0, 0, 0, 0.65)',
};

/**
 * The light palette, for the few places that render outside the provider
 * (module-level constants, the splash window). Screens read useTheme()
 * instead, so they follow the operator's choice.
 */
export const colors: ThemeColors = LIGHT_COLORS;
