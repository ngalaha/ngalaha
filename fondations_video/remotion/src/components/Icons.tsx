import React from "react";

type P = { size?: number; color?: string };
const base = (size = 64) => ({ width: size, height: size, viewBox: "0 0 64 64" });

export const IconScale: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <line x1="32" y1="10" x2="32" y2="50" stroke={color} strokeWidth="4" />
    <line x1="10" y1="18" x2="54" y2="18" stroke={color} strokeWidth="4" />
    <path d="M10 18 L4 34 A10 8 0 0 0 22 34 L10 18 Z" stroke={color} strokeWidth="3.5" fill="none" />
    <path d="M54 18 L48 34 A10 8 0 0 0 66 34 L54 18 Z" stroke={color} strokeWidth="3.5" fill="none" />
    <line x1="20" y1="52" x2="44" y2="52" stroke={color} strokeWidth="4" />
  </svg>
);

export const IconLayers: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <polygon points="32,8 58,20 32,32 6,20" stroke={color} strokeWidth="4" strokeLinejoin="round" />
    <polyline points="6,32 32,44 58,32" stroke={color} strokeWidth="4" fill="none" strokeLinejoin="round" />
    <polyline points="6,44 32,56 58,44" stroke={color} strokeWidth="4" fill="none" strokeLinejoin="round" />
  </svg>
);

export const IconArrows: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <line x1="32" y1="6" x2="32" y2="58" stroke={color} strokeWidth="4" />
    <polyline points="24,14 32,6 40,14" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
    <polyline points="24,50 32,58 40,50" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
    <line x1="6" y1="32" x2="58" y2="32" stroke={color} strokeWidth="4" />
    <polyline points="14,24 6,32 14,40" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
    <polyline points="50,24 58,32 50,40" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

export const IconClock: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <circle cx="32" cy="34" r="22" stroke={color} strokeWidth="4" />
    <line x1="32" y1="34" x2="32" y2="20" stroke={color} strokeWidth="4" strokeLinecap="round" />
    <line x1="32" y1="34" x2="42" y2="38" stroke={color} strokeWidth="4" strokeLinecap="round" />
    <line x1="22" y1="8" x2="42" y2="8" stroke={color} strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const IconMagnifier: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <circle cx="27" cy="27" r="16" stroke={color} strokeWidth="4" />
    <line x1="39" y1="39" x2="56" y2="56" stroke={color} strokeWidth="5" strokeLinecap="round" />
    <line x1="21" y1="27" x2="33" y2="27" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
  </svg>
);

export const IconSoil: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <line x1="6" y1="20" x2="58" y2="20" stroke={color} strokeWidth="4" />
    <line x1="6" y1="34" x2="58" y2="34" stroke={color} strokeWidth="3" strokeDasharray="6 5" opacity="0.8" />
    <line x1="6" y1="48" x2="58" y2="48" stroke={color} strokeWidth="3" strokeDasharray="6 5" opacity="0.5" />
    <path d="M32 20 L26 34 L36 34 L30 48" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconWeight: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <path d="M22 18 h20 l6 34 h-32 z" stroke={color} strokeWidth="4" strokeLinejoin="round" />
    <path d="M26 18 a6 8 0 0 1 12 0" stroke={color} strokeWidth="4" fill="none" />
    <line x1="32" y1="30" x2="32" y2="44" stroke={color} strokeWidth="4" strokeLinecap="round" />
    <polyline points="26,38 32,44 38,38" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconWind: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <path d="M6 22 h34 a7 7 0 1 0 -7 -10" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M6 34 h44 a7 7 0 1 1 -7 10" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M6 46 h26 a6 6 0 1 1 -6 8" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

export const IconDoor: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <rect x="18" y="8" width="28" height="48" rx="1" stroke={color} strokeWidth="4" />
    <circle cx="38" cy="32" r="2.5" fill={color} />
  </svg>
);

