import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isBlockedAndUnfollowedPath,
  isThreadsCombinedFollowersFollowingPath,
  isThreadsFollowersPath,
  isThreadsFollowingPath,
  looksLikeThreadsExportPath,
  parseThreadsCombinedJson,
  parseThreadsFollowersHtml,
  parseThreadsFollowersJson,
  parseThreadsFollowingJson,
} from "../src/lib/extractUsersThreads";
import { computeInsights } from "../src/lib/sets";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures", "threads", name), "utf8");

describe("Threads path matchers", () => {
  it("detects threads/ folder paths and excludes Instagram connections folder", () => {
    expect(looksLikeThreadsExportPath("threads/followers.json")).toBe(true);
    expect(looksLikeThreadsExportPath("your_instagram_activity/threads/following.json")).toBe(true);
    expect(
      looksLikeThreadsExportPath("connections/followers_and_following/followers_1.json"),
    ).toBe(false);
  });

  it("never treats blocked_and_unfollowed as followers/following", () => {
    expect(isBlockedAndUnfollowedPath("threads/blocked_and_unfollowed.json")).toBe(true);
    expect(isThreadsFollowersPath("threads/blocked_and_unfollowed.json")).toBe(false);
    expect(isThreadsFollowingPath("threads/blocked_and_unfollowed.json")).toBe(false);
  });

  it("recognizes split and combined files", () => {
    expect(isThreadsFollowersPath("threads/followers.json")).toBe(true);
    expect(isThreadsFollowersPath("threads/followers_2.json")).toBe(true);
    expect(isThreadsFollowingPath("threads/following.json")).toBe(true);
    expect(isThreadsCombinedFollowersFollowingPath("threads/followers_and_following.json")).toBe(
      true,
    );
  });
});

describe("parseThreadsFollowersJson / following", () => {
  it("reads split text_post_app wrappers", () => {
    const followers = parseThreadsFollowersJson(fixture("followers.json"));
    const following = parseThreadsFollowingJson(fixture("following.json"));
    expect(followers.map((u) => u.username).sort()).toEqual(["alice_threads", "diana_threads"]);
    expect(following.map((u) => u.username).sort()).toEqual([
      "alice_threads",
      "bob_threads",
      "charlie_threads",
    ]);
    const insights = computeInsights({ followers, following });
    expect(insights.mutuals).toEqual(["alice_threads"]);
    expect(insights.notFollowingBack.sort()).toEqual(["bob_threads", "charlie_threads"]);
    expect(insights.fans).toEqual(["diana_threads"]);
  });

  it("reads combined followers_and_following.json", () => {
    const { followers, following } = parseThreadsCombinedJson(
      fixture("followers_and_following.json"),
    );
    expect(followers.map((u) => u.username).sort()).toEqual(["fan_only", "mutual_one"]);
    expect(following.map((u) => u.username).sort()).toEqual(["mutual_one", "not_back"]);
    const insights = computeInsights({ followers, following });
    expect(insights.notFollowingBack).toEqual(["not_back"]);
    expect(insights.fans).toEqual(["fan_only"]);
  });

  it("does not treat blocked_and_unfollowed payload as a follower list via path helpers", () => {
    expect(isBlockedAndUnfollowedPath("blocked_and_unfollowed.json")).toBe(true);
    // File content exists only to document exclusion — parsers are never called for this path.
    expect(fixture("blocked_and_unfollowed.json")).toContain("blocked_user");
  });
});

describe("parseThreadsFollowersHtml", () => {
  it("extracts usernames from Threads profile links", () => {
    const html = `
      <html><body>
        <a href="https://www.threads.net/@html_user">html_user</a>
        <a href="https://www.threads.com/@other_user">other</a>
        <a href="https://www.threads.net/login">login</a>
      </body></html>
    `;
    const users = parseThreadsFollowersHtml(html);
    expect(users.map((u) => u.username).sort()).toEqual(["html_user", "other_user"]);
  });
});
