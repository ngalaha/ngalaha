// Google Fonts would be fetched over the network at render time, which is
// unreliable in sandboxed environments — use system font stacks instead.
export const headingFont =
  '"Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const bodyFont =
  '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

export const colors = {
  navyDark: "#0a1526",
  navy: "#0f213d",
  navyLight: "#173257",
  amber: "#fbbf24",
  amberDark: "#d97706",
  clay: "#c98a53",
  clayDark: "#8a5a32",
  green: "#34d399",
  greenDark: "#0f9d6b",
  red: "#f87171",
  white: "#f8fafc",
  mist: "#a9c0dc",
};

export const SAFE_X = 150;
export const SAFE_TOP = 170;
export const SAFE_BOTTOM = 170;
