import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
import { describe, expect, it } from "vitest";
import { parseFollowersJson, parseFollowingJson } from "../src/lib/extractUsers";
import { computeInsights } from "../src/lib/sets";
import { diffSnapshots, orderComparison } from "../src/lib/diff";
import { usernamesFromEntries } from "../src/lib/normalize";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures", name), "utf8");

describe("computeInsights", () => {
  it("computes non-mutuals and mutuals", () => {
    const followers = parseFollowersJson(fixture("followers_1.json"));
    const following = parseFollowingJson(fixture("following.json"));
    const insights = computeInsights({ followers, following });

    expect(insights.mutuals).toEqual(["alice_demo"]);
    expect(insights.notFollowingBack.sort()).toEqual(["bob_demo", "charlie_demo"]);
    expect(insights.fans).toEqual(["diana_demo"]);
    expect(insights.followerCount).toBe(2);
    expect(insights.followingCount).toBe(3);
  });
});

describe("diffSnapshots", () => {
  it("finds unfollowed and new followers", () => {
    const oldF = usernamesFromEntries(parseFollowersJson(fixture("followers_old.json")));
    const newF = usernamesFromEntries(parseFollowersJson(fixture("followers_new.json")));
    const diff = diffSnapshots(oldF, newF);
    expect(diff.unfollowed).toEqual(["left_user"]);
    expect(diff.newFollowers).toEqual(["new_user"]);
  });
});

describe("orderComparison", () => {
  const sep12 = Date.parse("2026-09-12T12:00:00Z");
  const sep28 = Date.parse("2026-09-28T12:00:00Z");

  it("keeps the snapshot as the older list when it was saved first", () => {
    const ordered = orderComparison({
      snapshotAt: sep12,
      currentAt: sep28,
      snapshotFollowers: ["left_user", "stays"],
      currentFollowers: ["stays", "new_user"],
    });
    expect(ordered.swapped).toBe(false);
    expect(ordered.oldAt).toBe(sep12);
    expect(ordered.newAt).toBe(sep28);
    const diff = diffSnapshots(ordered.oldFollowers, ordered.newFollowers);
    expect(diff.unfollowed).toEqual(["left_user"]);
    expect(diff.newFollowers).toEqual(["new_user"]);
  });

  it("swaps when the chosen snapshot is newer than the current upload", () => {
    const ordered = orderComparison({
      snapshotAt: sep28,
      currentAt: sep12,
      snapshotFollowers: ["stays", "new_user"],
      currentFollowers: ["left_user", "stays"],
      snapshotTimestamps: { stays: 2 },
      currentTimestamps: { left_user: 1 },
    });
    expect(ordered.swapped).toBe(true);
    expect(ordered.oldFollowers).toEqual(["left_user", "stays"]);
    expect(ordered.newFollowers).toEqual(["stays", "new_user"]);
    expect(ordered.oldTimestamps.left_user).toBe(1);
    expect(ordered.newTimestamps.stays).toBe(2);
    const diff = diffSnapshots(ordered.oldFollowers, ordered.newFollowers);
    expect(diff.unfollowed).toEqual(["left_user"]);
    expect(diff.newFollowers).toEqual(["new_user"]);
  });
});
