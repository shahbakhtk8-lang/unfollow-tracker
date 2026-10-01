import { describe, expect, it } from "vitest";
import { loadArticle, renderArticleHtml } from "../src/lib/content";

describe("article content", () => {
  it("loads the Unfollow Tracker markdown by slug and renders a demoted heading", () => {
    const source = loadArticle("unfollow-tracker");
    expect(source).toContain("# How Does Unfollow Tracker Work?");
    expect(source).toContain("Why Use Unfollow Tracker?");
    const html = renderArticleHtml(source ?? "");
    expect(html).toContain("<h2>");
    expect(html).not.toContain("<h1>");
    expect(html).toContain("How Does Unfollow Tracker Work?");
    expect(html).toContain("<table>");
    expect(html).toContain("Safe");
    expect(html).not.toMatch(/<script/i);
  });

  it("returns null for an unknown slug", () => {
    expect(loadArticle("does-not-exist")).toBeNull();
  });
});
