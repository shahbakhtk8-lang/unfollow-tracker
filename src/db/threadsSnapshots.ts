import Dexie, { type EntityTable } from "dexie";
import type { ExportDateSource } from "@/lib/exportDate";

/** Separate IndexedDB from Instagram Unfollow Tracker so snapshots never mix. */
export interface ThreadsStoredSnapshot {
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

export const MAX_THREADS_SNAPSHOTS = 10;

class ThreadsSnapshotDatabase extends Dexie {
  snapshots!: EntityTable<ThreadsStoredSnapshot, "id">;

  constructor() {
    super("ThreadsUnfollowTrackerDB");
    this.version(1).stores({
      snapshots: "++id, createdAt, label",
    });
  }
}

export const threadsDb = new ThreadsSnapshotDatabase();

export async function listThreadsSnapshots(): Promise<ThreadsStoredSnapshot[]> {
  return threadsDb.snapshots.orderBy("createdAt").reverse().toArray();
}

export async function saveThreadsSnapshot(
  data: Omit<ThreadsStoredSnapshot, "id" | "createdAt"> & { createdAt?: number },
): Promise<number> {
  const count = await threadsDb.snapshots.count();
  if (count >= MAX_THREADS_SNAPSHOTS) {
    const oldest = await threadsDb.snapshots.orderBy("createdAt").first();
    if (oldest?.id != null) await threadsDb.snapshots.delete(oldest.id);
  }
  const id = await threadsDb.snapshots.add({
    ...data,
    createdAt: data.createdAt ?? Date.now(),
    savedAt: data.savedAt ?? Date.now(),
  });
  if (id == null) {
    throw new Error("Could not save Threads snapshot on this device.");
  }
  return id;
}

export async function deleteThreadsSnapshot(id: number): Promise<void> {
  await threadsDb.snapshots.delete(id);
}

export async function updateThreadsSnapshotLabel(id: number, label: string): Promise<void> {
  await threadsDb.snapshots.update(id, { label });
}

export async function getThreadsSnapshot(
  id: number,
): Promise<ThreadsStoredSnapshot | undefined> {
  return threadsDb.snapshots.get(id);
}
