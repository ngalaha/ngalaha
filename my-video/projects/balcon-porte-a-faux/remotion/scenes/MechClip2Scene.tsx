import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, Video } from "remotion";
import { colors } from "../../../../engine/remotion/theme";
import { ScrimCaption } from "../ScrimCaption";

const PHASES = [
  {
    start: 0,
    end: 303,
    kicker: "Le bras de levier",
    text: "Plus une force est loin du point d'appui, plus elle le fait travailler fort.",
    accent: colors.amber,
  },
  {
    start: 303,
    end: 696,
    kicker: "Le calcul",
    text: "On additionne l'effet du poids réparti et celui du poteau pour obtenir le moment total.",
    accent: colors.green,
  },
];

export const MechClip2Scene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: colors.navyDark }}>
      <Video src={staticFile("manim-render/mechanics_clip2.webm")} style={{ width: "100%", height: "100%" }} />
      {PHASES.map((phase, i) => {
        if (frame < phase.start - 2 || frame >= phase.end) return null;
        const fadeOut = interpolate(frame, [phase.end - 10, phase.end], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
            <ScrimCaption
              kicker={phase.kicker}
              text={phase.text}
              accent={phase.accent}
              localFrame={frame - phase.start}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
