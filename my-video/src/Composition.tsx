import { Composition } from "remotion";
import { SoilStudyVideo, TOTAL_DURATION } from "./SoilStudyVideo";

export const MyComposition = () => {
  return (
    <Composition
      id="EtudeDeSol"
      component={SoilStudyVideo}
      durationInFrames={TOTAL_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
