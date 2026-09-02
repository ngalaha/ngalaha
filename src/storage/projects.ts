import type { Project, ProjectSummary } from '../models/Project';
import type { ConcreteElement } from '../models/ConcreteElement';
import type { PanelElement } from '../models/PanelElement';
import { createLocalCollection } from './localCollection';
import { generateId, nowIso } from '../utils/id';

const projectsDb = createLocalCollection<Project>('projects');
const concreteElementsDb = createLocalCollection<ConcreteElement>('concreteElements');
const panelElementsDb = createLocalCollection<PanelElement>('panelElements');

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

export async function updateProject(id: string, updates: Partial<Pick<Project, 'name' | 'description'>>): Promise<Project | undefined> {
  const project = await projectsDb.getById(id);
  if (!project) return undefined;
  const updated: Project = { ...project, ...updates, updatedAt: nowIso() };
  return projectsDb.upsert(updated);
}

export async function deleteProject(id: string): Promise<void> {
  await projectsDb.remove(id);
  const [concreteItems, panelItems] = await Promise.all([concreteElementsDb.getAll(), panelElementsDb.getAll()]);
  await Promise.all([
    concreteElementsDb.saveAll(concreteItems.filter((el) => el.projectId !== id)),
    panelElementsDb.saveAll(panelItems.filter((el) => el.projectId !== id)),
  ]);
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

  const [concreteItems, panelItems] = await Promise.all([
    listConcreteElements(id),
    listPanelElements(id),
  ]);

  await Promise.all([
    ...concreteItems.map((el) =>
      concreteElementsDb.upsert({ ...el, id: generateId(), projectId: newProject.id, createdAt: timestamp, updatedAt: timestamp })
    ),
    ...panelItems.map((el) =>
      panelElementsDb.upsert({ ...el, id: generateId(), projectId: newProject.id, createdAt: timestamp, updatedAt: timestamp })
    ),
  ]);

  return newProject;
}

export async function listConcreteElements(projectId: string): Promise<ConcreteElement[]> {
  const all = await concreteElementsDb.getAll();
  return all.filter((el) => el.projectId === projectId);
}

export async function saveConcreteElement(element: Omit<ConcreteElement, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ConcreteElement> {
  const timestamp = nowIso();
  const existing = element.id ? await concreteElementsDb.getById(element.id) : undefined;
  const saved: ConcreteElement = {
    ...element,
    id: element.id ?? generateId(),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  await touchProject(element.projectId);
  return concreteElementsDb.upsert(saved);
}

export async function deleteConcreteElement(id: string): Promise<void> {
  await concreteElementsDb.remove(id);
}

export async function listPanelElements(projectId: string): Promise<PanelElement[]> {
  const all = await panelElementsDb.getAll();
  return all.filter((el) => el.projectId === projectId);
}

export async function savePanelElement(element: Omit<PanelElement, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<PanelElement> {
  const timestamp = nowIso();
  const existing = element.id ? await panelElementsDb.getById(element.id) : undefined;
  const saved: PanelElement = {
    ...element,
    id: element.id ?? generateId(),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  await touchProject(element.projectId);
  return panelElementsDb.upsert(saved);
}

export async function deletePanelElement(id: string): Promise<void> {
  await panelElementsDb.remove(id);
}

async function touchProject(projectId: string): Promise<void> {
  const project = await projectsDb.getById(projectId);
  if (project) {
    await projectsDb.upsert({ ...project, updatedAt: nowIso() });
  }
}

export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  const projects = await listProjects();
  const summaries = await Promise.all(
    projects.map(async (project) => {
      const [concreteItems, panelItems] = await Promise.all([
        listConcreteElements(project.id),
        listPanelElements(project.id),
      ]);
      return {
        ...project,
        concreteElementCount: concreteItems.length,
        panelElementCount: panelItems.length,
        totalConcreteVolume: concreteItems.reduce((sum, el) => sum + el.volume, 0),
      };
    })
  );
  return summaries;
}
