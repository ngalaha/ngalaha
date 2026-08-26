import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, Video } from "remotion";
import { colors } from "../../../../engine/remotion/theme";
import { ScrimCaption } from "../ScrimCaption";

const PHASES = [
  {
    start: 0,
    end: 234,
    kicker: "Révélation",
    text: "Le mur ne fait pas que porter le balcon : il l'empêche aussi de tourner.",
    accent: colors.amber,
  },
  {
    start: 234,
    end: 537,
    kicker: "La preuve",
    text: "Un simple appui laisserait tout basculer. Un encastrement bloque la rotation.",
    accent: colors.mist,
  },
  {
    start: 537,
    end: 762,
    kicker: "Deux rôles du mur",
    text: "Il pousse vers le haut pour porter le poids, et résiste à la rotation pour ne pas basculer.",
    accent: colors.green,
  },
];

export const MechClip1Scene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: colors.navyDark }}>
      <Video src={staticFile("manim-render/mechanics_clip1.webm")} style={{ width: "100%", height: "100%" }} />
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
