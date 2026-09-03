import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Background } from "../components/Background";
import { Caption } from "../components/Caption";
import { accentColor, COLORS, FONT_FAMILY } from "../theme";

export const StatsScene: React.FC<any> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor(scene.accent);
  const titleOp = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background accent={accent} />
      <div style={{ position: "absolute", left: 90, right: 90, top: 340 }}>
        <div style={{
          fontFamily: FONT_FAMILY, fontWeight: 800, fontSize: 40, color: COLORS.ink,
          opacity: titleOp, marginBottom: 70,
        }}>{scene.title}</div>
        {scene.stats.map((s: any, i: number) => {
          const start = 20 + i * fps * 0.5;
          const op = interpolate(frame - start, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const ty = interpolate(frame - start, [0, 18], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ opacity: op, transform: `translateY(${ty}px)`, marginBottom: 56 }}>
              <div style={{ fontFamily: FONT_FAMILY, fontWeight: 900, fontSize: 110, color: accent, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: FONT_FAMILY, fontWeight: 600, fontSize: 34, color: COLORS.dim, whiteSpace: "pre-line", marginTop: 8 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
      <Caption cues={scene.cues} sceneStart={scene.start} accent={accent} />
    </div>
  );
};
