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

  it("keeps the snapshot as the older list when its export date is earlier", () => {
    const decision = orderComparison({
      snapshotDate: sep12,
      currentDate: sep28,
      snapshotFollowers: ["left_user", "stays"],
      currentFollowers: ["stays", "new_user"],
    });
    expect(decision.status).toBe("ready");
    if (decision.status !== "ready") return;
    expect(decision.ordered.swapped).toBe(false);
    expect(decision.ordered.oldAt).toBe(sep12);
    expect(decision.ordered.newAt).toBe(sep28);
    const diff = diffSnapshots(decision.ordered.oldFollowers, decision.ordered.newFollowers);
    expect(diff.unfollowed).toEqual(["left_user"]);
    expect(diff.newFollowers).toEqual(["new_user"]);
  });

  it("swaps when the saved snapshot export is newer than the current upload", () => {
    const decision = orderComparison({
      snapshotDate: sep28,
      currentDate: sep12,
      snapshotFollowers: ["stays", "new_user"],
      currentFollowers: ["left_user", "stays"],
      snapshotTimestamps: { stays: 2 },
      currentTimestamps: { left_user: 1 },
    });
    expect(decision.status).toBe("ready");
    if (decision.status !== "ready") return;
    expect(decision.ordered.swapped).toBe(true);
    expect(decision.ordered.oldFollowers).toEqual(["left_user", "stays"]);
    expect(decision.ordered.newFollowers).toEqual(["stays", "new_user"]);
    expect(decision.ordered.oldTimestamps.left_user).toBe(1);
    expect(decision.ordered.newTimestamps.stays).toBe(2);
    const diff = diffSnapshots(decision.ordered.oldFollowers, decision.ordered.newFollowers);
    expect(diff.unfollowed).toEqual(["left_user"]);
    expect(diff.newFollowers).toEqual(["new_user"]);
  });
});
