import { Composition } from "remotion";
import {
  BeamReactionsVertical,
  TOTAL_DURATION,
} from "../projects/beam-reactions-vertical/remotion/BeamReactionsVertical";
import { VERTICAL } from "../engine/remotion/formats";

// Test project built with the reusable engine (engine/ + projects/) — see
// projects/beam-reactions-vertical/project.json. Registered here because
// Remotion resolves a single Root per package; this is purely additive and
// does not change the "EtudeDeSol" composition above.
export const BeamReactionsVerticalComposition = () => {
  return (
    <Composition
      id="BeamReactionsVertical"
      component={BeamReactionsVertical}
      durationInFrames={TOTAL_DURATION}
      fps={VERTICAL.fps}
      width={VERTICAL.width}
      height={VERTICAL.height}
    />
  );
};
