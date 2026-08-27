import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { WhitePaper, ProgressDots, Kicker, Beat, Brand, SoilDefs, colors, monoFont } from "../Shared";

// Each vignette is a self-contained 340-wide soil column: every label
// sits INSIDE that column's own bounds (measured against the column
// width), never in a side margin shared with the neighbouring vignette —
// that margin approach previously truncated "zone active" and "semelle"
// against the SVG's own edge.
const Vignette: React.FC<{ x: number; label: string; swell: number; color: string; patternId: string }> = ({
  x,
  label,
  swell,
  color,
  patternId,
}) => {
  const left = 20;
  const right = 320;
  const groundY = 70;
  const boundaryY = 300;
  const bottom = 390;
  const midX = (left + right) / 2;

  return (
    <svg width={340} height={460} viewBox="0 0 340 460" style={{ position: "absolute", left: x, top: 0 }}>
      <SoilDefs clayId={patternId} fillId={`${patternId}Fill`} />
      <text x={midX} y={26} fontSize={26} fontWeight={800} fill={color} textAnchor="middle" fontFamily="Arial Black">
        {label}
      </text>

      <rect x={left} y={groundY} width={right - left} height={bottom - groundY} fill={`url(#${patternId})`} />

      {/* soil surface bulges up (swell) or dips down (shrink) */}
      <path
        d={`M ${left} ${groundY} Q ${midX} ${groundY - swell} ${right} ${groundY} L ${right} ${groundY + 4} Q ${midX} ${groundY - swell + 4} ${left} ${groundY + 4} Z`}
        fill={colors.paper}
      />
      <path d={`M ${left} ${groundY} Q ${midX} ${groundY - swell} ${right} ${groundY}`} fill="none" stroke={color} strokeWidth={4} />

      <rect x={midX - 78} y={172} width={156} height={52} fill={colors.paper} fillOpacity={0.88} />
      <text x={midX} y={192} fontSize={16} fontFamily={monoFont} fill={colors.ink} textAnchor="middle" fontWeight={700}>
        zone active
      </text>
      <text x={midX} y={214} fontSize={14} fontFamily={monoFont} fill={colors.gray} textAnchor="middle">
        (0 → 1,20 m)
      </text>

      <line x1={left} y1={boundaryY} x2={right} y2={boundaryY} stroke={colors.gray} strokeWidth={2} strokeDasharray="6,6" />
      <line x1={left} y1={boundaryY - 8} x2={left} y2={boundaryY + 8} stroke={colors.gray} strokeWidth={2} />
      <line x1={right} y1={boundaryY - 8} x2={right} y2={boundaryY + 8} stroke={colors.gray} strokeWidth={2} />

      <rect x={midX - 38} y={boundaryY - 8} width={76} height={30} fill={colors.blue} fillOpacity={0.18} stroke={colors.blue} strokeWidth={3} />
      <text x={midX} y={boundaryY - 16} fontSize={13} fontFamily={monoFont} fill={colors.blue} textAnchor="middle">
        semelle
      </text>

      <text x={midX} y={bottom + 30} fontSize={15} fontFamily={monoFont} fill={colors.gray} textAnchor="middle">
        sol stable
      </text>
    </svg>
  );
};

export const PourquoiScene: React.FC = () => {
  const frame = useCurrentFrame();
  const cycle = (frame % 90) / 90;
  const swell = Math.sin(cycle * Math.PI * 2) * 10;

  return (
    <AbsoluteFill>
      <WhitePaper />
      <Kicker label="Pourquoi" accent={colors.blue} />
      <ProgressDots active={4} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 260, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 720, height: 460 }}>
          <Vignette x={0} label="HIVER" swell={10 + swell} color={colors.blue} patternId="pqClayA" />
          <Vignette x={380} label="ÉTÉ" swell={-10 + swell} color={colors.orange} patternId="pqClayB" />
        </div>
      </div>

      <Beat text="L'argile gonfle avec l'humidité, et se rétracte avec la sécheresse." start={4} end={155} bottom={520} size={40} color={colors.ink} />
      <Beat
        text="Ce mouvement se joue entre la surface et un mètre vingt de profondeur."
        start={155}
        end={335}
        bottom={520}
        size={40}
        color={colors.ink}
      />
      <Beat text="En dessous, le sol reste stable toute l'année." start={335} end={505} bottom={520} size={44} color={colors.green} />
      <Brand />
    </AbsoluteFill>
  );
};
