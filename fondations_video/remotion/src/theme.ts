export const FONT_FAMILY = "Liberation Sans, Arial, Helvetica, sans-serif";

export const COLORS = {
  bg: "#0a0e1a",
  bgAlt: "#120a14",
  ink: "#f2f4f8",
  dim: "#8a92a8",
  line: "#2a3145",
  danger: "#ff5d5d",
  dangerFill: "rgba(255,93,93,0.14)",
  warning: "#ffab4d",
  warningFill: "rgba(255,171,77,0.14)",
  blue: "#4da6ff",
  blueFill: "rgba(77,166,255,0.14)",
  green: "#3ddc97",
  greenFill: "rgba(61,220,151,0.14)",
};

export type Accent = "danger" | "warning" | "blue" | "green";

export const accentColor = (a: Accent) => COLORS[a];
export const accentFill = (a: Accent) => COLORS[(a + "Fill") as keyof typeof COLORS];

export const W = 1080;
export const H = 1920;
export const FPS = 30;
