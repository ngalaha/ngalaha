import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneBackground, Kicker } from "../../../engine/remotion/components/Shared";
import { FormatProvider, useFormat } from "../../../engine/remotion/format-context";
import { colors, headingFont } from "../../../engine/remotion/theme";
import { BalconyIllustration } from "./BalconyIllustration";

/**
 * Static poster/thumbnail for the video — not part of the narrative
 * timeline. Rendered as a single still (see scripts, frame ~90 so every
 * spring below has fully settled). Deliberately shows the bare balcony
 * (no poteau) so the thumbnail doesn't spoil or contradict the hook.
 */
export const Thumbnail: React.FC = () => {
  return (
    <FormatProvider format="vertical">
      <ThumbnailInner />
    </FormatProvider>
  );
};

const ThumbnailInner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const format = useFormat();
  const illustrationP = spring({ frame, fps, config: { damping: 200 } });
  const line1P = spring({ frame: frame - 6, fps, config: { damping: 200, mass: 0.7 } });
  const line2P = spring({ frame: frame - 16, fps, config: { damping: 200, mass: 0.7 } });

  return (
    <AbsoluteFill>
      <SceneBackground from={colors.navyDark} to="#2a1420" glow={colors.red} />
      <Kicker label="GÉNIE CIVIL EXPLIQUÉ SIMPLEMENT" accent={colors.red} />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 120,
          height: 980,
          opacity: interpolate(illustrationP, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
          transform: `scale(1.3) translateX(90px)`,
          transformOrigin: "50% 40%",
        }}
      >
        <BalconyIllustration showGlow glowOpacity={0.9} />
      </div>

      <div
        style={{
          position: "absolute",
          left: format.safeX,
          right: format.safeX,
          bottom: 470,
          textAlign: "center",
          fontFamily: headingFont,
          fontWeight: 800,
          fontSize: 82,
          lineHeight: 1.14,
          color: colors.white,
          opacity: line1P,
          transform: `translateY(${interpolate(line1P, [0, 1], [26, 0])}px)`,
          textShadow: "0 6px 30px rgba(0,0,0,0.55)",
        }}
      >
        Ce balcon n'a AUCUN poteau dessous.
      </div>

      <div
        style={{
          position: "absolute",
          left: format.safeX,
          right: format.safeX,
          bottom: 260,
          textAlign: "center",
          fontFamily: headingFont,
          fontWeight: 800,
          fontSize: 68,
          lineHeight: 1.18,
          color: colors.amber,
          opacity: line2P,
          transform: `translateY(${interpolate(line2P, [0, 1], [22, 0])}px)`,
          textShadow: "0 6px 30px rgba(0,0,0,0.55)",
        }}
      >
        Alors... pourquoi il ne tombe pas ?
      </div>
    </AbsoluteFill>
  );
};
