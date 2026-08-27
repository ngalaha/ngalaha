import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { WhitePaper, ProgressDots, Kicker, colors, headingFont, monoFont } from "../Shared";
import { useFormat } from "../../../../engine/remotion/format-context";

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const format = useFormat();
  const lineP = spring({ frame, fps, config: { damping: 200, mass: 0.7 } });
  const line2P = spring({ frame: frame - 40, fps, config: { damping: 200, mass: 0.7 } });
  const brandP = spring({ frame: frame - 90, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <WhitePaper />
      <Kicker label="Question" accent={colors.red} />
      <ProgressDots active={8} />

      <div
        style={{
          position: "absolute",
          left: format.safeX,
          right: format.safeX,
          top: 640,
          textAlign: "center",
          fontFamily: headingFont,
          fontWeight: 800,
          fontSize: 62,
          lineHeight: 1.2,
          color: colors.ink,
          opacity: interpolate(lineP, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(lineP, [0, 1], [24, 0])}px)`,
        }}
      >
        Vous avez déjà vu cette erreur sur un chantier ?
      </div>

      <div
        style={{
          position: "absolute",
          left: format.safeX,
          right: format.safeX,
          top: 900,
          textAlign: "center",
          fontFamily: headingFont,
          fontWeight: 800,
          fontSize: 50,
          color: colors.red,
          opacity: interpolate(line2P, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(line2P, [0, 1], [18, 0])}px)`,
        }}
      >
        Dites-le en commentaire.
      </div>

      <div
        style={{
          position: "absolute",
          left: format.safeX,
          right: format.safeX,
          bottom: 200,
          textAlign: "center",
          fontFamily: monoFont,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: colors.gray,
          opacity: interpolate(brandP, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        Génie civil, expliqué simplement.
      </div>
    </AbsoluteFill>
  );
};
