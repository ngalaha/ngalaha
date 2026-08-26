import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneBackground, Kicker } from "../../../../engine/remotion/components/Shared";
import { useFormat } from "../../../../engine/remotion/format-context";
import { colors, headingFont } from "../../../../engine/remotion/theme";
import { BalconyIllustration } from "../BalconyIllustration";

const BigLine: React.FC<{ text: string; start: number; end: number; color?: string }> = ({
  text,
  start,
  end,
  color = colors.white,
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
        fontSize: 76,
        lineHeight: 1.15,
        color,
        opacity,
        transform: `translateY(${interpolate(inP, [0, 1], [26, 0])}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = interpolate(frame, [0, 150], [1, 1.08], { extrapolateRight: "clamp" });
  const illustrationP = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <SceneBackground from={colors.navyDark} to="#241826" glow={colors.red} />
      <Kicker label="GÉNIE CIVIL" accent={colors.red} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 60,
          height: 900,
          opacity: interpolate(illustrationP, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
          transform: `scale(${zoom})`,
          transformOrigin: "50% 45%",
        }}
      >
        <BalconyIllustration />
      </div>
      <BigLine text="Ce balcon n'a AUCUN poteau dessous." start={4} end={62} color={colors.white} />
      <BigLine text="Alors... pourquoi ne tombe-t-il pas ?" start={64} end={150} color={colors.amber} />
    </AbsoluteFill>
  );
};
