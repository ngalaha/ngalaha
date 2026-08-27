import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { WhitePaper, ProgressDots, Kicker, Beat, Brand, colors, monoFont } from "../Shared";

export const RevelationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bigP = spring({ frame: frame - 150, fps, config: { damping: 12, mass: 0.6 } });

  return (
    <AbsoluteFill>
      <WhitePaper />
      <Kicker label="Révélation" accent={colors.red} />
      <ProgressDots active={3} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 400, display: "flex", justifyContent: "center", gap: 60 }}>
        <div style={{ textAlign: "center", opacity: 0.4 }}>
          <div style={{ fontFamily: monoFont, fontSize: 44, color: colors.gray, textDecoration: "line-through" }}>0,60 m</div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 500,
          display: "flex",
          justifyContent: "center",
          opacity: interpolate(bigP, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
          transform: `scale(${interpolate(bigP, [0, 1], [0.6, 1])})`,
        }}
      >
        <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 130, color: colors.red }}>1,20 m</div>
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
