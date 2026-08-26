import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, Video } from "remotion";
import { colors } from "../../../../engine/remotion/theme";
import { ScrimCaption } from "../ScrimCaption";

// Frame boundaries scaled from the source clip's native 696 frames to the
// new 936-frame slot (factor 936/696 ≈ 1.3448, same as the Video's
// playbackRate below) so captions stay aligned with the slowed-down
// animation instead of the original real-time markers.
const PHASES = [
  {
    start: 0,
    end: 407,
    kicker: "Le bras de levier",
    text: "Plus une force est loin du point d'appui, plus elle le fait travailler fort.",
    accent: colors.amber,
  },
  {
    start: 407,
    end: 936,
    kicker: "Le calcul",
    text: "On additionne l'effet du poids réparti et celui du poteau pour obtenir le moment total.",
    accent: colors.green,
  },
];

// Source clip is 696 frames (23.2s) at 30fps; this slot is 936 frames
// (31.2s) to match the voiceover pace, so playback runs at 696/936.
const CLIP_PLAYBACK_RATE = 696 / 936;

export const MechClip2Scene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: colors.navyDark }}>
      <Video
        src={staticFile("manim-render/mechanics_clip2.webm")}
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
