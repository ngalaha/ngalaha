import { MediaType } from '@/types';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  /** All params are plain serializable values, as React Navigation requires. */
  Camera: {
    mode: MediaType;
    projectId: string;
    projectName: string;
    buildingId: string;
    buildingName: string;
    apartmentId: string | null;
    apartmentName: string | null;
    /** Lets the camera warn right after saving when the building has no OneDrive folder yet. */
    folderConfigured: boolean;
  };
  Admin: undefined;
  AdminNewProject: undefined;
  AdminBuildingEdit: { buildingId: string; projectId: string };
  AdminNewBuilding: { projectId: string };
  AdminApartments: { buildingId: string };
  Diagnostics: undefined;
  About: undefined;
};
