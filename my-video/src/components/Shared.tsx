import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, headingFont, bodyFont, SAFE_X } from "../theme";

export const SceneBackground: React.FC<{
  from: string;
  to: string;
  glow?: string;
}> = ({ from, to, glow = colors.amber }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const drift = interpolate(frame, [0, 900], [0, 40], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(155deg, ${from} 0%, ${to} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: width * 0.9,
          height: width * 0.9,
          borderRadius: "50%",
          top: -width * 0.45 + drift,
          right: -width * 0.35,
          background: `radial-gradient(circle, ${glow}22 0%, transparent 65%)`,
        }}
      />
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, opacity: 0.05 }}
      >
        <defs>
          <pattern id="grid" width={64} height={64} patternUnits="userSpaceOnUse">
            <path d="M 64 0 L 0 0 0 64" fill="none" stroke="#ffffff" strokeWidth={1} />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />
      </svg>
    </div>
  );
};

export const Kicker: React.FC<{ label: string; accent?: string; delay?: number }> = ({
  label,
  accent = colors.amber,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px)`,
        marginLeft: SAFE_X,
      }}
    >
      <div style={{ width: 36, height: 4, borderRadius: 2, background: accent }} />
      <span
        style={{
          fontFamily: bodyFont,
          fontWeight: 600,
          fontSize: 30,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: accent,
        }}
      >
        {label}
      </span>
    </div>
  );
};

export const Headline: React.FC<{
  text: string;
  delay?: number;
  fontSize?: number;
  maxWidth?: number;
  color?: string;
}> = ({ text, delay = 6, fontSize = 108, maxWidth = 1500, color = colors.white }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");

  return (
    <div
      style={{
        marginLeft: SAFE_X,
        marginTop: 26,
        maxWidth,
        fontFamily: headingFont,
        fontWeight: 800,
        fontSize,
        lineHeight: 1.08,
        color,
      }}
    >
      {words.map((w, i) => {
        const p = spring({
          frame: frame - delay - i * 2.6,
          fps,
          config: { damping: 200, mass: 0.6 },
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [34, 0])}px)`,
              marginRight: fontSize * 0.24,
              whiteSpace: "nowrap",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Sub: React.FC<{
  text: string;
  delay?: number;
  fontSize?: number;
  maxWidth?: number;
  color?: string;
}> = ({ text, delay = 22, fontSize = 46, maxWidth = 1300, color = colors.mist }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <p
      style={{
        marginLeft: SAFE_X,
        marginTop: 34,
        maxWidth,
        fontFamily: bodyFont,
        fontWeight: 400,
        fontSize,
        lineHeight: 1.4,
        color,
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [22, 0])}px)`,
      }}
    >
      {text}
    </p>
  );
};

export const IconBadge: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
  bg?: string;
  ring?: string;
  x: number;
  y: number;
}> = ({ children, delay = 0, size = 120, bg = colors.navyLight, ring = colors.amber, x, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 12, mass: 0.5 } });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        border: `3px solid ${ring}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: interpolate(p, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
        transform: `scale(${p})`,
        boxShadow: `0 0 40px ${ring}33`,
      }}
    >
      {children}
    </div>
  );
};

export const ProgressDots: React.FC<{ total: number; active: number }> = ({
  total,
  active,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 70,
        right: SAFE_X,
        display: "flex",
        gap: 14,
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === active ? 46 : 14,
            height: 14,
            borderRadius: 7,
            background: i === active ? colors.amber : "#ffffff33",
            transition: "none",
          }}
        />
      ))}
    </div>
  );
};
