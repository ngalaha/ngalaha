import { Composition } from "remotion";
import { MainComposition, TOTAL_DURATION } from "./MainComposition";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MainComposition"
      component={MainComposition}
      durationInFrames={Math.ceil(TOTAL_DURATION * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
