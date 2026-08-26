import { Composition } from "remotion";
import {
  BalconPorteAFaux,
  TOTAL_DURATION,
} from "../projects/balcon-porte-a-faux/remotion/BalconPorteAFaux";
import { VERTICAL } from "../engine/remotion/formats";

// projects/balcon-porte-a-faux — see its project.json. Registered here
// because Remotion resolves a single Root per package; purely additive,
// does not change the EtudeDeSol or BeamReactionsVertical compositions.
export const BalconPorteAFauxComposition = () => {
  return (
    <Composition
      id="BalconPorteAFaux"
      component={BalconPorteAFaux}
      durationInFrames={TOTAL_DURATION}
      fps={VERTICAL.fps}
      width={VERTICAL.width}
      height={VERTICAL.height}
    />
  );
};
