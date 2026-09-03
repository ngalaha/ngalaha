import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Background } from "../components/Background";
import { accentColor, COLORS, FONT_FAMILY } from "../theme";

export const TitleCardScene: React.FC<any> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor(scene.accent);
  const barW = interpolate(spring({ frame, fps, config: { damping: 200 } }), [0, 1], [0, 340]);
  const op = interpolate(frame, [6, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ty = interpolate(frame, [6, 24], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background accent={accent} />
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          fontFamily: FONT_FAMILY, fontWeight: 700, fontSize: 30, letterSpacing: 6,
          color: accent, marginBottom: 22, opacity: op,
        }}>{scene.eyebrow}</div>
        <div style={{ width: barW, height: 6, background: accent, marginBottom: 30 }} />
        <div style={{
          fontFamily: FONT_FAMILY, fontWeight: 900, fontSize: 76, color: COLORS.ink,
          textAlign: "center", padding: "0 80px", lineHeight: 1.15,
          opacity: op, transform: `translateY(${ty}px)`,
        }}>{scene.title}</div>
      </div>
    </div>
  );
};
