import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { FormatProvider } from "../../../engine/remotion/format-context";
import { colors } from "../../../engine/remotion/theme";

import { HookScene } from "./scenes/HookScene";
import { ChargesScene } from "./scenes/ChargesScene";
import { MechClip1Scene } from "./scenes/MechClip1Scene";
import { MechClip2Scene } from "./scenes/MechClip2Scene";
import { RetourScene } from "./scenes/RetourScene";
import { CTAScene } from "./scenes/CTAScene";

// Every scene's duration is stretched from its original (silent-cut) value
// by the same factor so the whole timeline matches the voiceover
// (public/audio/voiceover.mp3, ffprobe-measured 92.9175s). The two Manim
// clips keep their original pixel content — they are played back slower
// (see playbackRate in MechClip1Scene/MechClip2Scene) rather than
// re-rendered, so their internal animation stays proportionally in sync.
// Original (silent) values, kept for reference: hook 120, charges 180,
// clip1 762, clip2 696, retour 210, cta 150 (stretch factor ~1.3447).
export const DURATIONS = {
  hook: 161, // 5.367s
  charges: 242, // 8.067s
  clip1: 1025, // 34.167s (762 source frames played at rate 762/1025)
  clip2: 936, // 31.2s (696 source frames played at rate 696/936)
  retour: 282, // 9.4s
  cta: 202, // 6.733s
};

const TRANSITION_FRAMES = 12; // 0.4s fade between every scene

export const TOTAL_DURATION =
  DURATIONS.hook +
  DURATIONS.charges +
  DURATIONS.clip1 +
  DURATIONS.clip2 +
  DURATIONS.retour +
  DURATIONS.cta -
  TRANSITION_FRAMES * 5;

const fadeTiming = linearTiming({ durationInFrames: TRANSITION_FRAMES });

export const BalconPorteAFaux: React.FC = () => {
  return (
    <FormatProvider format="vertical">
      <AbsoluteFill style={{ backgroundColor: colors.navyDark }}>
        <Audio src={staticFile("audio/voiceover.mp3")} />
        <TransitionSeries>
          <TransitionSeries.Sequence durationInFrames={DURATIONS.hook}>
            <HookScene />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
          <TransitionSeries.Sequence durationInFrames={DURATIONS.charges}>
            <ChargesScene />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
          <TransitionSeries.Sequence durationInFrames={DURATIONS.clip1}>
            <MechClip1Scene />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
          <TransitionSeries.Sequence durationInFrames={DURATIONS.clip2}>
            <MechClip2Scene />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
          <TransitionSeries.Sequence durationInFrames={DURATIONS.retour}>
            <RetourScene />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
          <TransitionSeries.Sequence durationInFrames={DURATIONS.cta}>
            <CTAScene />
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </AbsoluteFill>
    </FormatProvider>
  );
};
