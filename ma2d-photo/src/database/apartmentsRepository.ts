import { getDb } from './db';
import { recordDeletion } from './deletionsRepository';
import { Apartment, OneDriveFolderRef, emptyOneDriveFolderRef } from '@/types';
import { generateId } from '@/utils/idUtils';

interface ApartmentRow {
  id: string;
  buildingId: string;
  name: string;
  driveId: string | null;
  itemId: string | null;
  itemName: string | null;
  webUrl: string | null;
  verifiedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToApartment(row: ApartmentRow): Apartment {
  return {
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
  };
}

export function listApartments(buildingId: string): Apartment[] {
  const db = getDb();
  const rows = db.getAllSync<ApartmentRow>(
    'SELECT * FROM apartments WHERE buildingId = ? ORDER BY name ASC',
    buildingId
  );
  return rows.map(rowToApartment);
}

export function getApartment(apartmentId: string): Apartment | null {
  const db = getDb();
  const row = db.getFirstSync<ApartmentRow>('SELECT * FROM apartments WHERE id = ?', apartmentId);
  return row ? rowToApartment(row) : null;
}

/** Creates one apartment. Returns null (no-op) if the name is blank or already used in this building. */
export function createApartment(buildingId: string, name: string): Apartment | null {
  const db = getDb();
  const trimmed = name.trim();
  if (!trimmed) return null;

  const existing = db.getFirstSync<{ id: string }>(
    'SELECT id FROM apartments WHERE buildingId = ? AND name = ? COLLATE NOCASE',
    buildingId,
    trimmed
  );
  if (existing) return null;

  const now = new Date().toISOString();
  const apartment: Apartment = {
    id: generateId(),
    buildingId,
    name: trimmed,
    folder: emptyOneDriveFolderRef(),
    createdAt: now,
    updatedAt: now,
  };
  db.runSync(
    `INSERT INTO apartments
      (id, buildingId, name, driveId, itemId, itemName, webUrl, verifiedAt, lastError, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    apartment.id,
    apartment.buildingId,
    apartment.name,
    null,
    null,
    null,
    null,
    null,
    null,
    apartment.createdAt,
    apartment.updatedAt
  );
  return apartment;
}

/**
 * Bulk-creates apartments from a list of names (e.g. pasted, one per line
 * or comma-separated) — the expected way to set up a building with 27+
 * units at once. Blanks and duplicates (within this building) are silently
 * skipped. Returns how many were actually created.
 */
export function createApartments(buildingId: string, names: string[]): number {
  const db = getDb();
  let created = 0;
  db.withTransactionSync(() => {
    for (const name of names) {
      if (createApartment(buildingId, name)) created += 1;
    }
  });
  return created;
}

/** Persists the resolved (or re-verified) OneDrive folder for an apartment. */
export function updateApartmentFolder(apartmentId: string, folder: OneDriveFolderRef): void {
  const db = getDb();
  db.runSync(
    `UPDATE apartments SET
      driveId = ?, itemId = ?, itemName = ?, webUrl = ?, verifiedAt = ?, lastError = ?, updatedAt = ?
     WHERE id = ?`,
    folder.driveId,
    folder.itemId,
    folder.itemName,
    folder.webUrl,
    folder.verifiedAt,
    folder.lastError,
    new Date().toISOString(),
    apartmentId
  );
}

export function deleteApartment(apartmentId: string): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM apartments WHERE id = ?', apartmentId);
    // See deletionsRepository: a deletion has to be recorded, not just done,
    // for the other phones to stop re-adding it.
    recordDeletion('apartment', apartmentId);
  });
}
