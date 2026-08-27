import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { WhitePaper, ProgressDots, Kicker, Beat, Brand, SoilDefs, colors, monoFont } from "../Shared";

// The growing number is now anchored to an actual to-scale excavation
// drawing (ground line + widening trench + a live dimension tick) instead
// of floating on its own — the number IS the dimension line's reading.
export const PiegeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const growP = interpolate(frame, [10, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const checkP = interpolate(frame, [60, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const groundY = 40;
  const scale = 220;
  const depthPx = groundY + growP * 0.6 * scale;

  return (
    <AbsoluteFill>
      <WhitePaper />
      <Kicker label="Le piège" accent={colors.blue} />
      <ProgressDots active={1} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 220, display: "flex", justifyContent: "center" }}>
        <svg width={340} height={220} viewBox="0 0 340 220">
          <SoilDefs clayId="piegeClay" fillId="piegeFill" />
          <rect x={30} y={groundY} width={280} height={180 - groundY} fill="url(#piegeFill)" opacity={0.5} />
          <line x1={30} y1={groundY} x2={310} y2={groundY} stroke={colors.ink} strokeWidth={5} />

          <rect x={110} y={groundY} width={120} height={Math.max(depthPx - groundY, 0)} fill={colors.paper} stroke={colors.blue} strokeWidth={3} />
          <line x1={104} y1={depthPx} x2={236} y2={depthPx} stroke={colors.blue} strokeWidth={4} />
        </svg>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 480, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 90, color: colors.blue }}>
          {(growP * 0.6).toFixed(2).replace(".", ",")} m
        </div>
        <div
          style={{
            marginTop: 26,
            opacity: checkP,
            transform: `scale(${interpolate(checkP, [0, 1], [0.7, 1])})`,
            fontFamily: monoFont,
            fontWeight: 700,
            fontSize: 32,
            color: colors.green,
            border: `3px solid ${colors.green}`,
            borderRadius: 12,
            padding: "9px 22px",
          }}
        >
          ✓ hors-gel respecté
        </div>
      </div>

      <Beat text="L'entreprise a creusé à soixante centimètres." start={0} end={88} bottom={620} size={50} color={colors.ink} />
      <Beat
        text="C'est exactement la profondeur hors-gel exigée par la norme."
        start={88}
        end={245}
        bottom={480}
        size={46}
        color={colors.gray}
      />
      <Brand />
    </AbsoluteFill>
  );
};
