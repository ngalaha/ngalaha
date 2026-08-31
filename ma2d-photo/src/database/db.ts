import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('ma2d-photo.db');
  }
  return dbInstance;
}

/**
 * Creates tables if they don't exist yet. Safe to call on every app start.
 * Projects/buildings/photos never depend on server migrations — this is a
 * local-only cache/queue, so schema changes here should stay additive.
 */
export function initDatabase(): void {
  const db = getDb();
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY NOT NULL,
      projectId TEXT NOT NULL,
      name TEXT NOT NULL,
      shareUrl TEXT,
      driveId TEXT,
      itemId TEXT,
      itemName TEXT,
      webUrl TEXT,
      verifiedAt TEXT,
      lastError TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY NOT NULL,
      projectId TEXT NOT NULL,
      projectName TEXT NOT NULL,
      buildingId TEXT NOT NULL,
      buildingName TEXT NOT NULL,
      fileName TEXT NOT NULL,
      localUri TEXT NOT NULL,
      capturedAt TEXT NOT NULL,
      dateFolder TEXT NOT NULL,
      status TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      lastError TEXT,
      uploadedAt TEXT,
      remoteItemId TEXT,
      fileSizeBytes INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(status);
    CREATE INDEX IF NOT EXISTS idx_photos_capturedAt ON photos(capturedAt);
  `);
}
