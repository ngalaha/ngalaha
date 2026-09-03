import React from "react";
import { COLORS } from "../theme";

export const Background: React.FC<{ accent: string }> = ({ accent }) => (
  <div style={{ position: "absolute", inset: 0, background: COLORS.bg, overflow: "hidden" }}>
    <div style={{
      position: "absolute", inset: 0,
      background: `radial-gradient(circle at 50% 82%, ${accent}22 0%, transparent 55%),` +
        `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.bgAlt} 100%)`,
    }} />
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.05 }}>
      <defs>
        <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M 64 0 L 0 0 0 64" fill="none" stroke="#ffffff" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
);
