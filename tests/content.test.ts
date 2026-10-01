import { describe, expect, it } from "vitest";
import { loadArticle, renderArticleHtml } from "../src/lib/content";

describe("article content", () => {
  it("loads the Unfollow Tracker markdown by slug and renders a demoted heading", () => {
    const source = loadArticle("unfollow-tracker");
    expect(source).toContain("# How Does Unfollow Tracker Work?");
    expect(source).toContain("Why Use Unfollow Tracker?");
    const html = renderArticleHtml(source ?? "");
    expect(html).toMatch(/<h2\b/);
    expect(html).not.toMatch(/<h1\b/);
    expect(html).toContain("How Does Unfollow Tracker Work?");
    expect(html).toContain("<table>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("Safe");
    expect(html).not.toMatch(/<script/i);
  });

  it("renders a GFM pipe table as thead/tbody markup with column headers", () => {
    const html = renderArticleHtml(
      [
        "# Title",
        "",
        "| Feature | Details |",
        "|---|---|",
        "| **Safe** | No login |",
        "| Fast | Seconds |",
        "",
      ].join("\n"),
    );

    expect(html).toContain("<table>");
    expect(html).toContain("<thead>");
    expect(html).toContain('<th scope="col">');
    expect(html).toMatch(/<tbody>[\s\S]*<tr>/);
    expect(html).toContain("No login");
    expect(html).toContain("Seconds");
    expect(html).toContain('class="article-table-wrap"');
    expect(html.match(/article-table-wrap/g)?.length).toBe(1);
  });

  it("adds slug ids to headings without a visible hash icon", () => {
    const html = renderArticleHtml("# How Does Unfollow Tracker Work?\n\nHello.");
    expect(html).toContain('<h2 id="how-does-unfollow-tracker-work">');
    expect(html).not.toContain(">#</a>");
    expect(html).not.toContain(">#</span>");
  });

  it("returns null for an unknown slug", () => {
    expect(loadArticle("does-not-exist")).toBeNull();
  });
});
