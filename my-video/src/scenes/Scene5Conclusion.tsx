import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneBackground, ProgressDots } from "../components/Shared";
import { HouseIcon, ShieldCheckIcon, CoinIcon } from "../components/Icons";
import { colors, bodyFont, headingFont } from "../theme";

export const Scene5Conclusion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const badge = spring({ frame, fps, config: { damping: 11, mass: 0.6 } });
  const house = spring({ frame: frame - 14, fps, config: { damping: 200 } });
  const line1 = spring({ frame: frame - 55, fps, config: { damping: 200 } });
  const line2 = spring({ frame: frame - 85, fps, config: { damping: 200 } });
  const note = spring({ frame: frame - 200, fps, config: { damping: 200 } });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <SceneBackground from={colors.navyDark} to="#0e2b22" glow={colors.green} />
      <ProgressDots total={5} active={4} />

      <div
        style={{
          position: "absolute",
          left: width / 2,
          top: 210,
          transform: `translateX(-50%) scale(${badge})`,
          display: "flex",
          alignItems: "center",
          gap: 30,
        }}
      >
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: colors.navyLight,
            border: `3px solid ${colors.green}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 60px ${colors.green}55`,
          }}
        >
          <HouseIcon size={80} color={colors.white} />
        </div>
        <div
          style={{
            opacity: interpolate(house, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
            transform: `scale(${house}) translateY(${interpolate(house, [0, 1], [10, 0])}px)`,
            marginLeft: -34,
            marginTop: 60,
          }}
        >
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: "50%",
              background: colors.green,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `4px solid ${colors.navyDark}`,
            }}
          >
            <ShieldCheckIcon size={34} color={colors.navyDark} />
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 430,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: headingFont,
            fontWeight: 800,
            fontSize: 96,
            color: colors.white,
            opacity: interpolate(line1, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(line1, [0, 1], [26, 0])}px)`,
          }}
        >
          Avant de construire,
        </div>
        <div
          style={{
            fontFamily: headingFont,
            fontWeight: 800,
            fontSize: 96,
            color: colors.amber,
            opacity: interpolate(line2, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(line2, [0, 1], [26, 0])}px)`,
            marginTop: 6,
          }}
        >
          étudiez ce qu'il y a sous vos pieds.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 130,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          opacity: interpolate(note, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(note, [0, 1], [16, 0])}px)`,
        }}
      >
        <CoinIcon size={38} color={colors.mist} />
        <span style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: 34, color: colors.mist }}>
          Une étude de sol coûte peu, comparé aux réparations qu'elle évite.
        </span>
      </div>
    </div>
  );
};
