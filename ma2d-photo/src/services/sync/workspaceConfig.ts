import type { ConfigSnapshot } from '@/database/configRepository';
import type { Deletion } from '@/database/deletionsRepository';
import type { Apartment, Building, Project } from '@/types';

/**
 * The shared configuration document: which projects, buildings and
 * apartments exist, and where each building's Photo folder is. It lives as
 * a JSON file in a OneDrive folder every user of the app can reach, which
 * is what lets several phones see the same structure without a server.
 *
 * Merging is deliberately simple and predictable: every entity carries an
 * updatedAt, the most recent version of an entity wins, and a deletion is
 * recorded as a tombstone so it wins over any older copy still sitting on
 * a phone that was offline. Two people editing *different* things always
 * both keep their work; two people editing the *same* entity resolve to
 * whoever saved last, which for a list of buildings and apartments is the
 * behaviour people expect.
 */

export const CONFIG_FILE_NAME = 'ma2d-photo-config.json';
export const CONFIG_VERSION = 1;

interface ConfigFolder {
  shareUrl: string | null;
  driveId: string | null;
  itemId: string | null;
  itemName: string | null;
  webUrl: string | null;
}

export interface WorkspaceConfig {
  version: number;
  /** When this document was last written, and by whom (for display only). */
  updatedAt: string;
  updatedBy: string | null;
  projects: Project[];
  buildings: (Omit<Building, 'photoFolder'> & { photoFolder: ConfigFolder })[];
  apartments: (Omit<Apartment, 'folder'> & { folder: ConfigFolder })[];
  deletions: Deletion[];
}

/**
 * verifiedAt/lastError are deliberately not shared: whether *this* phone
 * could reach a folder says nothing about whether another one can, and
 * publishing one device's error would show it to everybody.
 */
function toConfigFolder(folder: ConfigFolder): ConfigFolder {
  return {
    shareUrl: folder.shareUrl ?? null,
    driveId: folder.driveId ?? null,
    itemId: folder.itemId ?? null,
    itemName: folder.itemName ?? null,
    webUrl: folder.webUrl ?? null,
  };
}

export function snapshotToConfig(snapshot: ConfigSnapshot, updatedBy: string | null): WorkspaceConfig {
  return {
    version: CONFIG_VERSION,
    updatedAt: new Date().toISOString(),
    updatedBy,
    projects: snapshot.projects.map((p) => ({ ...p })),
    buildings: snapshot.buildings.map((b) => ({
      id: b.id,
      projectId: b.projectId,
      name: b.name,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      photoFolder: toConfigFolder(b.photoFolder),
    })),
    apartments: snapshot.apartments.map((a) => ({
      id: a.id,
      buildingId: a.buildingId,
      name: a.name,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      folder: toConfigFolder(a.folder),
    })),
    deletions: snapshot.deletions.map((d) => ({ ...d })),
  };
}

export function configToSnapshot(config: WorkspaceConfig): ConfigSnapshot {
  return {
    projects: (config.projects ?? []).map((p) => ({ ...p })),
    buildings: (config.buildings ?? []).map((b) => ({
      id: b.id,
      projectId: b.projectId,
      name: b.name,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      photoFolder: { ...toConfigFolder(b.photoFolder), verifiedAt: null, lastError: null },
    })),
    apartments: (config.apartments ?? []).map((a) => ({
      id: a.id,
      buildingId: a.buildingId,
      name: a.name,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      folder: { ...toConfigFolder(a.folder), verifiedAt: null, lastError: null },
    })),
    deletions: (config.deletions ?? []).map((d) => ({ ...d })),
  };
}

/** Most recently updated wins; ties keep the local copy. */
function pickLatest<T extends { id: string; updatedAt: string }>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>();
  for (const entity of remote) byId.set(entity.id, entity);
  for (const entity of local) {
    const other = byId.get(entity.id);
    if (!other || entity.updatedAt >= other.updatedAt) byId.set(entity.id, entity);
  }
  return [...byId.values()];
}

function mergeDeletions(local: Deletion[], remote: Deletion[]): Map<string, Deletion> {
  const byId = new Map<string, Deletion>();
  for (const deletion of [...remote, ...local]) {
    const existing = byId.get(deletion.id);
    if (!existing || deletion.deletedAt > existing.deletedAt) byId.set(deletion.id, deletion);
  }
  return byId;
}

/**
 * Combines what this phone knows with what the shared file holds.
 *
 * A tombstone removes an entity unless the entity was updated *after* the
 * deletion — someone re-creating a building right after another person
 * deleted it should keep their new one.
 */
export function mergeSnapshots(local: ConfigSnapshot, remote: ConfigSnapshot): ConfigSnapshot {
  const deletions = mergeDeletions(local.deletions, remote.deletions);
  const isDeleted = (entity: { id: string; updatedAt: string }) => {
    const tombstone = deletions.get(entity.id);
    return !!tombstone && tombstone.deletedAt >= entity.updatedAt;
  };

  const localBuildingsById = new Map(local.buildings.map((b) => [b.id, b]));
  const localApartmentsById = new Map(local.apartments.map((a) => [a.id, a]));

  const projects = pickLatest(local.projects, remote.projects).filter((p) => !isDeleted(p));
  const projectIds = new Set(projects.map((p) => p.id));

  const buildings = pickLatest(local.buildings, remote.buildings)
    .filter((b) => !isDeleted(b) && projectIds.has(b.projectId))
    .map((building) => {
      // verifiedAt/lastError never travel; keep what this device knows as
      // long as it still points at the same folder.
      const mine = localBuildingsById.get(building.id);
      const sameFolder = mine?.photoFolder.itemId === building.photoFolder.itemId;
      return {
        ...building,
        photoFolder: {
          ...building.photoFolder,
          verifiedAt: sameFolder ? (mine?.photoFolder.verifiedAt ?? null) : null,
          lastError: sameFolder ? (mine?.photoFolder.lastError ?? null) : null,
        },
      };
    });
  const buildingIds = new Set(buildings.map((b) => b.id));

  const apartments = pickLatest(local.apartments, remote.apartments)
    .filter((a) => !isDeleted(a) && buildingIds.has(a.buildingId))
    .map((apartment) => {
      const mine = localApartmentsById.get(apartment.id);
      const sameFolder = mine?.folder.itemId === apartment.folder.itemId;
      return {
        ...apartment,
        folder: {
          ...apartment.folder,
          verifiedAt: sameFolder ? (mine?.folder.verifiedAt ?? null) : null,
          lastError: sameFolder ? (mine?.folder.lastError ?? null) : null,
        },
      };
    });

  return { projects, buildings, apartments, deletions: [...deletions.values()] };
}

/**
 * Compares two configurations by content, ignoring who wrote them and
 * when — so re-publishing an unchanged configuration is recognised as a
 * no-op instead of causing an endless write-back loop between phones.
 */
export function isSameConfiguration(a: WorkspaceConfig, b: WorkspaceConfig): boolean {
  const normalize = (config: WorkspaceConfig) =>
    JSON.stringify({
      projects: [...config.projects].sort((x, y) => x.id.localeCompare(y.id)),
      buildings: [...config.buildings].sort((x, y) => x.id.localeCompare(y.id)),
      apartments: [...config.apartments].sort((x, y) => x.id.localeCompare(y.id)),
      deletions: [...config.deletions].sort((x, y) => x.id.localeCompare(y.id)),
    });
  return normalize(a) === normalize(b);
}
