import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { SceneRenderer } from "./scenes/SceneRenderer";
import scenesData from "./scenes.json";
import { COLORS } from "./theme";

export const MainComposition: React.FC = () => {
  const { fps } = useVideoConfig();
  const scenes = scenesData.scenes;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {scenes.map((scene, i) => {
        const from = Math.round(scene.start * fps);
        const to = Math.round(scene.end * fps);
        const durationInFrames = Math.max(1, to - from);
        return (
          <Sequence key={i} from={from} durationInFrames={durationInFrames}>
            <SceneRenderer scene={scene} />
          </Sequence>
        );
      })}
      <Audio src={staticFile("audio.mp3")} />
    </AbsoluteFill>
  );
};

export const TOTAL_DURATION = scenesData.totalDuration;
