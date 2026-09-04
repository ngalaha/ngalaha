import { getDb } from './db';
import { Deletion, listDeletions, replaceDeletions } from './deletionsRepository';
import { Apartment, Building, Project } from '@/types';

/**
 * Whole-configuration read/write, used by the OneDrive configuration sync
 * (services/sync). Everything else in the app works entity by entity; the
 * sync needs the full picture at once, and needs to swap it atomically.
 */
export interface ConfigSnapshot {
  projects: Project[];
  buildings: Building[];
  apartments: Apartment[];
  deletions: Deletion[];
}

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

interface ApartmentRow extends Omit<BuildingRow, 'projectId' | 'shareUrl'> {
  buildingId: string;
}

export function readLocalSnapshot(): ConfigSnapshot {
  const db = getDb();
  const projects = db.getAllSync<Project>('SELECT * FROM projects');
  const buildings = db.getAllSync<BuildingRow>('SELECT * FROM buildings').map((row) => ({
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    photoFolder: {
      shareUrl: row.shareUrl,
      driveId: row.driveId,
      itemId: row.itemId,
      itemName: row.itemName,
      webUrl: row.webUrl,
      verifiedAt: row.verifiedAt,
      lastError: row.lastError,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
  const apartments = db.getAllSync<ApartmentRow>('SELECT * FROM apartments').map((row) => ({
    id: row.id,
    buildingId: row.buildingId,
    name: row.name,
    folder: {
      shareUrl: null,
      driveId: row.driveId,
      itemId: row.itemId,
      itemName: row.itemName,
      webUrl: row.webUrl,
      verifiedAt: row.verifiedAt,
      lastError: row.lastError,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  return { projects, buildings, apartments, deletions: listDeletions() };
}

/**
 * Replaces the whole local configuration in one transaction.
 *
 * Photos are never touched: a queued photo refers to its building by id,
 * and the merge keeps ids stable, so pending uploads survive a sync.
 */
export function writeLocalSnapshot(snapshot: ConfigSnapshot): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM apartments');
    db.runSync('DELETE FROM buildings');
    db.runSync('DELETE FROM projects');

    for (const project of snapshot.projects) {
      db.runSync(
        'INSERT INTO projects (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
        project.id,
        project.name,
        project.createdAt,
        project.updatedAt
      );
    }
    for (const building of snapshot.buildings) {
      const folder = building.photoFolder;
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
    }
    for (const apartment of snapshot.apartments) {
      const folder = apartment.folder;
      db.runSync(
        `INSERT INTO apartments
          (id, buildingId, name, driveId, itemId, itemName, webUrl, verifiedAt, lastError, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        apartment.id,
        apartment.buildingId,
        apartment.name,
        folder.driveId,
        folder.itemId,
        folder.itemName,
        folder.webUrl,
        folder.verifiedAt,
        folder.lastError,
        apartment.createdAt,
        apartment.updatedAt
      );
    }

    replaceDeletions(snapshot.deletions);
  });
}
