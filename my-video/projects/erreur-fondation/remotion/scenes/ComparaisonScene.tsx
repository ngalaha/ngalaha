import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { WhitePaper, ProgressDots, Kicker, Beat, Brand, colors } from "../Shared";

const CrackWall: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 280 280">
    <rect x={40} y={20} width={200} height={200} fill="none" stroke={colors.ink} strokeWidth={5} />
    <path
      d="M 140 20 L 130 70 L 150 110 L 125 150 L 140 200"
      fill="none"
      stroke={colors.red}
      strokeWidth={4}
    />
    <text x={140} y={250} fontSize={54} fontWeight={900} fill={colors.red} textAnchor="middle" fontFamily="Arial Black">
      ✗
    </text>
  </svg>
);

const StableWall: React.FC = () => (
  <svg width={280} height={280} viewBox="0 0 280 280">
    <rect x={40} y={20} width={200} height={200} fill="none" stroke={colors.ink} strokeWidth={5} />
    <text x={140} y={250} fontSize={54} fontWeight={900} fill={colors.green} textAnchor="middle" fontFamily="Arial Black">
      ✓
    </text>
  </svg>
);

export const ComparaisonScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const swipeX = interpolate(frame, [210, 245], [0, -width], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <WhitePaper />
      <Kicker label="La comparaison" accent={colors.green} />
      <ProgressDots active={5} />

      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 380,
            left: 0,
            width: "200%",
            display: "flex",
            transform: `translateX(${swipeX}px)`,
          }}
        >
          <div style={{ width: "50%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <CrackWall />
            <div style={{ fontSize: 34, fontWeight: 800, color: colors.red, marginTop: 12 }}>0,60 m</div>
          </div>
          <div style={{ width: "50%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <StableWall />
            <div style={{ fontSize: 34, fontWeight: 800, color: colors.green, marginTop: 12 }}>1,20 m</div>
          </div>
        </div>
      </div>

      <Beat text="Une fondation à soixante centimètres bouge avec les saisons." start={0} end={58} bottom={640} size={44} color={colors.ink} />
      <Beat text="Le mur se fissure, souvent deux à quatre ans plus tard." start={58} end={208} bottom={640} size={44} color={colors.red} />
      <Beat text="Une fondation à un mètre vingt reste sous cette zone de mouvement." start={210} end={374} bottom={640} size={40} color={colors.ink} />
      <Beat text="Elle ne bouge pas." start={374} end={425} bottom={640} size={54} color={colors.green} weight={900} />
      <Brand />
    </AbsoluteFill>
  );
};
