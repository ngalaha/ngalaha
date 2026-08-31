export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Admin: undefined;
  AdminNewProject: undefined;
  AdminBuildingEdit: { buildingId: string; projectId: string };
  AdminNewBuilding: { projectId: string };
  Diagnostics: undefined;
};
