import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneBackground } from "../../../../engine/remotion/components/Shared";
import { useFormat } from "../../../../engine/remotion/format-context";
import { colors, headingFont, bodyFont } from "../../../../engine/remotion/theme";

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const format = useFormat();
  const lineP = spring({ frame, fps, config: { damping: 200, mass: 0.7 } });
  const kickerP = spring({ frame: frame - 30, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <SceneBackground from={colors.navyDark} to="#0e2b22" glow={colors.amber} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: `0 ${format.safeX}px`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: headingFont,
            fontWeight: 800,
            fontSize: 68,
            lineHeight: 1.25,
            color: colors.white,
            opacity: interpolate(lineP, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(lineP, [0, 1], [26, 0])}px)`,
          }}
        >
          Et vous, vous ne verrez plus les balcons de la même façon.
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: bodyFont,
            fontWeight: 600,
            fontSize: 32,
            letterSpacing: 1,
            color: colors.amber,
            opacity: interpolate(kickerP, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(kickerP, [0, 1], [16, 0])}px)`,
          }}
        >
          Génie civil expliqué simplement.
        </div>
      </div>
    </AbsoluteFill>
  );
};
