import React from "react";
import { AbsoluteFill, Audio, Easing, staticFile } from "remotion";
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

// Each scene's duration was tuned individually against the voiceover
// (public/audio/voiceover.mp3, ffprobe-measured 92.9175s) rather than
// applying one uniform stretch factor: the two Manim clips were
// re-rendered with reworked internal pacing (extra held beats, a more
// progressive lever-arm reveal, and real per-value highlight animations
// in the calculation) so they play at their native speed, and the
// Remotion-authored scenes got their text hold times extended to match.
// Original (silent-cut) values, kept for reference: hook 120 (4.0s),
// charges 180 (6.0s), clip1 762 (25.4s), clip2 696 (23.2s), retour 210
// (7.0s), cta 150 (5.0s).
export const DURATIONS = {
  hook: 150, // 5.0s (+1.0s: hold the question longer)
  charges: 267, // 8.9s (+2.9s: staged dalle -> meubles -> personne -> poteau)
  clip1: 903, // 30.1s (+2.6s Révélation, -0.8s La preuve, +2.9s Deux rôles)
  clip2: 1038, // 34.6s (+4.6s Bras de levier, +6.8s Le calcul)
  retour: 219, // 7.3s
  cta: 276, // 9.2s (extra margin so the voiceover is never cut, see below)
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

// Eased rather than a perfectly linear opacity ramp, so every crossfade
// accelerates in and decelerates out instead of blending at a constant
// rate — reads as a smoother, more deliberate cut between scenes.
const fadeTiming = linearTiming({
  durationInFrames: TRANSITION_FRAMES,
  easing: Easing.inOut(Easing.ease),
});

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