export const IconWindow: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <rect x="12" y="12" width="40" height="40" stroke={color} strokeWidth="4" />
    <line x1="32" y1="12" x2="32" y2="52" stroke={color} strokeWidth="3" />
    <line x1="12" y1="32" x2="52" y2="32" stroke={color} strokeWidth="3" />
    <line x1="14" y1="46" x2="26" y2="34" stroke={color} strokeWidth="3" opacity="0.7" />
  </svg>
);

export const IconPipe: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <path d="M10 16 h20 v20 h24" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
    <line x1="34" y1="30" x2="42" y2="22" stroke={color} strokeWidth="3" opacity="0.7" />
    <line x1="36" y1="34" x2="44" y2="26" stroke={color} strokeWidth="3" opacity="0.5" />
  </svg>
);

export const IconWarning: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <path d="M32 8 L58 54 H6 Z" stroke={color} strokeWidth="4" strokeLinejoin="round" />
    <line x1="32" y1="26" x2="32" y2="38" stroke={color} strokeWidth="4" strokeLinecap="round" />
    <circle cx="32" cy="46" r="2.5" fill={color} />
  </svg>
);

export const IconDrill: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <rect x="26" y="6" width="12" height="18" stroke={color} strokeWidth="4" />
    <line x1="32" y1="24" x2="32" y2="52" stroke={color} strokeWidth="5" strokeDasharray="4 3" />
    <line x1="8" y1="52" x2="56" y2="52" stroke={color} strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const IconCheck: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <circle cx="32" cy="32" r="24" stroke={color} strokeWidth="4" />
    <polyline points="20,32 28,40 44,22" stroke={color} strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconCross: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <circle cx="32" cy="32" r="24" stroke={color} strokeWidth="4" />
    <line x1="22" y1="22" x2="42" y2="42" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
    <line x1="42" y1="22" x2="22" y2="42" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

export const IconCoin: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <circle cx="32" cy="32" r="22" stroke={color} strokeWidth="4" />
    <text x="32" y="41" fontSize="24" fontWeight="800" fill={color} textAnchor="middle">€</text>
  </svg>
);

export const IconFooting: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <rect x="14" y="10" width="36" height="14" stroke={color} strokeWidth="4" />
    <line x1="22" y1="24" x2="22" y2="50" stroke={color} strokeWidth="4" />
    <line x1="42" y1="24" x2="42" y2="50" stroke={color} strokeWidth="4" />
    <line x1="18" y1="50" x2="46" y2="50" stroke={color} strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const IconWater: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <path d="M32 8 C40 24 50 34 50 44 A18 18 0 0 1 14 44 C14 34 24 24 32 8 Z" stroke={color} strokeWidth="4" strokeLinejoin="round" />
  </svg>
);

export const IconCave: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <path d="M6 50 Q10 20 32 18 Q54 20 58 50" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M18 50 Q22 30 32 28 Q42 30 46 50" stroke={color} strokeWidth="3" fill="none" opacity="0.6" />
  </svg>
);

export const IconHeart: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <path d="M32 54 C10 38 6 24 16 15 C24 8 32 14 32 22 C32 14 40 8 48 15 C58 24 54 38 32 54 Z"
      stroke={color} strokeWidth="4" strokeLinejoin="round" />
  </svg>
);

export const IconBookmark: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <path d="M16 8 h32 v48 l-16 -12 l-16 12 z" stroke={color} strokeWidth="4" strokeLinejoin="round" />
  </svg>
);

export const IconBell: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <path d="M18 38 V26 a14 14 0 0 1 28 0 v12 l6 8 H12 Z" stroke={color} strokeWidth="4" strokeLinejoin="round" />
    <path d="M27 52 a5 5 0 0 0 10 0" stroke={color} strokeWidth="4" fill="none" />
  </svg>
);

export const IconMapPin: React.FC<P> = ({ size, color = "#fff" }) => (
  <svg {...base(size)} fill="none">
    <path d="M32 6 C18 6 10 16 10 28 C10 44 32 58 32 58 C32 58 54 44 54 28 C54 16 46 6 32 6 Z" stroke={color} strokeWidth="4" strokeLinejoin="round" />
    <circle cx="32" cy="27" r="8" stroke={color} strokeWidth="3.5" />
  </svg>
);
