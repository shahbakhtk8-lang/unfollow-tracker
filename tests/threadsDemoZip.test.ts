import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { diffSnapshots } from "../src/lib/diff";
import {
  parseThreadsZipBlob,
  zipLooksLikeThreadsExport,
} from "../src/lib/parseThreadsZip";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

describe("Threads demo ZIPs", () => {
  it("detects threads-demo.zip as Threads (not Instagram connections path)", async () => {
    const buf = readFileSync(join(root, "public", "demo", "threads-demo.zip"));
    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files);
    expect(names.some((n) => n.includes("threads/"))).toBe(true);
    expect(names.some((n) => n.includes("blocked_and_unfollowed"))).toBe(true);
    expect(zipLooksLikeThreadsExport(names)).toBe(true);
    expect(
      zipLooksLikeThreadsExport(["connections/followers_and_following/followers_1.json"]),
    ).toBe(false);
  });

  it("parses threads-demo.zip insights and excludes blocked users", async () => {
    const buf = readFileSync(join(root, "public", "demo", "threads-demo.zip"));
    const result = await parseThreadsZipBlob(new Blob([buf]));

    expect(result.insights.followerCount).toBe(35);
    expect(result.insights.followingCount).toBe(40);
    expect(result.insights.mutuals.length).toBe(30);
    expect(result.insights.notFollowingBack.length).toBe(10);
    expect(result.insights.fans.length).toBe(5);
    expect(result.insights.followBackRate).toBe(75);

    expect(result.followerUsernames).not.toContain("demo_blocked_01");
    expect(result.followerUsernames).not.toContain("demo_blocked_02");
    expect(result.followerUsernames).not.toContain("demo_blocked_03");
    expect(result.followingUsernames).not.toContain("demo_blocked_01");
  });

  it("diffSnapshots between demo and later shows 5 unfollowers", async () => {
    const firstBuf = readFileSync(join(root, "public", "demo", "threads-demo.zip"));
    const laterBuf = readFileSync(join(root, "public", "demo", "threads-demo-later.zip"));
    const first = await parseThreadsZipBlob(new Blob([firstBuf]));
    const later = await parseThreadsZipBlob(new Blob([laterBuf]));

    expect(later.insights.followerCount).toBe(30);
    expect(later.insights.followingCount).toBe(40);

    const diff = diffSnapshots(first.followerUsernames, later.followerUsernames);
    expect(diff.unfollowed.sort()).toEqual(
      [
        "demo_fan_01",
        "demo_fan_02",
        "demo_follow_01",
        "demo_follow_02",
        "demo_follow_03",
      ].sort(),
    );
    expect(diff.newFollowers).toEqual([]);
  });
});
