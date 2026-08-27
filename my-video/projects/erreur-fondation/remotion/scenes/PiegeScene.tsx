import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { WhitePaper, ProgressDots, Kicker, Beat, Brand, colors, monoFont } from "../Shared";

export const PiegeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const growP = interpolate(frame, [10, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const checkP = interpolate(frame, [60, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <WhitePaper />
      <Kicker label="Le piège" accent={colors.blue} />
      <ProgressDots active={1} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 420, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 96, color: colors.blue }}>
          {(growP * 0.6).toFixed(2).replace(".", ",")} m
        </div>
        <div
          style={{
            marginTop: 30,
            opacity: checkP,
            transform: `scale(${interpolate(checkP, [0, 1], [0.7, 1])})`,
            fontFamily: monoFont,
            fontWeight: 700,
            fontSize: 34,
            color: colors.green,
            border: `3px solid ${colors.green}`,
            borderRadius: 12,
            padding: "10px 24px",
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
