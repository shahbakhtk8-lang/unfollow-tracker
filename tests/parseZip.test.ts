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

    const notZip = new Blob(["this is plain text, not a zip archive"]);
    await expect(parseZipBlob(notZip)).rejects.toThrow(
      /could not be read as an Instagram export ZIP/,
    );

    const older = usernamesFromEntries(parseFollowersJson(fixture("followers_old.json").toString()));
    const diff = diffSnapshots(older, result.followerUsernames);
    expect(diff.unfollowed).toEqual(["left_user", "stays"]);
    expect(diff.newFollowers.sort()).toEqual(["alice_demo", "diana_demo"]);
  });
});
