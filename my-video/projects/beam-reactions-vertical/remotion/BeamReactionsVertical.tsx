import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig, Video, interpolate, spring } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { FormatProvider, useFormat } from "../../../engine/remotion/format-context";
import { SceneBackground, ProgressDots } from "../../../engine/remotion/components/Shared";
import { colors, headingFont, bodyFont } from "../../../engine/remotion/theme";

const TITLE_FRAMES = 105; // 3.5s
const BEAM_FRAMES = 267; // 8.9s — exact duration of beam_reactions.mp4
const CONCLUSION_FRAMES = 108; // 3.6s
const TRANSITION_FRAMES = 15; // 0.5s

export const TOTAL_DURATION =
  TITLE_FRAMES + BEAM_FRAMES + CONCLUSION_FRAMES - TRANSITION_FRAMES * 2; // 450 frames = 15s @ 30fps

// Centered title/conclusion text block, used by both bookend scenes.
const CenteredText: React.FC<{
  kicker: string;
  kickerAccent: string;
  headline: string;
  sub?: string;
}> = ({ kicker, kickerAccent, headline, sub }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const format = useFormat();

  const kickerP = spring({ frame, fps, config: { damping: 200 } });
  const headlineP = spring({ frame: frame - 12, fps, config: { damping: 200, mass: 0.7 } });
  const subP = spring({ frame: frame - 28, fps, config: { damping: 200 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: `0 ${format.safeX}px`,
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          opacity: kickerP,
          transform: `translateY(${interpolate(kickerP, [0, 1], [16, 0])}px)`,
          marginBottom: 28,
        }}
      >
        <div style={{ width: 30, height: 4, borderRadius: 2, background: kickerAccent }} />
        <span
          style={{
            fontFamily: bodyFont,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: kickerAccent,
          }}
        >
          {kicker}
        </span>
        <div style={{ width: 30, height: 4, borderRadius: 2, background: kickerAccent }} />
      </div>
      <div
        style={{
          fontFamily: headingFont,
          fontWeight: 800,
          fontSize: 78,
          lineHeight: 1.12,
          color: colors.white,
          maxWidth: width - format.safeX * 2,
          opacity: interpolate(headlineP, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(headlineP, [0, 1], [30, 0])}px)`,
        }}
      >
        {headline}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: bodyFont,
            fontWeight: 400,
            fontSize: 38,
            lineHeight: 1.4,
            color: colors.mist,
            maxWidth: width - format.safeX * 2 - 60,
            marginTop: 26,
            opacity: subP,
            transform: `translateY(${interpolate(subP, [0, 1], [20, 0])}px)`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};

const TitleScene: React.FC = () => (
  <AbsoluteFill>
    <SceneBackground from={colors.navyDark} to="#0c2436" glow={colors.green} />
    <ProgressDots total={3} active={0} />
    <CenteredText
      kicker="Mécanique des structures"
      kickerAccent={colors.green}
      headline="Comment une poutre reste en équilibre ?"
      sub="Une poutre, deux appuis, une charge : voyons comment les forces se répondent."
    />
  </AbsoluteFill>
);

const BeamScene: React.FC = () => {
  const { width } = useVideoConfig();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const format = useFormat();

  const cardP = spring({ frame, fps, config: { damping: 200 } });
  const captionP = spring({ frame: frame - 8, fps, config: { damping: 200 } });

  const cardWidth = width - format.safeX * 2;
  const cardHeight = (cardWidth * 1080) / 1920;
  const cardTop = 640;

  return (
    <AbsoluteFill>
      <SceneBackground from={colors.navyDark} to="#0c2436" glow={colors.green} />
      <ProgressDots total={3} active={1} />

      <div
        style={{
          position: "absolute",
          top: 220,
          left: 0,
          right: 0,
          textAlign: "center",
          padding: `0 ${format.safeX}px`,
          opacity: captionP,
          transform: `translateY(${interpolate(captionP, [0, 1], [16, 0])}px)`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ width: 30, height: 4, borderRadius: 2, background: colors.amber }} />
          <span
            style={{
              fontFamily: bodyFont,
              fontWeight: 600,
              fontSize: 26,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: colors.amber,
            }}
          >
            Démonstration
          </span>
        </div>
        <div
          style={{
            fontFamily: bodyFont,
            fontWeight: 500,
            fontSize: 40,
            lineHeight: 1.35,
            color: colors.white,
          }}
        >
          Regardez comment les appuis A et B réagissent à la charge P.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: cardTop,
          left: format.safeX,
          width: cardWidth,
          height: cardHeight,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 40px 80px #00000066",
          opacity: interpolate(cardP, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
          transform: `scale(${interpolate(cardP, [0, 1], [0.92, 1])})`,
        }}
      >
        <Video
          src={staticFile("manim-render/beam_reactions.webm")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: cardTop + cardHeight + 60,
          left: 0,
          right: 0,
          textAlign: "center",
          padding: `0 ${format.safeX}px`,
          fontFamily: bodyFont,
          fontWeight: 400,
          fontSize: 34,
          color: colors.mist,
          opacity: captionP,
        }}
      >
        Les réactions R_A et R_B équilibrent la charge P.
      </div>
    </AbsoluteFill>
  );
};

const ConclusionScene: React.FC = () => (
  <AbsoluteFill>
    <SceneBackground from={colors.navyDark} to="#0e2b22" glow={colors.amber} />
    <ProgressDots total={3} active={2} />
    <CenteredText
      kicker="En résumé"
      kickerAccent={colors.amber}
      headline="Chaque force a sa réaction."
      sub="C'est ce principe simple qui permet à toute structure de tenir debout."
    />
  </AbsoluteFill>
);

export const BeamReactionsVertical: React.FC = () => {
  return (
    <FormatProvider format="vertical">
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={TITLE_FRAMES}>
          <TitleScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={BEAM_FRAMES}>
          <BeamScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={CONCLUSION_FRAMES}>
          <ConclusionScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </FormatProvider>
  );
};
