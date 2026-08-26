import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Throwaway style-test composition — NOT part of any project. Demonstrates
 * a colorful, dynamic evolution of the "8 types de plans" white-background
 * blueprint aesthetic: kinetic title reveal, a plan that draws itself
 * stroke-by-stroke, a pulsing "erreur" callout, and a ✗/✓ swipe compare.
 * Delete or promote into a real project once the direction is validated.
 */
const ink = "#12141a";
const red = "#e11d3c";
const orange = "#f5820a";
const blue = "#1d5fd6";
const green = "#189652";
const paper = "#ffffff";
const grid = "#eef0f4";

const easeOut = Easing.out(Easing.cubic);

export const StyleDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // --- Beat 1: kinetic title with a highlight sweep (0 - 42f) ---
  const titleP = spring({ frame, fps, config: { damping: 200, mass: 0.6 } });
  const sweepP = interpolate(frame, [8, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const titleOut = interpolate(frame, [42, 54], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // --- Beat 2: plan draws itself stroke by stroke (48 - 96f) ---
  const drawP = interpolate(frame, [48, 96], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  const planIn = interpolate(frame, [46, 58], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const planOut = interpolate(frame, [128, 140], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // rect perimeter path length used to animate stroke-dashoffset
  const rectPerimeter = 2 * (360 + 260);

  // --- Beat 3: pulsing "erreur" callout (86 - 128f) ---
  const pulse = interpolate(((frame - 86) % 24) / 24, [0, 0.5, 1], [0.85, 1.15, 0.85]);
  const calloutOpacity = interpolate(frame, [86, 98], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // --- Beat 4: ✗ / ✓ swipe compare (140 - 172f) ---
  const swipeX = interpolate(frame, [140, 168], [width, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: paper }}>
      {/* faint technical grid, always present */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
        <defs>
          <pattern id="tgrid" width={54} height={54} patternUnits="userSpaceOnUse">
            <path d="M 54 0 L 0 0 0 54" fill="none" stroke={grid} strokeWidth={1} />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#tgrid)" />
      </svg>

      {/* progress dots, color-coded */}
      <div style={{ position: "absolute", top: 64, left: 64, display: "flex", gap: 10 }}>
        {[red, orange, blue, green].map((c, i) => (
          <div key={i} style={{ width: 34, height: 6, borderRadius: 3, background: c, opacity: 0.9 }} />
        ))}
      </div>

      {/* Beat 1: kinetic title */}
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          top: 220,
          opacity: Math.min(interpolate(titleP, [0, 1], [0, 1]), titleOut),
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "8%",
              height: "84%",
              width: `${sweepP * 100}%`,
              background: red,
              opacity: 0.18,
              borderRadius: 6,
            }}
          />
          <div
            style={{
              fontFamily: '"Arial Black", Helvetica, Arial, sans-serif',
              fontWeight: 900,
              fontSize: 74,
              lineHeight: 1.08,
              color: ink,
              transform: `translateY(${interpolate(titleP, [0, 1], [30, 0])}px)`,
            }}
          >
            L'ERREUR QUI
          </div>
        </div>
        <div
          style={{
            fontFamily: '"Arial Black", Helvetica, Arial, sans-serif',
            fontWeight: 900,
            fontSize: 74,
            lineHeight: 1.08,
            color: red,
            marginTop: 6,
            transform: `translateY(${interpolate(titleP, [0, 1], [30, 0])}px)`,
            opacity: interpolate(titleP, [0.3, 1], [0, 1], { extrapolateLeft: "clamp" }),
          }}
        >
          COÛTE CHER.
        </div>
      </div>

      {/* Beat 2+3: plan drawing itself + pulsing callout */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 480,
          height: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: Math.min(planIn, planOut),
        }}
      >
        <svg width={520} height={420} viewBox="0 0 520 420">
          <rect
            x={80}
            y={40}
            width={360}
            height={260}
            fill="none"
            stroke={blue}
            strokeWidth={6}
            strokeDasharray={rectPerimeter}
            strokeDashoffset={rectPerimeter * (1 - drawP)}
          />
          {/* a couple of interior partition lines, same draw-on technique */}
          <line
            x1={260}
            y1={40}
            x2={260}
            y2={300}
            stroke={blue}
            strokeWidth={4}
            strokeDasharray={260}
            strokeDashoffset={260 * (1 - Math.max(0, Math.min(1, (drawP - 0.5) * 2)))}
          />
          {/* the "erreur" callout: a pulsing orange ring */}
          <circle
            cx={260}
            cy={170}
            r={46 * pulse}
            fill="none"
            stroke={orange}
            strokeWidth={5}
            opacity={calloutOpacity}
          />
          <circle cx={260} cy={170} r={6} fill={orange} opacity={calloutOpacity} />
        </svg>
      </div>

      {/* Beat 4: swipe compare ✗ -> ✓ */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateX(${swipeX}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            background: paper,
          }}
        >
          <div style={{ fontSize: 220, color: green, fontWeight: 900 }}>✓</div>
          <div
            style={{
              fontFamily: '"Arial Black", Helvetica, Arial, sans-serif',
              fontWeight: 900,
              fontSize: 46,
              color: ink,
              marginTop: 12,
            }}
          >
            LA BONNE MÉTHODE
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 70, left: 64, fontFamily: "monospace", fontSize: 26, color: "#8a8f9a" }}>
        GÉNIE CIVIL
      </div>
    </AbsoluteFill>
  );
};
