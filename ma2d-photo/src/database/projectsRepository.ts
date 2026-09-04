import { getDb } from './db';
import { Building, OneDriveFolderRef, Project, emptyOneDriveFolderRef } from '@/types';
import { CHAMPFLEURY_PROJECT_NAME, SEED_BUILDINGS, SEED_PROJECTS } from '@/config/seedData';
import { generateId } from '@/utils/idUtils';

interface BuildingRow {
  id: string;
  projectId: string;
  name: string;
  shareUrl: string | null;
  driveId: string | null;
  itemId: string | null;
  itemName: string | null;
  webUrl: string | null;
  verifiedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToBuilding(row: BuildingRow): Building {
  const photoFolder: OneDriveFolderRef = {
    shareUrl: row.shareUrl,
    driveId: row.driveId,
    itemId: row.itemId,
    itemName: row.itemName,
    webUrl: row.webUrl,
    verifiedAt: row.verifiedAt,
    lastError: row.lastError,
  };
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    photoFolder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Seeds Projet Champfleury + Bâtiments A-F on first launch only. */
export function ensureSeeded(): void {
  const db = getDb();
  const countRow = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM projects');
  if ((countRow?.count ?? 0) > 0) {
    // The seeded project shipped as plain "Champfleury" before its real name
    // was known. Rename it in place on installs that still carry the old
    // value — but only that exact value, so a name the user chose is kept.
    db.runSync(
      'UPDATE projects SET name = ?, updatedAt = ? WHERE id = ? AND name = ?',
      CHAMPFLEURY_PROJECT_NAME,
      new Date().toISOString(),
      SEED_PROJECTS[0].id,
      'Champfleury'
    );
    return;
  }

  db.withTransactionSync(() => {
    for (const project of SEED_PROJECTS) {
      db.runSync(
        'INSERT INTO projects (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
        project.id,
        project.name,
        project.createdAt,
        project.updatedAt
      );
    }
    for (const building of SEED_BUILDINGS) {
      db.runSync(
        `INSERT INTO buildings
          (id, projectId, name, shareUrl, driveId, itemId, itemName, webUrl, verifiedAt, lastError, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        building.id,
        building.projectId,
        building.name,
        building.photoFolder.shareUrl,
        building.photoFolder.driveId,
        building.photoFolder.itemId,
        building.photoFolder.itemName,
        building.photoFolder.webUrl,
        building.photoFolder.verifiedAt,
        building.photoFolder.lastError,
        building.createdAt,
        building.updatedAt
      );
    }
  });
}

export function listProjects(): Project[] {
  const db = getDb();
  return db.getAllSync<Project>('SELECT * FROM projects ORDER BY name ASC');
}

export function listBuildings(projectId: string): Building[] {
  const db = getDb();
  const rows = db.getAllSync<BuildingRow>(
    'SELECT * FROM buildings WHERE projectId = ? ORDER BY name ASC',
    projectId
  );
  return rows.map(rowToBuilding);
}

export function getBuilding(buildingId: string): Building | null {
  const db = getDb();
  const row = db.getFirstSync<BuildingRow>('SELECT * FROM buildings WHERE id = ?', buildingId);
  return row ? rowToBuilding(row) : null;
}

export function createProject(name: string): Project {
  const db = getDb();
  const now = new Date().toISOString();
  const project: Project = { id: generateId(), name, createdAt: now, updatedAt: now };
  db.runSync(
    'INSERT INTO projects (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
    project.id,
    project.name,
    project.createdAt,
    project.updatedAt
  );
  return project;
}

export function updateProjectName(projectId: string, name: string): void {
  const db = getDb();
  db.runSync(
    'UPDATE projects SET name = ?, updatedAt = ? WHERE id = ?',
    name,
    new Date().toISOString(),
    projectId
  );
}

export function deleteProject(projectId: string): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM buildings WHERE projectId = ?', projectId);
    db.runSync('DELETE FROM projects WHERE id = ?', projectId);
  });
}

export function createBuilding(projectId: string, name: string): Building {
  const db = getDb();
  const now = new Date().toISOString();
  const folder = emptyOneDriveFolderRef();
  const building: Building = {
    id: generateId(),
    projectId,
    name,
    photoFolder: folder,
    createdAt: now,
    updatedAt: now,
  };
  db.runSync(
    `INSERT INTO buildings
      (id, projectId, name, shareUrl, driveId, itemId, itemName, webUrl, verifiedAt, lastError, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    building.id,
    building.projectId,
    building.name,
    folder.shareUrl,
    folder.driveId,
    folder.itemId,
    folder.itemName,
    folder.webUrl,
    folder.verifiedAt,
    folder.lastError,
    building.createdAt,
    building.updatedAt
  );
  return building;
}

export function updateBuildingName(buildingId: string, name: string): void {
  const db = getDb();
  db.runSync(
    'UPDATE buildings SET name = ?, updatedAt = ? WHERE id = ?',
    name,
    new Date().toISOString(),
    buildingId
  );
}

export function updateBuildingFolder(buildingId: string, folder: OneDriveFolderRef): void {
  const db = getDb();
  db.runSync(
    `UPDATE buildings SET
      shareUrl = ?, driveId = ?, itemId = ?, itemName = ?, webUrl = ?, verifiedAt = ?, lastError = ?, updatedAt = ?
     WHERE id = ?`,
    folder.shareUrl,
    folder.driveId,
    folder.itemId,
    folder.itemName,
    folder.webUrl,
    folder.verifiedAt,
    folder.lastError,
    new Date().toISOString(),
    buildingId
  );
}

export function deleteBuilding(buildingId: string): void {
  const db = getDb();
  db.runSync('DELETE FROM buildings WHERE id = ?', buildingId);
}
