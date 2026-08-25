import React from "react";

type IconProps = { size?: number; color?: string; strokeWidth?: number };

export const HouseIcon: React.FC<IconProps> = ({ size = 64, color = "#fff", strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 11L12 4l9 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DrillIcon: React.FC<IconProps> = ({ size = 64, color = "#fff", strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2v6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <rect x="7" y="8" width="10" height="4" rx="1" stroke={color} strokeWidth={strokeWidth} />
    <path d="M11 12v3l-2 7h6l-2-7v-3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 22h18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);

export const FlaskIcon: React.FC<IconProps> = ({ size = 64, color = "#fff", strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M9 3h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M10 3v6.5L4.5 19a1.6 1.6 0 0 0 1.4 2.4h12.2a1.6 1.6 0 0 0 1.4-2.4L14 9.5V3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 16h10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);

export const ReportIcon: React.FC<IconProps> = ({ size = 64, color = "#fff", strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 2h9l4 4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    <path d="M14 2v5h5" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    <path d="M8 13h8M8 17h8M8 9h3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);

export const ShieldCheckIcon: React.FC<IconProps> = ({ size = 64, color = "#fff", strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2.5 20 6v6c0 5-3.4 8.4-8 9.5C7.4 20.4 4 17 4 12V6l8-3.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    <path d="m8.5 12 2.5 2.5L16 9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PersonIcon: React.FC<IconProps> = ({ size = 64, color = "#fff", strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="7" r="3.4" stroke={color} strokeWidth={strokeWidth} />
    <path d="M4.5 21c1-4.2 4.2-6.5 7.5-6.5s6.5 2.3 7.5 6.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);

export const WarningIcon: React.FC<IconProps> = ({ size = 64, color = "#fff", strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3 2 20h20L12 3Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    <path d="M12 10v4.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <circle cx="12" cy="17.4" r="0.9" fill={color} />
  </svg>
);

export const RulerIcon: React.FC<IconProps> = ({ size = 64, color = "#fff", strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2.5" y="8" width="19" height="8" rx="1.4" transform="rotate(-8 12 12)" stroke={color} strokeWidth={strokeWidth} />
    <path d="M7 9.5 6.4 12M11 8.7l-.6 2.6M15 7.9l-.6 2.6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);

export const CoinIcon: React.FC<IconProps> = ({ size = 64, color = "#fff", strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
    <path d="M12 7v10M9.5 9.3c0-1.3 1.1-2 2.5-2s2.5.8 2.5 2-1.1 1.7-2.5 2-2.5.7-2.5 2 1.1 2 2.5 2 2.5-.7 2.5-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);
