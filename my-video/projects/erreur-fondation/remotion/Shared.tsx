import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useFormat } from "../../../engine/remotion/format-context";
import { colors, bodyFont, headingFont, monoFont } from "./theme";

export const easeInOut = Easing.inOut(Easing.ease);

/** White background + faint technical grid, consistent across every scene. */
export const WhitePaper: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
        <defs>
          <pattern id="paperGrid" width={54} height={54} patternUnits="userSpaceOnUse">
            <path d="M 54 0 L 0 0 0 54" fill="none" stroke={colors.grid} strokeWidth={1} />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#paperGrid)" />
      </svg>
    </AbsoluteFill>
  );
};

const STAGE_COLORS = [colors.red, colors.red, colors.orange, colors.orange, colors.blue, colors.blue, colors.blue, colors.green, colors.green];

/** Colored progress dots, one per scene (9 total), current one widened. */
export const ProgressDots: React.FC<{ active: number }> = ({ active }) => {
  const format = useFormat();
  return (
    <div style={{ position: "absolute", top: 64, left: format.safeX, display: "flex", gap: 8 }}>
      {STAGE_COLORS.map((c, i) => (
        <div
          key={i}
          style={{
            width: i === active ? 34 : 14,
            height: 6,
            borderRadius: 3,
            background: i === active ? c : "#e2e4ea",
          }}
        />
      ))}
    </div>
  );
};

export const Kicker: React.FC<{ label: string; accent?: string }> = ({ label, accent = colors.red }) => {
  const format = useFormat();
  return (
    <div
      style={{
        position: "absolute",
        top: 108,
        left: format.safeX,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ width: 26, height: 4, borderRadius: 2, background: accent }} />
      <span
        style={{
          fontFamily: monoFont,
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: accent,
        }}
      >
        {label}
      </span>
    </div>
  );
};

/** A text beat that fades/slides in at `start` and fades out at `end`
 * (local frame numbers within the parent Sequence). Used for every line
 * of narration captioned on screen across all 9 scenes. */
export const Beat: React.FC<{
  text: string;
  start: number;
  end: number;
  size?: number;
  color?: string;
  weight?: number;
  font?: string;
  top?: number;
  bottom?: number;
  highlight?: string;
}> = ({ text, start, end, size = 52, color = colors.ink, weight = 800, font = headingFont, top, bottom, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const format = useFormat();
  const inP = spring({ frame: frame - start, fps, config: { damping: 200, mass: 0.7 } });
  const outP = interpolate(frame, [end - 12, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });
  const opacity = Math.min(interpolate(inP, [0, 1], [0, 1], { extrapolateRight: "clamp" }), outP);
  if (frame < start - 2 || opacity <= 0) return null;

  const sweepP = interpolate(frame, [start, start + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: format.safeX,
        right: format.safeX,
        top,
        bottom,
        textAlign: "center",
        opacity,
        transform: `translateY(${interpolate(inP, [0, 1], [22, 0])}px)`,
      }}
    >
      <span
        style={{
          fontFamily: font,
          fontWeight: weight,
          fontSize: size,
          lineHeight: 1.25,
          color,
          background: highlight
            ? `linear-gradient(90deg, ${highlight} ${sweepP * 100}%, transparent ${sweepP * 100}%)`
            : undefined,
          boxDecorationBreak: "clone" as const,
          WebkitBoxDecorationBreak: "clone" as const,
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const Brand: React.FC = () => {
  const format = useFormat();
  return (
    <div
      style={{
        position: "absolute",
        bottom: 70,
        left: format.safeX,
        fontFamily: monoFont,
        fontSize: 24,
        color: colors.gray,
      }}
    >
      GÉNIE CIVIL
    </div>
  );
};

/** Wraps a scene with a short opacity fade in/out at its own start/end —
 * a soft dissolve between scenes without using TransitionSeries overlaps,
 * which would shift every scene's start away from the exact timestamps
 * derived from the voiceover's silence analysis. `duration` is that
 * scene's own Sequence durationInFrames. */
export const SceneFade: React.FC<{ duration: number; children: React.ReactNode }> = ({ duration, children }) => {
  const frame = useCurrentFrame();
  const opacity = Math.min(
    interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut }),
    interpolate(frame, [duration - 10, duration], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeInOut,
    })
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export { colors, bodyFont, headingFont, monoFont };
