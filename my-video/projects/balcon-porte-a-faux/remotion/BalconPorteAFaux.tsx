import React from "react";
import { AbsoluteFill } from "remotion";
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

// Exact rendered durations of the two Manim clips (ffprobe-measured, see
// project.json) drive these two — everything else is a Remotion-authored
// duration chosen to land the whole video in the 65-70s target.
export const DURATIONS = {
  hook: 120, // 4.0s
  charges: 180, // 6.0s
  clip1: 762, // 25.4s (measured)
  clip2: 696, // 23.2s (measured)
  retour: 210, // 7.0s
  cta: 150, // 5.0s
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
