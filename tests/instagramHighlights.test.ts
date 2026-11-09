import { describe, expect, it } from "vitest";
import {
  fetchInstagramHighlights,
  HighlightsApiError,
  mapApifyItemsToResult,
  parseInstagramUsername,
} from "../src/lib/instagramHighlights";
import { loadArticle, isDraftArticle, splitArticleFaq } from "../src/lib/content";

describe("parseInstagramUsername", () => {
  it("parses bare, @, and profile URLs", () => {
    expect(parseInstagramUsername("DemoUser")).toBe("demouser");
    expect(parseInstagramUsername("@demo_user")).toBe("demo_user");
    expect(parseInstagramUsername("https://www.instagram.com/natgeo/")).toBe("natgeo");
    expect(parseInstagramUsername("instagram.com/natgeo")).toBe("natgeo");
  });

  it("rejects invalid input", () => {
    expect(parseInstagramUsername("")).toBeNull();
    expect(parseInstagramUsername("bad user")).toBeNull();
    expect(parseInstagramUsername("https://example.com/natgeo")).toBeNull();
  });
});

describe("fetchInstagramHighlights (mock provider)", () => {
  it("returns trays for a normal username", async () => {
    const data = await fetchInstagramHighlights("demo");
    expect(data.username).toBe("demo");
    expect(data.highlights.length).toBeGreaterThan(0);
    expect(data.highlights[0]!.stories.length).toBeGreaterThan(0);
  });

  it("maps special usernames to typed errors", async () => {
    await expect(fetchInstagramHighlights("private")).rejects.toMatchObject({
      code: "PRIVATE_ACCOUNT",
    } satisfies Partial<HighlightsApiError>);
    await expect(fetchInstagramHighlights("notfound")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(fetchInstagramHighlights("empty")).rejects.toMatchObject({
      code: "NO_HIGHLIGHTS",
    });
    await expect(fetchInstagramHighlights("ratelimit")).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
    await expect(fetchInstagramHighlights("!!!")).rejects.toMatchObject({
      code: "INVALID_USERNAME",
    });
  });
});

describe("mapApifyItemsToResult", () => {
  it("maps Apify highlight records into trays and stories", () => {
    const result = mapApifyItemsToResult("natgeo", [
      {
        username: "natgeo",
        highlightId: "178",
        title: "Expeditions",
        coverUrl: "https://example.com/cover.jpg",
        stories: [
          {
            id: "1",
            mediaType: "image",
            imageUrl: "https://example.com/a.jpg",
            timestamp: 1_700_000_000,
          },
          {
            id: "2",
            mediaType: "video",
            imageUrl: "https://example.com/thumb.jpg",
            videoUrl: "https://example.com/b.mp4",
            timestamp: 1_700_000_100,
          },
        ],
      },
    ]);
    expect(result.username).toBe("natgeo");
    expect(result.highlights).toHaveLength(1);
    expect(result.highlights[0]!.title).toBe("Expeditions");
    expect(result.highlights[0]!.stories).toHaveLength(2);
    expect(result.highlights[0]!.stories[1]!.type).toBe("video");
    expect(result.highlights[0]!.stories[1]!.mediaUrl).toContain("b.mp4");
  });

  it("throws NO_HIGHLIGHTS when Apify returns nothing usable", () => {
    expect(() => mapApifyItemsToResult("x", [])).toThrowError(HighlightsApiError);
    try {
      mapApifyItemsToResult("x", []);
    } catch (error) {
      expect(error).toMatchObject({ code: "NO_HIGHLIGHTS" });
    }
  });
});

describe("instagram-highlights-viewer article", () => {
  it("is published (not a draft) with FAQ content and how-to steps", () => {
    const source = loadArticle("instagram-highlights-viewer");
    expect(source).toBeTruthy();
    expect(isDraftArticle(source!)).toBe(false);
    expect(source).toContain("# How to View and Download Instagram Highlights");
    expect(source).toContain("## Enter the Username or Profile Link");
    expect(source).toContain("| Instagram App | igunfollowed |");
    expect(source).toContain("](/)");
    expect(source).toContain("](/pending-requests)");
    expect(source).toContain("](/instagram-font-generator)");
    expect(source).toContain("](/blog/recent-followers)");
    const { faqItems } = splitArticleFaq(source!);
    expect(faqItems.length).toBeGreaterThanOrEqual(5);
  });
});
