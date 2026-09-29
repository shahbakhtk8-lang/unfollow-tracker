import "fake-indexeddb/auto";
import Dexie, { type EntityTable } from "dexie";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { StoredSnapshot } from "../src/db/snapshots";

const DB_NAME = "UnfollowTrackerDB";

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
});

afterEach(async () => {
  const { db } = await import("../src/db/snapshots");
  db.close();
  await Dexie.delete(DB_NAME);
});

describe("IndexedDB v2 migration", () => {
  it("still loads v1 snapshots with and without exportDate, and stores an ignore list", async () => {
    class LegacyDb extends Dexie {
      snapshots!: EntityTable<StoredSnapshot, "id">;
      constructor() {
        super(DB_NAME);
        this.version(1).stores({
          snapshots: "++id, createdAt, label",
        });
      }
    }

    const legacy = new LegacyDb();
    await legacy.snapshots.add({
      label: "with-date",
      createdAt: 1_700_000_000_000,
      followerUsernames: ["test_user_001"],
      followingUsernames: ["test_user_010"],
      followerCount: 1,
      followingCount: 1,
      exportDate: Date.parse("2026-08-10T00:00:00Z"),
      exportDateSource: "follow-activity",
    });
    await legacy.snapshots.add({
      label: "legacy-no-date",
      createdAt: 1_700_000_000_100,
      followerUsernames: ["test_user_002"],
      followingUsernames: ["test_user_011"],
      followerCount: 1,
      followingCount: 1,
    });
    await legacy.close();

    const { listSnapshots, ignoreUsername, listIgnored } = await import("../src/db/snapshots");
    const { snapshotExportDate } = await import("../src/lib/exportDate");

    const rows = await listSnapshots();
    expect(rows).toHaveLength(2);
    const withDate = rows.find((row) => row.label === "with-date");
    const legacyRow = rows.find((row) => row.label === "legacy-no-date");
    expect(withDate?.followerUsernames).toEqual(["test_user_001"]);
    expect(snapshotExportDate(withDate ?? {})).toBe(Date.parse("2026-08-10T00:00:00Z"));
    expect(legacyRow?.followerUsernames).toEqual(["test_user_002"]);
    expect(snapshotExportDate(legacyRow ?? {})).toBeNull();
    expect(legacyRow?.exportDate).toBeUndefined();

    await ignoreUsername("test_user_010");
    expect(await listIgnored()).toEqual(["test_user_010"]);
  });
});
