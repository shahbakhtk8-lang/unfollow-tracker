import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
import { describe, expect, it } from "vitest";
import { parseFollowersJson, parseFollowingJson } from "../src/lib/extractUsers";
import { computeInsights } from "../src/lib/sets";
import { diffSnapshots } from "../src/lib/diff";
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
