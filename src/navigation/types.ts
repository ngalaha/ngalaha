export type RootStackParamList = {
  Home: undefined;
  CalculRapide: undefined;
  Beton: { projectId?: string } | undefined;
  Panneaux: { projectId?: string } | undefined;
  Conversions: undefined;
  Commandes: { projectId?: string } | undefined;
  Projets: undefined;
  ProjetDetail: { projectId: string };
  Parametres: undefined;
};
