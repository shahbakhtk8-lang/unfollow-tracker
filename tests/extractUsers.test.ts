import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
import { describe, expect, it } from "vitest";
import {
  parseFollowersHtml,
  parseFollowersJson,
  parseFollowingJson,
} from "../src/lib/extractUsers";
import { normalizeUsername } from "../src/lib/normalize";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures", name), "utf8");

describe("normalizeUsername", () => {
  it("lowercases and trims", () => {
    expect(normalizeUsername("  Alice.Demo  ")).toBe("alice.demo");
  });
  it("rejects empty", () => {
    expect(normalizeUsername("")).toBeNull();
  });
});

describe("parseFollowingJson", () => {
  it("reads standard export", () => {
    const users = parseFollowingJson(fixture("following.json"));
    expect(users.map((u) => u.username).sort()).toEqual([
      "alice_demo",
      "bob_demo",
      "charlie_demo",
    ]);
  });
});

describe("parseFollowersJson", () => {
  it("reads standard export", () => {
    const users = parseFollowersJson(fixture("followers_1.json"));
    expect(users.map((u) => u.username).sort()).toEqual(["alice_demo", "diana_demo"]);
  });

  it("reads legacy array format", () => {
    const users = parseFollowersJson(fixture("followers_legacy_array.json"));
    expect(users[0]?.username).toBe("legacy_user");
  });
});

describe("parseFollowersHtml", () => {
  it("reads profile links from an HTML export", () => {
    const html = `
      <html><body>
        <a href="https://www.instagram.com/html_user/">html_user</a>
        <a href="https://www.instagram.com/explore/">skip</a>
      </body></html>
    `;
    const users = parseFollowersHtml(html);
    expect(users.map((u) => u.username)).toEqual(["html_user"]);
  });
});
