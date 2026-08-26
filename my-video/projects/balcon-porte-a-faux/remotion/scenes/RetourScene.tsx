import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneBackground, Kicker } from "../../../../engine/remotion/components/Shared";
import { useFormat } from "../../../../engine/remotion/format-context";
import { colors, headingFont } from "../../../../engine/remotion/theme";
import { BalconyIllustration } from "../BalconyIllustration";

const BigLine: React.FC<{ text: string; start: number; end: number; color?: string; fontSize?: number }> = ({
  text,
  start,
  end,
  color = colors.white,
  fontSize = 66,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const format = useFormat();
  const inP = spring({ frame: frame - start, fps, config: { damping: 200, mass: 0.7 } });
  const outP = interpolate(frame, [end - 12, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(interpolate(inP, [0, 1], [0, 1], { extrapolateRight: "clamp" }), outP);
  if (frame < start - 2 || opacity <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: format.safeX,
        right: format.safeX,
        bottom: 420,
        textAlign: "center",
        fontFamily: headingFont,
        fontWeight: 800,
        fontSize,
        lineHeight: 1.25,
        color,
        opacity,
        transform: `translateY(${interpolate(inP, [0, 1], [22, 0])}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const RetourScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const illustrationP = spring({ frame, fps, config: { damping: 200 } });
  const glowOpacity = interpolate(frame, [20, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <SceneBackground from={colors.navyDark} to="#0e2b22" glow={colors.green} />
      <Kicker label="RETOUR AU BALCON" accent={colors.green} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 60,
          height: 900,
          opacity: interpolate(illustrationP, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <BalconyIllustration showGlow glowOpacity={glowOpacity} />
      </div>
      <BigLine text="Ce balcon ne tient pas par magie." start={4} end={92} color={colors.white} fontSize={64} />
      <BigLine
        text="L'encastrement transmet les efforts et le moment au bâtiment."
        start={96}
        end={219}
        color={colors.green}
        fontSize={56}
      />
    </AbsoluteFill>
  );
};
