import Dexie, { type EntityTable } from "dexie";
import type { ExportDateSource } from "@/lib/exportDate";

export interface StoredSnapshot {
  id?: number;
  label: string;
  createdAt: number;
  savedAt?: number;
  exportDate?: number | null;
  exportDateSource?: ExportDateSource | null;
  followerUsernames: string[];
  followingUsernames: string[];
  followerTimestamps?: Record<string, number>;
  followingTimestamps?: Record<string, number>;
  followerCount: number;
  followingCount: number;
}

export const MAX_SNAPSHOTS = 10;

class SnapshotDatabase extends Dexie {
  snapshots!: EntityTable<StoredSnapshot, "id">;

  constructor() {
    super("UnfollowTrackerDB");
    this.version(1).stores({
      snapshots: "++id, createdAt, label",
    });
  }
}

export const db = new SnapshotDatabase();

export async function listSnapshots(): Promise<StoredSnapshot[]> {
  return db.snapshots.orderBy("createdAt").reverse().toArray();
}

export async function snapshotThatWouldBeReplaced(): Promise<StoredSnapshot | undefined> {
  const count = await db.snapshots.count();
  if (count < MAX_SNAPSHOTS) return undefined;
  return db.snapshots.orderBy("createdAt").first();
}

export async function saveSnapshot(
  data: Omit<StoredSnapshot, "id" | "createdAt"> & { createdAt?: number },
  options?: { replaceOldest?: boolean },
): Promise<number> {
  const oldest = await snapshotThatWouldBeReplaced();
  if (oldest) {
    if (!options?.replaceOldest) {
      throw new Error("This device already has the maximum number of snapshots.");
    }
    if (oldest.id != null) {
      await db.snapshots.delete(oldest.id);
    }
  }
  const savedAt = data.savedAt ?? data.createdAt ?? Date.now();
  const id = await db.snapshots.add({
    label: data.label,
    followerUsernames: data.followerUsernames,
    followingUsernames: data.followingUsernames,
    followerTimestamps: data.followerTimestamps,
    followingTimestamps: data.followingTimestamps,
    followerCount: data.followerCount,
    followingCount: data.followingCount,
    createdAt: savedAt,
    savedAt,
    exportDate: data.exportDate ?? null,
    exportDateSource: data.exportDateSource ?? null,
  });
  if (id == null) {
    throw new Error("Could not save snapshot on this device.");
  }
  return id;
}

export async function deleteSnapshot(id: number): Promise<void> {
  await db.snapshots.delete(id);
}

export async function updateSnapshotLabel(id: number, label: string): Promise<void> {
  await db.snapshots.update(id, { label });
}

export async function getSnapshot(id: number): Promise<StoredSnapshot | undefined> {
  return db.snapshots.get(id);
}
