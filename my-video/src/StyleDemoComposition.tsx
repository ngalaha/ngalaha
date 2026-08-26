import { Composition } from "remotion";
import { StyleDemo } from "./StyleDemo";
import { VERTICAL } from "../engine/remotion/formats";

// Throwaway style-test composition — see StyleDemo.tsx. Purely additive.
export const StyleDemoComposition = () => {
  return (
    <Composition
      id="StyleDemo"
      component={StyleDemo}
      durationInFrames={180}
      fps={VERTICAL.fps}
      width={VERTICAL.width}
      height={VERTICAL.height}
    />
  );
};
