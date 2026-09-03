import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Background } from "../components/Background";
import { Caption } from "../components/Caption";
import { accentColor, COLORS, FONT_FAMILY } from "../theme";

const Bar: React.FC<{
  label: string; value: number; text: string; color: string;
  delay: number; frame: number; fps: number; maxH: number;
}> = ({ label, value, text, color, delay, frame, fps, maxH }) => {
  const grow = interpolate(frame - delay, [0, fps * 0.9], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const h = maxH * (value / 100) * grow;
  const op = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 260 }}>
      <div style={{
        fontFamily: FONT_FAMILY, fontWeight: 900, fontSize: 34, color, opacity: op, marginBottom: 14,
      }}>{text}</div>
      <div style={{ width: "100%", height: maxH, display: "flex", alignItems: "flex-end" }}>
        <div style={{
          width: "100%", height: h, background: color, borderRadius: "14px 14px 0 0",
          boxShadow: `0 0 40px ${color}55`,
        }} />
      </div>
      <div style={{
        fontFamily: FONT_FAMILY, fontWeight: 600, fontSize: 30, color: COLORS.dim,
        opacity: op, marginTop: 18, textAlign: "center", lineHeight: 1.25,
      }}>{label}</div>
    </div>
  );
};

export const CostScene: React.FC<any> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor(scene.accent);
  const titleOp = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background accent={accent} />
      <div style={{
        position: "absolute", left: 90, right: 90, top: 300,
        fontFamily: FONT_FAMILY, fontWeight: 800, fontSize: 40, color: COLORS.ink, opacity: titleOp,
      }}>Étude vs réparations</div>

      <div style={{
        position: "absolute", left: 0, right: 0, top: 560, display: "flex",
        justifyContent: "center", gap: 90, alignItems: "flex-end",
      }}>
        <Bar label={scene.a_label} value={scene.a_value} text={scene.a_text} color={COLORS.green}
          delay={20} frame={frame} fps={fps} maxH={420} />
        <Bar label={scene.b_label} value={scene.b_value} text={scene.b_text} color={COLORS.danger}
          delay={20 + fps * 0.5} frame={frame} fps={fps} maxH={420} />
      </div>

      <Caption cues={scene.cues} sceneStart={scene.start} accent={accent} />
    </div>
  );
};
