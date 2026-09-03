import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Background } from "../components/Background";
import { Caption } from "../components/Caption";
import { accentColor, COLORS, FONT_FAMILY } from "../theme";

export const RulerScene: React.FC<any> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor(scene.accent);
  const marks: string[] = scene.marks;

  const titleOp = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const rulerTop = 560;
  const rulerBottom = 1360;
  const rulerH = rulerBottom - rulerTop;
  const lineGrow = interpolate(frame, [20, 20 + fps * 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background accent={accent} />
      <div style={{ position: "absolute", left: 90, right: 90, top: 300 }}>
        <div style={{
          fontFamily: FONT_FAMILY, fontWeight: 800, fontSize: 44, color: COLORS.ink,
          opacity: titleOp, marginBottom: 20,
        }}>{scene.title}</div>
      </div>

      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <line
          x1={200} y1={rulerTop} x2={200} y2={rulerTop + rulerH * lineGrow}
          stroke={accent} strokeWidth={6} strokeLinecap="round"
        />
        {marks.map((m, i) => {
          const frac = (i + 1) / (marks.length + 0.3);
          const y = rulerTop + rulerH * frac;
          const start = 40 + i * fps * 0.6;
          const op = interpolate(frame - start, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const tx = interpolate(frame - start, [0, 18], [-40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const visible = lineGrow >= frac ? 1 : 0;
          return (
            <g key={i} opacity={op * visible} transform={`translate(${tx},0)`}>
              <line x1={170} y1={y} x2={230} y2={y} stroke={accent} strokeWidth={5} strokeLinecap="round" />
              <text x={250} y={y + 14} fontFamily={FONT_FAMILY} fontWeight={800} fontSize={46} fill={COLORS.ink}>{m}</text>
            </g>
          );
        })}
      </svg>

      <Caption cues={scene.cues} sceneStart={scene.start} accent={accent} />
    </div>
  );
};
