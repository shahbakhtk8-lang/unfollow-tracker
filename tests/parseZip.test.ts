import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { parseZipBlob } from "../src/lib/parseZip";
import { diffSnapshots } from "../src/lib/diff";
import { parseFollowersJson } from "../src/lib/extractUsers";
import { usernamesFromEntries } from "../src/lib/normalize";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(join(__dirname, "fixtures", name));

async function zipWith(files: Record<string, Buffer>): Promise<Blob> {
  const zip = new JSZip();
  for (const [path, data] of Object.entries(files)) {
    zip.file(path, data);
  }
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return new Blob([buffer]);
}

describe("parseZipBlob", () => {
  it("reads a Meta-style archive and keeps follow dates", async () => {
    const blob = await zipWith({
      "connections/followers_and_following/followers_1.json": fixture("followers_1.json"),
      "connections/followers_and_following/following.json": fixture("following.json"),
    });

    const result = await parseZipBlob(blob);

    expect(result.insights.mutuals).toEqual(["alice_demo"]);
    expect(result.insights.notFollowingBack).toEqual(["bob_demo", "charlie_demo"]);
    expect(result.insights.fans).toEqual(["diana_demo"]);
    expect(result.followerTimestamps.alice_demo).toBe(1699000000);
    expect(result.followingTimestamps.charlie_demo).toBe(1700000200);

    const empty = await zipWith({
      "connections/followers_and_following/followers_1.json": Buffer.from("[]"),
      "connections/followers_and_following/following.json": Buffer.from(
        JSON.stringify({ relationships_following: [] }),
      ),
    });
    await expect(parseZipBlob(empty)).rejects.toThrow(/no followers or following accounts/);

    const notZip = new Blob(["this is plain text, not a zip archive"]);
    await expect(parseZipBlob(notZip)).rejects.toThrow(
      /could not be read as an Instagram export ZIP/,
    );

    const older = usernamesFromEntries(parseFollowersJson(fixture("followers_old.json").toString()));
    const diff = diffSnapshots(older, result.followerUsernames);
    expect(diff.unfollowed).toEqual(["left_user", "stays"]);
    expect(diff.newFollowers.sort()).toEqual(["alice_demo", "diana_demo"]);
  });

  it("streams a large HTML export without buffering the whole file as one string", async () => {
    const followerCount = 4000;
    const followingCount = 1500;
    const filler = "not-a-profile-link ".repeat(220);
    const wrap = (name: string) =>
      `<div class="pam _3-95 _2ph- _a6-g"><div class="_a6-p"><div class="_a6-q">` +
      `<a target="_blank" href="https://www.instagram.com/${name}/">${name}</a>` +
      `</div><div class="_a72d">${filler}</div></div></div>\n`;

    let followersHtml =
      `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><main class="_a6-w">\n`;
    for (let i = 1; i <= followerCount; i += 1) {
      followersHtml += wrap(`test_user_${String(i).padStart(6, "0")}`);
    }
    followersHtml += "</main></body></html>";
    expect(followersHtml.length).toBeGreaterThan(15 * 1024 * 1024);
    expect(followersHtml.length).toBeLessThan(22 * 1024 * 1024);

    let followingHtml =
      `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><main class="_a6-w">\n`;
    for (let i = 1; i <= followingCount; i += 1) {
      followingHtml += wrap(`test_user_${String(i).padStart(6, "0")}`);
    }
    followingHtml += "</main></body></html>";

    const percents: number[] = [];
    const messages: string[] = [];
    const blob = await zipWith({
      "connections/followers_and_following/followers_1.html": Buffer.from(followersHtml, "utf8"),
      "connections/followers_and_following/following.html": Buffer.from(followingHtml, "utf8"),
    });
    followersHtml = "";
    followingHtml = "";

    const result = await parseZipBlob(blob, (progress) => {
      percents.push(progress.percent);
      messages.push(progress.message);
    });

    expect(result.insights.followerCount).toBe(followerCount);
    expect(result.insights.followingCount).toBe(followingCount);
    expect(result.followerUsernames[0]).toBe("test_user_000001");
    expect(result.followerUsernames.at(-1)).toBe("test_user_004000");
    expect(messages.some((msg) => /MB of /.test(msg))).toBe(true);
    expect(percents.some((n) => n > 35 && n < 60)).toBe(true);
  }, 30_000);
});
