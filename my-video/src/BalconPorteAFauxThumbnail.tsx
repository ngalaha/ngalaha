import { Composition } from "remotion";
import { Thumbnail } from "../projects/balcon-porte-a-faux/remotion/Thumbnail";
import { VERTICAL } from "../engine/remotion/formats";

// Static poster/thumbnail for balcon-porte-a-faux — not part of the video
// timeline, rendered as a single still. Purely additive.
export const BalconPorteAFauxThumbnail = () => {
  return (
    <Composition
      id="BalconPorteAFauxThumbnail"
      component={Thumbnail}
      durationInFrames={150}
      fps={VERTICAL.fps}
      width={VERTICAL.width}
      height={VERTICAL.height}
    />
  );
};
