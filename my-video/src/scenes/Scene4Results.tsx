import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneBackground, Kicker, Headline, Sub, ProgressDots } from "../components/Shared";
import { colors, bodyFont, headingFont } from "../theme";

const FoundationCard: React.FC<{
  title: string;
  note: string;
  deep: boolean;
  delay: number;
  x: number;
}> = ({ title, note, deep, delay, x }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const footingDepth = deep ? 150 : 40;
  const drawP = interpolate(frame, [delay + 20, delay + 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 470,
        width: 480,
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 480,
          height: 300,
          borderRadius: 20,
          background: colors.navyLight,
          border: `2px solid #ffffff22`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <svg width={480} height={300} viewBox="0 0 480 300">
          <rect x="0" y="120" width="480" height="180" fill="#2b3a2a" />
          <rect x="0" y="120" width="480" height="14" fill="#3f6b3a" />
          {/* house */}
          <rect x="190" y="65" width="100" height="60" fill={colors.navy} stroke={colors.mist} strokeWidth={3} />
          <path d="M180 65 L240 32 L300 65" stroke={colors.mist} strokeWidth={5} fill="none" strokeLinejoin="round" />
          {/* footing, drawn progressively */}
          <rect
            x="205"
            y="130"
            width="70"
            height={footingDepth * drawP}
            fill={colors.amber}
            opacity={0.85}
          />
        </svg>
      </div>
      <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 32, color: colors.white, marginTop: 14 }}>
        {title}
      </div>
      <div style={{ fontFamily: bodyFont, fontSize: 22, color: colors.mist, marginTop: 4 }}>{note}</div>
    </div>
  );
};

const RISKS = [
  "Glissements de terrain",
  "Remontées d'eau",
  "Argiles gonflantes",
];

const Checklist: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 1190, top: 470, width: 560 }}>
      <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 26, color: colors.green, letterSpacing: 2 }}>
        RISQUES ANTICIPÉS
      </div>
      {RISKS.map((r, i) => {
        const delay = 90 + i * 30;
        const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
        return (
          <div
            key={r}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginTop: 22,
              opacity: p,
              transform: `translateX(${interpolate(p, [0, 1], [-24, 0])}px)`,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: colors.green,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <path d="M5 12.5 10 17.5 19 7" stroke={colors.navyDark} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: 32, color: colors.white }}>{r}</span>
          </div>
        );
      })}
    </div>
  );
};

export const Scene4Results: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punch = spring({ frame: frame - 660, fps, config: { damping: 14, mass: 0.6 } });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <SceneBackground from={colors.navyDark} to="#0e2b22" glow={colors.green} />
      <ProgressDots total={5} active={3} />
      <div style={{ position: "absolute", top: 150, left: 0, right: 0 }}>
        <Kicker label="04 — À QUOI SERVENT LES RÉSULTATS" accent={colors.green} />
        <Headline text="Un rapport qui guide chaque décision." maxWidth={1500} fontSize={80} />
        <Sub text="Il indique la fondation adaptée et anticipe les risques du terrain." maxWidth={1700} fontSize={36} />
      </div>
      <FoundationCard title="Fondation superficielle" note="Sol stable en surface" deep={false} delay={30} x={150} />
      <FoundationCard title="Fondation profonde" note="Sol instable en profondeur" deep delay={60} x={660} />
      <Checklist />
      <div
        style={{
          position: "absolute",
          left: 150,
          bottom: 55,
          opacity: interpolate(punch, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(punch, [0, 1], [26, 0])}px)`,
          fontFamily: headingFont,
          fontWeight: 800,
          fontSize: 46,
          color: colors.amber,
        }}
      >
        Moins de surprises. Un bâtiment plus sûr et plus durable.
      </div>
    </div>
  );
};
