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

export const lightColors: ColorPalette = {
  background: '#F4F6F5',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F0',
  primary: '#1B5E3A',
  primaryText: '#FFFFFF',
  secondary: '#2F8F5B',
  text: '#15201A',
  textMuted: '#5B6B62',
  border: '#DDE4E0',
  success: '#2F8F5B',
  warning: '#C77F16',
  danger: '#C4392C',
  card: '#FFFFFF',
  cardShadow: 'rgba(21, 32, 26, 0.08)',
};

export const darkColors: ColorPalette = {
  background: '#0F1613',
  surface: '#182019',
  surfaceAlt: '#1F2A22',
  primary: '#3FA76B',
  primaryText: '#08130D',
  secondary: '#5FC38A',
  text: '#EAF2ED',
  textMuted: '#9BAAA1',
  border: '#2A362E',
  success: '#5FC38A',
  warning: '#E0A542',
  danger: '#E06A5D',
  card: '#182019',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
};
