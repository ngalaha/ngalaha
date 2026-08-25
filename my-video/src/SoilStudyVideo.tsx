import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { clockWipe } from "@remotion/transitions/clock-wipe";

import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2WhyNeeded } from "./scenes/Scene2WhyNeeded";
import { Scene3Steps } from "./scenes/Scene3Steps";
import { Scene4Results } from "./scenes/Scene4Results";
import { Scene5Conclusion } from "./scenes/Scene5Conclusion";

export const SCENE_DURATIONS = {
  scene1: 368,
  scene2: 614,
  scene3: 1472,
  scene4: 858,
  scene5: 368,
};

const TRANSITION_FRAMES = 20;

export const TOTAL_DURATION =
  SCENE_DURATIONS.scene1 +
  SCENE_DURATIONS.scene2 +
  SCENE_DURATIONS.scene3 +
  SCENE_DURATIONS.scene4 +
  SCENE_DURATIONS.scene5 -
  TRANSITION_FRAMES * 4;

export const SoilStudyVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a1526" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.scene1}>
          <Scene1Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.scene2}>
          <Scene2WhyNeeded />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({
            config: { damping: 200 },
            durationInFrames: TRANSITION_FRAMES,
          })}
        />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.scene3}>
          <Scene3Steps />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.scene4}>
          <Scene4Results />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={clockWipe({ width: 1920, height: 1080 })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.scene5}>
          <Scene5Conclusion />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
