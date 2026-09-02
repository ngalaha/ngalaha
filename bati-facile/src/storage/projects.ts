import type { Project, ProjectSummary } from '../models/Project';
import type { Wall } from '../models/Wall';
import { createLocalCollection } from './localCollection';
import { generateId, nowIso } from '../utils/id';
import { DEFAULT_WASTE_MARGIN_PERCENT, getBlockFormat } from '../materials/blocks';
import { computeWallBlocks } from '../calculationEngine/blocks';
import { buildQuantityResult } from '../calculationEngine/quantity';

const projectsDb = createLocalCollection<Project>('projects');
const wallsDb = createLocalCollection<Wall>('walls');

export async function listProjects(): Promise<Project[]> {
  const projects = await projectsDb.getAll();
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProject(id: string): Promise<Project | undefined> {
  return projectsDb.getById(id);
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const timestamp = nowIso();
  const project: Project = { id: generateId(), name, description, createdAt: timestamp, updatedAt: timestamp };
  return projectsDb.upsert(project);
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, 'name' | 'description'>>
): Promise<Project | undefined> {
  const project = await projectsDb.getById(id);
  if (!project) return undefined;
  const updated: Project = { ...project, ...updates, updatedAt: nowIso() };
  return projectsDb.upsert(updated);
}

export async function deleteProject(id: string): Promise<void> {
  await projectsDb.remove(id);
  const walls = await wallsDb.getAll();
  await wallsDb.saveAll(walls.filter((w) => w.projectId !== id));
}

export async function duplicateProject(id: string): Promise<Project | undefined> {
  const project = await projectsDb.getById(id);
  if (!project) return undefined;

  const timestamp = nowIso();
  const newProject: Project = {
    ...project,
    id: generateId(),
    name: `${project.name} (copie)`,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await projectsDb.upsert(newProject);

  const walls = await listWalls(id);
  await Promise.all(
    walls.map((w) =>
      wallsDb.upsert({ ...w, id: generateId(), projectId: newProject.id, createdAt: timestamp, updatedAt: timestamp })
    )
  );

  return newProject;
}

export async function listWalls(projectId: string): Promise<Wall[]> {
  const all = await wallsDb.getAll();
  return all.filter((w) => w.projectId === projectId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function saveWall(wall: Omit<Wall, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Wall> {
  const timestamp = nowIso();
  const existing = wall.id ? await wallsDb.getById(wall.id) : undefined;
  const saved: Wall = {
    ...wall,
    id: wall.id ?? generateId(),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  await touchProject(wall.projectId);
  return wallsDb.upsert(saved);
}

export async function deleteWall(id: string): Promise<void> {
  await wallsDb.remove(id);
}

async function touchProject(projectId: string): Promise<void> {
  const project = await projectsDb.getById(projectId);
  if (project) {
    await projectsDb.upsert({ ...project, updatedAt: nowIso() });
  }
}

export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  const projects = await listProjects();
  return Promise.all(
    projects.map(async (project) => {
      const walls = await listWalls(project.id);
      let totalBlocks = 0;
      for (const wall of walls) {
        const block = getBlockFormat(wall.blockId);
        const result = computeWallBlocks(wall, block);
        if (result.ok) {
          totalBlocks += buildQuantityResult(result.value.exactBlocks, 'bloc', DEFAULT_WASTE_MARGIN_PERCENT, {
            type: 'integer',
          }).recommended;
        }
      }
      return { ...project, wallCount: walls.length, totalBlocks };
    })
  );
}
