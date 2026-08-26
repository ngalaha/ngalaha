import "./index.css";
import { MyComposition } from "./Composition";
import { BeamReactionsVerticalComposition } from "./BeamReactionsVerticalComposition";
import { BalconPorteAFauxComposition } from "./BalconPorteAFauxComposition";
import { BalconPorteAFauxThumbnail } from "./BalconPorteAFauxThumbnail";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <BeamReactionsVerticalComposition />
      <BalconPorteAFauxComposition />
      <BalconPorteAFauxThumbnail />
    </>
  );
};
