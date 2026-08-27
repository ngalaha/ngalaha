import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { WhitePaper, ProgressDots, Kicker, Beat, Brand, colors, monoFont } from "../Shared";

const RuleCard: React.FC<{ label: string; sub: string; color: string; big?: boolean; p: number }> = ({
  label,
  sub,
  color,
  big,
  p,
}) => (
  <div
    style={{
      opacity: p,
      transform: `scale(${interpolate(p, [0, 1], [0.85, big ? 1.08 : 1])})`,
      border: `4px solid ${color}`,
      borderRadius: 16,
      padding: "24px 32px",
      textAlign: "center",
      background: big ? `${color}10` : "transparent",
    }}
  >
    <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 26, color }}>{label}</div>
    <div style={{ fontFamily: monoFont, fontSize: 18, color: colors.gray, marginTop: 6 }}>{sub}</div>
  </div>
);

export const DeuxReglesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const card1P = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const card2P = interpolate(frame, [15, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const winnerP = interpolate(frame, [260, 290], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <WhitePaper />
      <Kicker label="Retenez ceci" accent={colors.green} />
      <ProgressDots active={7} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 420, display: "flex", justifyContent: "center", gap: 30 }}>
        <RuleCard label="Profondeur hors-gel" sub="dépend du climat" color={colors.blue} p={card1P} big={winnerP < 0.5} />
        <RuleCard label="Profondeur / sol" sub="dépend du terrain" color={colors.orange} p={card2P} big={winnerP >= 0.5} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 660,
          textAlign: "center",
          fontFamily: monoFont,
          fontWeight: 700,
          fontSize: 30,
          color: colors.green,
          opacity: winnerP,
        }}
      >
        → toujours la plus grande des deux
      </div>

      <Beat text="Retenez ceci : il existe toujours deux profondeurs à vérifier." start={0} end={127} bottom={640} size={40} color={colors.ink} />
      <Beat text="La profondeur hors-gel, et la profondeur liée au sol." start={127} end={262} bottom={640} size={40} color={colors.ink} />
      <Beat text="C'est toujours la plus grande des deux qui s'applique." start={262} end={390} bottom={640} size={42} color={colors.green} />
      <Brand />
    </AbsoluteFill>
  );
};
