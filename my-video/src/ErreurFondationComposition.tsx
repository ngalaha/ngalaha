import { Composition } from "remotion";
import { ErreurFondation, TOTAL_DURATION } from "../projects/erreur-fondation/remotion/ErreurFondation";
import { VERTICAL } from "../engine/remotion/formats";

// projects/erreur-fondation — see its project.json. Registered here
// because Remotion resolves a single Root per package; purely additive.
export const ErreurFondationComposition = () => {
  return (
    <Composition
      id="ErreurFondation"
      component={ErreurFondation}
      durationInFrames={TOTAL_DURATION}
      fps={VERTICAL.fps}
      width={VERTICAL.width}
      height={VERTICAL.height}
    />
  );
};
