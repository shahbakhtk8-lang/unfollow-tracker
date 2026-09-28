import type { UserEntry } from "../../../src/lib/normalize";

function ids(start: number, end: number): number[] {
  const out: number[] = [];
  for (let id = start; id <= end; id += 1) out.push(id);
  return out;
}

function except(values: number[], removed: Set<number>): number[] {
  return values.filter((id) => !removed.has(id));
}

function stamp(startIso: string, endIso: string, index: number, count: number): number {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  const ms = count <= 1 ? end : start + ((end - start) * index) / (count - 1);
  return Math.floor(ms / 1000);
}

function users(idList: number[], startIso: string, endIso: string): UserEntry[] {
  return idList.map((id, index) => ({
    username: `test_user_${String(id).padStart(3, "0")}`,
    timestamp: stamp(startIso, endIso, index, idList.length),
  }));
}

const OLD_START = "2022-01-01T00:00:00Z";
const OLD_END = "2026-08-10T00:00:00Z";
const NEW_START = "2026-08-16T00:00:00Z";
const NEW_END = "2026-09-27T00:00:00Z";

export interface FakeExport {
  followers: UserEntry[];
  following: UserEntry[];
}

export function buildOldExport(): FakeExport {
  return {
    followers: users(ids(0, 299), OLD_START, OLD_END),
    following: users([...ids(0, 199), ...ids(300, 449)], OLD_START, OLD_END),
  };
}

export function buildNewExport(): FakeExport {
  const old = buildOldExport();
  const droppedFollowers = new Set([...ids(10, 29), ...ids(200, 209)]);
  const droppedFollowing = new Set(ids(300, 304));
  const keptFollowers = old.followers.filter((user) => {
    const id = Number(user.username.slice("test_user_".length));
    return !droppedFollowers.has(id);
  });
  const keptFollowing = old.following.filter((user) => {
    const id = Number(user.username.slice("test_user_".length));
    return !droppedFollowing.has(id);
  });
  return {
    followers: [
      ...keptFollowers,
      ...users(ids(450, 469), NEW_START, NEW_END),
      { username: "instagram", timestamp: stamp(NEW_START, NEW_END, 0, 2) },
    ],
    following: [...keptFollowing, ...users(except(ids(450, 454), new Set()), NEW_START, NEW_END)],
  };
}
