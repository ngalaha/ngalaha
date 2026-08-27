import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { WhitePaper, ProgressDots, Kicker, Beat, Brand, colors } from "../Shared";

const Vignette: React.FC<{ x: number; label: string; swell: number; color: string }> = ({ x, label, swell, color }) => (
  <svg width={280} height={260} viewBox="0 0 280 260" style={{ position: "absolute", left: x, top: 0 }}>
    <text x={140} y={26} fontSize={26} fontWeight={800} fill={color} textAnchor="middle" fontFamily="Arial Black">
      {label}
    </text>
    <line x1={20} y1={50} x2={260} y2={50} stroke={colors.ink} strokeWidth={4} />
    {/* soil surface bulges up (swell) or dips down (shrink) */}
    <path
      d={`M 20 50 Q 140 ${50 - swell} 260 50`}
      fill="none"
      stroke={color}
      strokeWidth={4}
    />
    <rect x={110} y={50 + 60} width={60} height={24} fill="none" stroke={colors.ink} strokeWidth={3} />
    <line x1={20} y1={200} x2={260} y2={200} stroke={colors.gray} strokeWidth={2} strokeDasharray="6,6" />
    <text x={140} y={222} fontSize={16} fill={colors.gray} textAnchor="middle">
      zone stable (1,20 m)
    </text>
  </svg>
);

export const PourquoiScene: React.FC = () => {
  const frame = useCurrentFrame();
  const cycle = (frame % 90) / 90;
  const swell = Math.sin(cycle * Math.PI * 2) * 10;

  return (
    <AbsoluteFill>
      <WhitePaper />
      <Kicker label="Pourquoi" accent={colors.blue} />
      <ProgressDots active={4} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 340, display: "flex", justifyContent: "center", gap: 20 }}>
        <div style={{ position: "relative", width: 600, height: 260 }}>
          <Vignette x={0} label="HIVER" swell={10 + swell} color={colors.blue} />
          <Vignette x={310} label="ÉTÉ" swell={-10 + swell} color={colors.orange} />
        </div>
      </div>

      <Beat text="L'argile gonfle avec l'humidité, et se rétracte avec la sécheresse." start={4} end={155} bottom={700} size={40} color={colors.ink} />
      <Beat
        text="Ce mouvement se joue entre la surface et un mètre vingt de profondeur."
        start={155}
        end={335}
        bottom={700}
        size={40}
        color={colors.ink}
      />
      <Beat text="En dessous, le sol reste stable toute l'année." start={335} end={505} bottom={700} size={44} color={colors.green} />
      <Brand />
    </AbsoluteFill>
  );
};
