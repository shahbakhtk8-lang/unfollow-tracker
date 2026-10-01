import { describe, expect, it } from "vitest";
import { loadArticle, renderArticleHtml } from "../src/lib/content";

describe("article content", () => {
  it("loads the Unfollow Tracker markdown by slug and renders a demoted heading", () => {
    const source = loadArticle("unfollow-tracker");
    expect(source).toContain("# [ARTICLE TITLE HERE]");
    expect(source).toContain("placeholder");
    const html = renderArticleHtml(source ?? "");
    expect(html).toContain("<h2>");
    expect(html).not.toContain("<h1>");
    expect(html).toContain("[ARTICLE TITLE HERE]");
    expect(html).not.toMatch(/<script/i);
  });

  it("returns null for an unknown slug", () => {
    expect(loadArticle("does-not-exist")).toBeNull();
  });
});
