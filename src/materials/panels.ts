import { PANEL_MATERIAL_LABELS, STANDARD_PANEL_FORMATS, type PanelMaterialType } from '../calculationEngine/panels';

/** Épaisseurs courantes offertes en quincaillerie, par type de panneau (en pouces). */
export const PANEL_THICKNESS_OPTIONS_IN: Record<PanelMaterialType, number[]> = {
  contreplaque: [1 / 4, 3 / 8, 1 / 2, 5 / 8, 3 / 4],
  plywood: [1 / 4, 3 / 8, 1 / 2, 5 / 8, 3 / 4],
  osb: [7 / 16, 1 / 2, 5 / 8, 3 / 4],
  playout: [3 / 4],
  coffrage: [3 / 4],
  personnalise: [],
};

export const PANEL_MATERIALS: { type: PanelMaterialType; label: string }[] = (
  Object.keys(PANEL_MATERIAL_LABELS) as PanelMaterialType[]
).map((type) => ({ type, label: PANEL_MATERIAL_LABELS[type] }));

export const DEFAULT_PANEL_FORMAT = STANDARD_PANEL_FORMATS['4x8'];
