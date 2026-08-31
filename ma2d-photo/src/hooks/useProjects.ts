import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  createProject,
  deleteProject,
  listBuildings,
  listProjects,
  updateProjectName,
} from '@/database/projectsRepository';
import { Building, Project } from '@/types';

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

  const refreshBuildings = useCallback(() => {
    if (!selectedProjectId) {
      setBuildings([]);
      return;
    }
    setBuildings(listBuildings(selectedProjectId));
  }, [selectedProjectId]);

  useEffect(() => {
    refreshBuildings();
  }, [refreshBuildings]);

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
    refresh,
    refreshBuildings,
  };
}
