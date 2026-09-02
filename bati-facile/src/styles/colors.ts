export interface ColorPalette {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primaryText: string;
  secondary: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  card: string;
  cardShadow: string;
}

// Palette terre cuite/ocre — distincte de Calcul Chantier, évoque la brique et la latérite.
export const lightColors: ColorPalette = {
  background: '#FBF7F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F3E9DE',
  primary: '#B5501C',
  primaryText: '#FFFFFF',
  secondary: '#D98A34',
  text: '#241A12',
  textMuted: '#7A6857',
  border: '#E8DCCB',
  success: '#4B8B5A',
  warning: '#C77F16',
  danger: '#C4392C',
  card: '#FFFFFF',
  cardShadow: 'rgba(36, 26, 18, 0.08)',
};

export const darkColors: ColorPalette = {
  background: '#17110C',
  surface: '#211810',
  surfaceAlt: '#2B2015',
  primary: '#E08A4D',
  primaryText: '#17110C',
  secondary: '#E8B15E',
  text: '#F5EDE3',
  textMuted: '#B8A794',
  border: '#3A2C1E',
  success: '#6FBF7F',
  warning: '#E0A542',
  danger: '#E06A5D',
  card: '#211810',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
};
