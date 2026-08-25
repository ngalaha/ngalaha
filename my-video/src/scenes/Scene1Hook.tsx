import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneBackground, Kicker, Headline, Sub, ProgressDots } from "../components/Shared";
import { colors, headingFont } from "../theme";

const CrackedHouse: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const houseIn = spring({ frame, fps, config: { damping: 200 } });
  const crackProgress = interpolate(frame, [55, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shake =
    crackProgress > 0.05 && crackProgress < 1
      ? Math.sin(frame * 2.4) * (1 - crackProgress) * 3
      : 0;

  const crackLength = 620;

  return (
    <div
      style={{
        position: "absolute",
        right: 130,
        top: 200,
        opacity: houseIn,
        transform: `translateY(${interpolate(houseIn, [0, 1], [40, 0])}px) translateX(${shake}px)`,
      }}
    >
      <svg width={640} height={620} viewBox="0 0 640 620" fill="none">
        {/* roof */}
        <path d="M40 220 L320 40 L600 220" stroke={colors.mist} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        {/* walls */}
        <rect x="90" y="210" width="460" height="380" rx="6" fill={colors.navyLight} stroke={colors.mist} strokeWidth={6} />
        {/* windows */}
        <rect x="140" y="270" width="90" height="90" rx="8" fill={colors.navyDark} stroke={colors.mist} strokeWidth={4} />
        <rect x="410" y="270" width="90" height="90" rx="8" fill={colors.navyDark} stroke={colors.mist} strokeWidth={4} />
        {/* door */}
        <rect x="275" y="420" width="90" height="170" rx="6" fill={colors.navyDark} stroke={colors.mist} strokeWidth={4} />
        {/* crack, drawn progressively */}
        <path
          d="M320 210 L300 300 L340 340 L290 420 L330 470 L300 590"
          stroke={colors.red}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={crackLength}
          strokeDashoffset={crackLength * (1 - crackProgress)}
        />
      </svg>
    </div>
  );
};

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punch = spring({ frame: frame - 250, fps, config: { damping: 14, mass: 0.6 } });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <SceneBackground from={colors.navyDark} to="#241826" glow={colors.red} />
      <ProgressDots total={5} active={0} />
      <div style={{ position: "absolute", top: 150, left: 0, right: 0 }}>
        <Kicker label="01 — LE PROBLÈME" accent={colors.red} />
        <Headline text="Pourquoi les bâtiments se fissurent-ils ?" maxWidth={1150} />
        <Sub text="Souvent, la cause n'est pas dans les matériaux… mais dans le sol." maxWidth={980} />
      </div>
      <CrackedHouse />
      <div
        style={{
          position: "absolute",
          left: 150,
          bottom: 130,
          opacity: interpolate(punch, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(punch, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: headingFont,
            fontWeight: 800,
            fontSize: 64,
            color: colors.amber,
            background: "#00000040",
            padding: "18px 34px",
            borderRadius: 16,
            border: `2px solid ${colors.amber}`,
            display: "inline-block",
          }}
        >
          La réponse : l'étude de sol.
        </div>
      </div>
    </div>
  );
};
