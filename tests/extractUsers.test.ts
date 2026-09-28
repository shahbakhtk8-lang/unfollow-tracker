import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
import { describe, expect, it } from "vitest";
import {
  parseFollowersHtml,
  parseFollowersJson,
  parseFollowingHtml,
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
  it("drops the instagram placeholder regardless of case", () => {
    expect(normalizeUsername("instagram")).toBeNull();
    expect(normalizeUsername("Instagram")).toBeNull();
    expect(normalizeUsername("INSTAGRAM")).toBeNull();
    expect(normalizeUsername("instagram user")).toBeNull();
    expect(normalizeUsername("instagram_fan")).toBe("instagram_fan");
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

  it("drops an instagram placeholder value", () => {
    const users = parseFollowersJson(
      JSON.stringify({
        relationships_followers: [
          { string_list_data: [{ value: "Instagram", timestamp: 1 }] },
          { string_list_data: [{ value: "test_user_001", timestamp: 2 }] },
        ],
      }),
    );
    expect(users.map((u) => u.username)).toEqual(["test_user_001"]);
  });
});

describe("parseFollowingJson instagram placeholder", () => {
  it("drops an instagram placeholder value", () => {
    const users = parseFollowingJson(
      JSON.stringify({
        relationships_following: [
          { string_list_data: [{ value: "instagram", timestamp: 1 }] },
          { string_list_data: [{ value: "test_user_002", timestamp: 2 }] },
        ],
      }),
    );
    expect(users.map((u) => u.username)).toEqual(["test_user_002"]);
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

  it("drops the instagram profile link", () => {
    const html = `
      <a href="https://www.instagram.com/Instagram/">instagram</a>
      <a href="https://www.instagram.com/test_user_003/">test_user_003</a>
    `;
    expect(parseFollowersHtml(html).map((u) => u.username)).toEqual(["test_user_003"]);
    expect(parseFollowingHtml(html).map((u) => u.username)).toEqual(["test_user_003"]);
  });
});
