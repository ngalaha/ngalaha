import { getDb } from './db';

export type DeletedKind = 'project' | 'building' | 'apartment';

export interface Deletion {
  id: string;
  kind: DeletedKind;
  deletedAt: string;
}

/**
 * How long a tombstone is kept. It only has to outlive the slowest phone's
 * next sync; a year of them is a few kilobytes, so this is generous on
 * purpose — dropping one too early is what would resurrect a deleted
 * building on a device that was offline for a long time.
 */
const TOMBSTONE_RETENTION_DAYS = 365;

export function recordDeletion(kind: DeletedKind, id: string, deletedAt = new Date().toISOString()): void {
  getDb().runSync(
    `INSERT INTO deletions (id, kind, deletedAt) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET kind = excluded.kind, deletedAt = excluded.deletedAt`,
    id,
    kind,
    deletedAt
  );
}

export function listDeletions(): Deletion[] {
  return getDb().getAllSync<Deletion>('SELECT id, kind, deletedAt FROM deletions');
}

export function replaceDeletions(deletions: Deletion[]): void {
  const db = getDb();
  db.runSync('DELETE FROM deletions');
  for (const deletion of deletions) {
    db.runSync(
      'INSERT INTO deletions (id, kind, deletedAt) VALUES (?, ?, ?)',
      deletion.id,
      deletion.kind,
      deletion.deletedAt
    );
  }
}

export function pruneOldDeletions(): void {
  const cutoff = new Date(Date.now() - TOMBSTONE_RETENTION_DAYS * 24 * 3600 * 1000).toISOString();
  getDb().runSync('DELETE FROM deletions WHERE deletedAt < ?', cutoff);
}
