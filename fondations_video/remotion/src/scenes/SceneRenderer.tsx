import React from "react";
import { BuildingScene } from "./BuildingScene";
import { StatementScene } from "./StatementScene";
import { TitleCardScene } from "./TitleCardScene";
import { ChecklistScene } from "./ChecklistScene";
import { StatsScene } from "./StatsScene";
import { RulerScene } from "./RulerScene";
import { CostScene } from "./CostScene";
import { OutroScene } from "./OutroScene";

const SCENES: Record<string, React.FC<any>> = {
  building: BuildingScene,
  statement: StatementScene,
  titlecard: TitleCardScene,
  checklist: ChecklistScene,
  stats: StatsScene,
  ruler: RulerScene,
  cost: CostScene,
  outro: OutroScene,
};

export const SceneRenderer: React.FC<{ scene: any }> = ({ scene }) => {
  const Comp = SCENES[scene.type];
  if (!Comp) return null;
  return <Comp scene={scene} />;
};
