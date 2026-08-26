import React from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, Video } from "remotion";
import { colors } from "../../../../engine/remotion/theme";
import { ScrimCaption } from "../ScrimCaption";

const easeInOut = Easing.inOut(Easing.ease);

// Frame boundaries match the re-rendered clip's own native pacing (see
// manim/mechanics_clip1.py: recap+encastrement hold = 312f, comparison =
// 264f, reactions/teaser = 327f — 903f / 30.1s total). No playbackRate
// here: the clip was re-timed at the source instead of stretched.
const PHASES = [
  {
    start: 0,
    end: 312,
    kicker: "Révélation",
    text: "Le mur ne fait pas que porter le balcon : il l'empêche aussi de tourner.",
    accent: colors.amber,
  },
  {
    start: 312,
    end: 576,
    kicker: "La preuve",
    text: "Un simple appui laisserait tout basculer. Un encastrement bloque la rotation.",
    accent: colors.mist,
  },
  {
    start: 576,
    end: 903,
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
        const fadeOut = interpolate(frame, [phase.end - 15, phase.end], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeInOut,
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
