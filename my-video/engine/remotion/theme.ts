// System font stacks only — Google Fonts would be fetched over the network
// at render time, which this sandbox's egress policy blocks for
// fonts.gstatic.com (TLS trust failure through the proxy). If a project
// later needs a specific brand font, bundle the font file locally instead
// of relying on @remotion/google-fonts.
export const headingFont =
  '"Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const bodyFont =
  '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

// Neutral default palette. Projects are free to override any of these by
// passing their own colors to the shared components instead of importing
// this file.
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
