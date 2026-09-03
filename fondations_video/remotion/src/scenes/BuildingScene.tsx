import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { Building } from "../components/Building";
import { Caption } from "../components/Caption";
import { accentColor } from "../theme";

export const BuildingScene: React.FC<any> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = Math.max(0, Math.min(1, frame / durationInFrames));
  const accent = accentColor(scene.accent);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background accent={accent} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 260, bottom: 420 }}>
        <Building mode={scene.mode} progress={progress} accent={accent} />
      </div>
      <Caption cues={scene.cues} sceneStart={scene.start} accent={accent} />
    </div>
  );
};
