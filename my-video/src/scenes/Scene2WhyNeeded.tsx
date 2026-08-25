import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneBackground, Kicker, Headline, Sub, ProgressDots } from "../components/Shared";
import { HouseIcon, WarningIcon } from "../components/Icons";
import { colors, bodyFont, headingFont } from "../theme";

const LAYERS = [
  { label: "Terre végétale", color: "#3f6b3a", h: 70 },
  { label: "Argile", color: "#9c6b3e", h: 130 },
  { label: "Sable", color: "#c9a34d", h: 130 },
  { label: "Roche", color: "#6b7280", h: 150 },
  { label: "Eau souterraine", color: "#2f6fa8", h: 100 },
];

const SoilCrossSection: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const width = 560;
  const houseTilt = interpolate(frame, [260, 340], [0, -6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let yCursor = 0;

  return (
    <div style={{ position: "absolute", right: 130, top: 150 }}>
      <div
        style={{
          transform: `rotate(${houseTilt}deg)`,
          transformOrigin: "50% 100%",
          position: "absolute",
          left: width / 2 - 42,
          top: -46,
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 16,
            background: colors.navyLight,
            border: `3px solid ${colors.mist}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: spring({ frame: frame - 20, fps, config: { damping: 200 } }),
          }}
        >
          <HouseIcon size={44} color={colors.white} />
        </div>
      </div>
      <div
        style={{
          position: "relative",
          width,
          borderRadius: 20,
          overflow: "hidden",
          border: `3px solid ${colors.navyLight}`,
          boxShadow: "0 30px 60px #00000055",
        }}
      >
        {LAYERS.map((layer, i) => {
          const delay = 40 + i * 26;
          const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
          const revealY = interpolate(p, [0, 1], [layer.h, 0]);
          yCursor += layer.h;
          const labelP = spring({ frame: frame - delay - 10, fps, config: { damping: 200 } });
          return (
            <div
              key={layer.label}
              style={{
                position: "relative",
                height: layer.h,
                background: layer.color,
                borderTop: i === 0 ? "none" : "1px solid #00000030",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: layer.color,
                  transform: `translateY(${revealY}px)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 24,
                  top: layer.h / 2 - 20,
                  fontFamily: bodyFont,
                  fontWeight: 600,
                  fontSize: 30,
                  color: "#ffffffee",
                  opacity: labelP,
                  transform: `translateX(${interpolate(labelP, [0, 1], [-16, 0])}px)`,
                  textShadow: "0 2px 8px #00000080",
                }}
              >
                {layer.label}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: bodyFont, fontSize: 22, color: colors.mist, textAlign: "center", marginTop: 14 }}>
        Chaque terrain cache une réalité différente
      </div>
    </div>
  );
};

const RISKS = ["s'enfonce", "se fissure", "s'effondre"];

const RiskChips: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 150, top: 560, display: "flex", gap: 20 }}>
      {RISKS.map((r, i) => {
        const delay = 300 + i * 22;
        const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
        return (
          <div
            key={r}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 22px",
              borderRadius: 999,
              background: "#f8717122",
              border: `2px solid ${colors.red}`,
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [18, 0])}px) scale(${interpolate(p, [0, 1], [0.9, 1])})`,
            }}
          >
            <WarningIcon size={26} color={colors.red} />
            <span style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 26, color: colors.white }}>
              Le bâtiment {r}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const Scene2WhyNeeded: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punch = spring({ frame: frame - 460, fps, config: { damping: 14, mass: 0.6 } });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <SceneBackground from={colors.navyDark} to="#241d10" glow={colors.clay} />
      <ProgressDots total={5} active={1} />
      <div style={{ position: "absolute", top: 150, left: 0, right: 0 }}>
        <Kicker label="02 — POURQUOI C'EST INDISPENSABLE" accent={colors.clay} />
        <Headline text="Chaque terrain est différent." maxWidth={1000} fontSize={100} />
        <Sub text="Argile, sable, roche, eau... construire sans le savoir, c'est prendre un risque." maxWidth={900} />
      </div>
      <SoilCrossSection />
      <RiskChips />
      <div
        style={{
          position: "absolute",
          left: 150,
          bottom: 90,
          opacity: interpolate(punch, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(punch, [0, 1], [26, 0])}px)`,
          fontFamily: headingFont,
          fontWeight: 800,
          fontSize: 54,
          color: colors.amber,
        }}
      >
        L'étude de sol évite ces risques, dès le départ.
      </div>
    </div>
  );
};
