import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, FONT_FAMILY } from "../theme";

type Cue = { text: string; start: number; end: number };

export const Caption: React.FC<{ cues: Cue[]; sceneStart: number; accent: string }> = ({ cues, sceneStart, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = sceneStart + frame / fps;

  let active = cues[0];
  for (const c of cues) {
    if (t >= c.start) active = c;
  }
  const cueFrame = (t - active.start) * fps;
  const pop = spring({ frame: cueFrame, fps, config: { damping: 200, stiffness: 260 } });
  const opacity = interpolate(cueFrame, [0, 4], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{
      position: "absolute", left: 90, right: 90, bottom: 160,
      fontFamily: FONT_FAMILY,
    }}>
      <div style={{
        width: 10, height: 10, background: accent, marginBottom: 18,
        transform: `scale(${pop})`,
      }} />
      <div style={{
        fontSize: 46, fontWeight: 700, color: COLORS.ink, lineHeight: 1.28,
        opacity, transform: `translateY(${interpolate(cueFrame, [0, 6], [16, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" })}px)`,
        textShadow: "0 4px 24px rgba(0,0,0,0.6)",
      }}>
        {active.text}
      </div>
    </div>
  );
};
