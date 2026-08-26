import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { useFormat } from "../../../engine/remotion/format-context";
import { colors, bodyFont } from "../../../engine/remotion/theme";

/**
 * Caption bar for the bottom of a full-bleed Manim clip: dark gradient
 * scrim + kicker + sentence. Manim's own diagrams stay in the upper ~75%
 * of the frame by design, so this never covers anything technical.
 * `localFrame` starts at 0 for this particular caption phase.
 */
export const ScrimCaption: React.FC<{
  kicker: string;
  text: string;
  accent?: string;
  localFrame: number;
}> = ({ kicker, text, accent = colors.amber, localFrame }) => {
  const { fps, width } = useVideoConfig();
  const format = useFormat();
  const p = spring({ frame: localFrame, fps, config: { damping: 200 } });
  const scrimHeight = 480;

  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, width, height: scrimHeight }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, transparent 0%, ${colors.navyDark}cc 45%, ${colors.navyDark} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: format.safeX,
          right: format.safeX,
          bottom: 110,
          opacity: interpolate(p, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(p, [0, 1], [22, 0])}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div style={{ width: 26, height: 4, borderRadius: 2, background: accent }} />
          <span
            style={{
              fontFamily: bodyFont,
              fontWeight: 600,
              fontSize: 24,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              color: accent,
            }}
          >
            {kicker}
          </span>
        </div>
        <div
          style={{
            fontFamily: bodyFont,
            fontWeight: 500,
            fontSize: 42,
            lineHeight: 1.32,
            color: colors.white,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};
