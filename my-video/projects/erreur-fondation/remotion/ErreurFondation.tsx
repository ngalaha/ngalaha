import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";

import { FormatProvider } from "../../../engine/remotion/format-context";
import { SceneFade, colors } from "./Shared";

import { HookScene } from "./scenes/HookScene";
import { PiegeScene } from "./scenes/PiegeScene";
import { ProblemeScene } from "./scenes/ProblemeScene";
import { RevelationScene } from "./scenes/RevelationScene";
import { PourquoiScene } from "./scenes/PourquoiScene";
import { ComparaisonScene } from "./scenes/ComparaisonScene";
import { PlanTechniqueScene } from "./scenes/PlanTechniqueScene";
import { DeuxReglesScene } from "./scenes/DeuxReglesScene";
import { CTAScene } from "./scenes/CTAScene";

// Every duration here comes from analysing the real voiceover
// (public/audio/voiceover.mp3, ffprobe-measured 103.784s): silence
// detection located the 8 scene-transition pauses precisely, and the
// numbers below are the boundaries in between, converted to frames @30fps.
// Scenes use plain <Sequence> (not TransitionSeries) specifically so the
// audio-derived timestamps below are exact — a crossfade's overlap would
// shift every scene's start earlier by the transition length. Each scene
// fades itself in/out internally instead (see SceneFade).
export const DURATIONS = {
  hook: 153, // 5.1s
  piege: 248, // 8.27s
  probleme: 258, // 8.6s
  revelation: 209, // 6.97s
  pourquoi: 518, // 17.27s
  comparaison: 425, // 14.17s
  planTechnique: 672, // 22.4s — exact length of the re-rendered Manim clip
  deuxRegles: 390, // 13.0s
  cta: 265, // 8.83s — includes ~0.8s buffer past the end of the voiceover
};

export const TOTAL_DURATION =
  DURATIONS.hook +
  DURATIONS.piege +
  DURATIONS.probleme +
  DURATIONS.revelation +
  DURATIONS.pourquoi +
  DURATIONS.comparaison +
  DURATIONS.planTechnique +
  DURATIONS.deuxRegles +
  DURATIONS.cta;

export const ErreurFondation: React.FC = () => {
  let cursor = 0;
  const at = (d: number) => {
    const from = cursor;
    cursor += d;
    return from;
  };

  return (
    <FormatProvider format="vertical">
      <AbsoluteFill style={{ backgroundColor: colors.paper }}>
        <Audio src={staticFile("audio/voiceover.mp3")} />

        <Sequence from={at(DURATIONS.hook)} durationInFrames={DURATIONS.hook}>
          <SceneFade duration={DURATIONS.hook}>
            <HookScene />
          </SceneFade>
        </Sequence>
        <Sequence from={at(DURATIONS.piege)} durationInFrames={DURATIONS.piege}>
          <SceneFade duration={DURATIONS.piege}>
            <PiegeScene />
          </SceneFade>
        </Sequence>
        <Sequence from={at(DURATIONS.probleme)} durationInFrames={DURATIONS.probleme}>
          <SceneFade duration={DURATIONS.probleme}>
            <ProblemeScene />
          </SceneFade>
        </Sequence>
        <Sequence from={at(DURATIONS.revelation)} durationInFrames={DURATIONS.revelation}>
          <SceneFade duration={DURATIONS.revelation}>
            <RevelationScene />
          </SceneFade>
        </Sequence>
        <Sequence from={at(DURATIONS.pourquoi)} durationInFrames={DURATIONS.pourquoi}>
          <SceneFade duration={DURATIONS.pourquoi}>
            <PourquoiScene />
          </SceneFade>
        </Sequence>
        <Sequence from={at(DURATIONS.comparaison)} durationInFrames={DURATIONS.comparaison}>
          <SceneFade duration={DURATIONS.comparaison}>
            <ComparaisonScene />
          </SceneFade>
        </Sequence>
        <Sequence from={at(DURATIONS.planTechnique)} durationInFrames={DURATIONS.planTechnique}>
          <SceneFade duration={DURATIONS.planTechnique}>
            <PlanTechniqueScene />
          </SceneFade>
        </Sequence>
        <Sequence from={at(DURATIONS.deuxRegles)} durationInFrames={DURATIONS.deuxRegles}>
          <SceneFade duration={DURATIONS.deuxRegles}>
            <DeuxReglesScene />
          </SceneFade>
        </Sequence>
        <Sequence from={at(DURATIONS.cta)} durationInFrames={DURATIONS.cta}>
          <SceneFade duration={DURATIONS.cta}>
            <CTAScene />
          </SceneFade>
        </Sequence>
      </AbsoluteFill>
    </FormatProvider>
  );
};
