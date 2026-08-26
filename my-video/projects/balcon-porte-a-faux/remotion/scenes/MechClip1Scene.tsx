import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, Video } from "remotion";
import { colors } from "../../../../engine/remotion/theme";
import { ScrimCaption } from "../ScrimCaption";

// Frame boundaries scaled from the source clip's native 762 frames to the
// new 1025-frame slot (factor 1025/762 ≈ 1.3451, same as the Video's
// playbackRate below) so captions stay aligned with the slowed-down
// animation instead of the original real-time markers.
const PHASES = [
  {
    start: 0,
    end: 315,
    kicker: "Révélation",
    text: "Le mur ne fait pas que porter le balcon : il l'empêche aussi de tourner.",
    accent: colors.amber,
  },
  {
    start: 315,
    end: 722,
    kicker: "La preuve",
    text: "Un simple appui laisserait tout basculer. Un encastrement bloque la rotation.",
    accent: colors.mist,
  },
  {
    start: 722,
    end: 1025,
    kicker: "Deux rôles du mur",
    text: "Il pousse vers le haut pour porter le poids, et résiste à la rotation pour ne pas basculer.",
    accent: colors.green,
  },
];

// Source clip is 762 frames (25.4s) at 30fps; this slot is 1025 frames
// (34.167s) to match the voiceover pace, so playback runs at 762/1025.
const CLIP_PLAYBACK_RATE = 762 / 1025;

export const MechClip1Scene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: colors.navyDark }}>
      <Video
        src={staticFile("manim-render/mechanics_clip1.webm")}
        style={{ width: "100%", height: "100%" }}
        playbackRate={CLIP_PLAYBACK_RATE}
      />
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
