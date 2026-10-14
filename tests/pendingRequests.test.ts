import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  isPendingFollowRequestsPath,
  parsePendingFollowRequestsHtml,
  parsePendingFollowRequestsJson,
} from "../src/lib/extractUsers";
import { parsePendingRequestsZipBlob } from "../src/lib/parseZip";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(join(__dirname, "fixtures", name), "utf8");

async function zipWith(files: Record<string, string | Buffer>): Promise<Blob> {
  const zip = new JSZip();
  for (const [path, data] of Object.entries(files)) {
    zip.file(path, data);
  }
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return new Blob([buffer]);
}

describe("isPendingFollowRequestsPath", () => {
  it("matches the Meta export path", () => {
    expect(
      isPendingFollowRequestsPath(
        "connections/followers_and_following/pending_follow_requests.json",
      ),
    ).toBe(true);
    expect(
      isPendingFollowRequestsPath(
        "connections/followers_and_following/pending_follow_requests.html",
      ),
    ).toBe(true);
    expect(
      isPendingFollowRequestsPath("connections/followers_and_following/following.json"),
    ).toBe(false);
  });
});

describe("parsePendingFollowRequestsJson", () => {
  it("reads the wrapped export, dedupes, and drops the instagram placeholder", () => {
    const users = parsePendingFollowRequestsJson(fixture("pending_follow_requests.json"));
    expect(users.map((u) => u.username)).toEqual([
      "test_user_pending_001",
      "test_user_pending_002",
    ]);
    expect(users[0]?.timestamp).toBe(1609459200);
    expect(users[1]?.href).toContain("test_user_pending_002");
  });

  it("reads the legacy top-level array format", () => {
    const users = parsePendingFollowRequestsJson(
      fixture("pending_follow_requests_legacy_array.json"),
    );
    expect(users.map((u) => u.username)).toEqual(["test_user_pending_legacy"]);
    expect(users[0]?.timestamp).toBe(1583020800);
  });

  it("returns an empty list for an empty wrapper", () => {
    const users = parsePendingFollowRequestsJson(
      JSON.stringify({ relationships_follow_requests_sent: [] }),
    );
    expect(users).toEqual([]);
  });
});

describe("parsePendingFollowRequestsHtml", () => {
  it("reads profile links from an HTML export", () => {
    const html = `
      <html><body>
        <a href="https://www.instagram.com/test_user_pending_html/">test_user_pending_html</a>
        <a href="https://www.instagram.com/explore/">skip</a>
        <a href="https://www.instagram.com/Instagram/">instagram</a>
      </body></html>
    `;
    expect(parsePendingFollowRequestsHtml(html).map((u) => u.username)).toEqual([
      "test_user_pending_html",
    ]);
  });
});

describe("parsePendingRequestsZipBlob", () => {
  it("extracts pending requests from a Meta-style ZIP", async () => {
    const blob = await zipWith({
      "connections/followers_and_following/pending_follow_requests.json": fixture(
        "pending_follow_requests.json",
      ),
    });
    const result = await parsePendingRequestsZipBlob(blob);
    expect(result.usernames).toEqual(["test_user_pending_001", "test_user_pending_002"]);
    expect(result.timestamps.test_user_pending_001).toBe(1609459200);
    expect(result.hasAnyTimestamp).toBe(true);
  });

  it("accepts an empty pending list without throwing", async () => {
    const blob = await zipWith({
      "connections/followers_and_following/pending_follow_requests.json": JSON.stringify({
        relationships_follow_requests_sent: [],
      }),
    });
    const result = await parsePendingRequestsZipBlob(blob);
    expect(result.requests).toEqual([]);
    expect(result.hasAnyTimestamp).toBe(false);
  });

  it("throws a friendly error when the pending file is missing", async () => {
    const blob = await zipWith({
      "connections/followers_and_following/following.json": fixture("following.json"),
    });
    await expect(parsePendingRequestsZipBlob(blob)).rejects.toThrow(
      /Could not find pending follow requests/,
    );
  });

  it("parses an HTML pending_follow_requests file", async () => {
    const html =
      '<a href="https://www.instagram.com/test_user_pending_html_zip/">x</a>';
    const blob = await zipWith({
      "connections/followers_and_following/pending_follow_requests.html": html,
    });
    const result = await parsePendingRequestsZipBlob(blob);
    expect(result.usernames).toEqual(["test_user_pending_html_zip"]);
    expect(result.hasAnyTimestamp).toBe(false);
  });
});
