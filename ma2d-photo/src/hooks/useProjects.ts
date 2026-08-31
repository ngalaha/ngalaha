import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  createBuilding,
  createProject,
  deleteBuilding,
  deleteProject,
  listBuildings,
  listProjects,
  updateBuildingFolder,
  updateBuildingName,
  updateProjectName,
} from '@/database/projectsRepository';
import { resolveShareLink } from '@/services/microsoftGraph/oneDriveService';
import { Building, OneDriveFolderRef, Project, emptyOneDriveFolderRef } from '@/types';

const SELECTED_PROJECT_KEY = 'ma2d.selectedProjectId';
const SELECTED_BUILDING_KEY = 'ma2d.selectedBuildingId';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const allProjects = listProjects();
    setProjects(allProjects);
    return allProjects;
  }, []);

  useEffect(() => {
    const allProjects = refresh();
    (async () => {
      const savedProjectId = await AsyncStorage.getItem(SELECTED_PROJECT_KEY);
      const savedBuildingId = await AsyncStorage.getItem(SELECTED_BUILDING_KEY);
      const projectId = savedProjectId ?? allProjects[0]?.id ?? null;
      setSelectedProjectId(projectId);
      setSelectedBuildingId(savedBuildingId);
    })();
  }, [refresh]);

  useEffect(() => {
    if (!selectedProjectId) {
      setBuildings([]);
      return;
    }
    setBuildings(listBuildings(selectedProjectId));
  }, [selectedProjectId]);

  const selectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedBuildingId(null);
    AsyncStorage.setItem(SELECTED_PROJECT_KEY, projectId);
    AsyncStorage.removeItem(SELECTED_BUILDING_KEY);
  }, []);

  const selectBuilding = useCallback((buildingId: string) => {
    setSelectedBuildingId(buildingId);
    AsyncStorage.setItem(SELECTED_BUILDING_KEY, buildingId);
  }, []);

  const addProject = useCallback(
    (name: string) => {
      const project = createProject(name);
      refresh();
      selectProject(project.id);
      return project;
    },
    [refresh, selectProject]
  );

  const renameProject = useCallback(
    (projectId: string, name: string) => {
      updateProjectName(projectId, name);
      refresh();
    },
    [refresh]
  );

  const removeProject = useCallback(
    (projectId: string) => {
      deleteProject(projectId);
      refresh();
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
        setSelectedBuildingId(null);
      }
    },
    [refresh, selectedProjectId]
  );

  const addBuilding = useCallback(
    (projectId: string, name: string) => {
      const building = createBuilding(projectId, name);
      if (projectId === selectedProjectId) setBuildings(listBuildings(projectId));
      return building;
    },
    [selectedProjectId]
  );

  const renameBuilding = useCallback(
    (buildingId: string, name: string) => {
      updateBuildingName(buildingId, name);
      if (selectedProjectId) setBuildings(listBuildings(selectedProjectId));
    },
    [selectedProjectId]
  );

  const removeBuilding = useCallback(
    (buildingId: string) => {
      deleteBuilding(buildingId);
      if (selectedProjectId) setBuildings(listBuildings(selectedProjectId));
      if (selectedBuildingId === buildingId) setSelectedBuildingId(null);
    },
    [selectedProjectId, selectedBuildingId]
  );

  /** Resolves an admin-provided share link via Graph and persists the result. */
  const setBuildingFolderLink = useCallback(
    async (buildingId: string, shareUrl: string): Promise<OneDriveFolderRef> => {
      const resolved = shareUrl.trim()
        ? await resolveShareLink(shareUrl)
        : emptyOneDriveFolderRef();
      updateBuildingFolder(buildingId, resolved);
      if (selectedProjectId) setBuildings(listBuildings(selectedProjectId));
      return resolved;
    },
    [selectedProjectId]
  );

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId) ?? null;

  return {
    projects,
    buildings,
    selectedProject,
    selectedBuilding,
    selectProject,
    selectBuilding,
    addProject,
    renameProject,
    removeProject,
    addBuilding,
    renameBuilding,
    removeBuilding,
    setBuildingFolderLink,
    refresh,
  };
}
