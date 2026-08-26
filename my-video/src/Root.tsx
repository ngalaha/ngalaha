import "./index.css";
import { MyComposition } from "./Composition";
import { BeamReactionsVerticalComposition } from "./BeamReactionsVerticalComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <BeamReactionsVerticalComposition />
    </>
  );
};
