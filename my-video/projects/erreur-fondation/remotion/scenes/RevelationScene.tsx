import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { WhitePaper, ProgressDots, Kicker, Beat, Brand, DimV, colors } from "../Shared";

// A to-scale depth comparison, not floating numbers: two ticked dimension
// lines off the same ground line, each ending on a small footing symbol,
// so the difference between 0,60 m and 1,20 m actually reads as depth.
export const RevelationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bigP = spring({ frame: frame - 150, fps, config: { damping: 12, mass: 0.6 } });
  const strikeP = interpolate(frame, [160, 178], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const groundY = 40;
  const scale = 220; // px per metre
  const y60 = groundY + 0.6 * scale;
  const y120 = groundY + 1.2 * scale;

  return (
    <AbsoluteFill>
      <WhitePaper />
      <Kicker label="Révélation" accent={colors.red} />
      <ProgressDots active={3} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center" }}>
        <svg width={420} height={370} viewBox="0 0 420 370">
          <line x1={30} y1={groundY} x2={390} y2={groundY} stroke={colors.ink} strokeWidth={5} />

          <g opacity={0.55}>
            <rect x={118} y={y60 - 10} width={64} height={20} fill={colors.gray} fillOpacity={0.25} stroke={colors.gray} strokeWidth={2} />
            <DimV x={150} y1={groundY} y2={y60} label="0,60 m" color={colors.gray} side="left" size={22} />
            <line
              x1={124} y1={y60 - 26} x2={176} y2={groundY + 6}
              stroke={colors.red} strokeWidth={4} strokeLinecap="round"
              opacity={strikeP}
            />
          </g>

          <g
            style={{
              opacity: interpolate(bigP, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
              transformOrigin: "300px 172px",
              transform: `scale(${interpolate(bigP, [0, 1], [0.7, 1])})`,
            }}
          >
            <rect x={268} y={y120 - 10} width={64} height={20} fill={colors.red} fillOpacity={0.14} stroke={colors.red} strokeWidth={3} />
            <DimV x={300} y1={groundY} y2={y120} label="1,20 m" color={colors.red} side="right" size={26} />
          </g>
        </svg>
      </div>

      <Beat
        text="En zone d'aléa fort, la profondeur minimale n'est plus soixante centimètres."
        start={0}
        end={150}
        bottom={620}
        size={44}
        color={colors.ink}
      />
      <Beat text="C'est un mètre vingt." start={150} end={209} bottom={780} size={54} color={colors.red} weight={900} />
      <Brand />
    </AbsoluteFill>
  );
};
