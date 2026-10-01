import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArticleSection } from "../src/components/content/ArticleSection";
import { loadArticle, renderArticleHtml, splitArticleFaq } from "../src/lib/content";

describe("article content", () => {
  it("loads the Unfollow Tracker markdown by slug and renders a demoted heading", () => {
    const source = loadArticle("unfollow-tracker");
    expect(source).toContain("# How Does Igunfollow Tool Works?");
    expect(source).toContain("Why Use Unfollow Tracker Tool?");
    const html = renderArticleHtml(source ?? "");
    expect(html).toMatch(/<h2\b/);
    expect(html).not.toMatch(/<h1\b/);
    expect(html).toContain("How Does Igunfollow Tool Works?");
    expect(html).toContain("<table>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html.match(/<table>/g)?.length).toBe(2);
    expect(html.match(/article-table-wrap/g)?.length).toBe(2);
    expect(html).toContain("Safe &amp; secure");
    expect(html).toContain("Follower Health Ranges");
    expect(html).toContain("Account size");
    expect(html).toContain("scope=\"col\"");
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

  it("parses the Unfollow Tracker FAQ into question/answer pairs", () => {
    const source = loadArticle("unfollow-tracker");
    expect(source).not.toBeNull();
    const { body, faqHeading, faqItems } = splitArticleFaq(source ?? "");
    expect(faqHeading).toBe("Frequently Asked Questions");
    expect(faqItems).toHaveLength(5);
    expect(faqItems[0]?.question).toBe("How can we see who unfollowed you on instagram?");
    expect(faqItems[1]?.question).toBe("Is igunfollowed safe to use?");
    expect(faqItems[3]?.question).toBe(
      "Difference between unfollowers and users who don't follow you back",
    );
    expect(faqItems[4]?.question).toBe("Can I see who blocked me on Instagram?");
    expect(faqItems.every((item) => item.answer.length > 0)).toBe(true);
    expect(body).not.toMatch(/frequently asked questions/i);
    expect(body).toContain("Why Use Unfollow Tracker Tool?");
    expect(body).toContain("Igunfollow");
  });

  it("renders the article FAQ as a collapsed accordion with five items", () => {
    const markup = renderToStaticMarkup(createElement(ArticleSection, { slug: "unfollow-tracker" }));
    expect(markup).toContain("Frequently Asked Questions");
    expect(markup).toContain("How can we see who unfollowed you on instagram?");
    expect(markup).toContain("Can I see who blocked me on Instagram?");
    expect(markup.match(/aria-expanded="false"/g)?.length).toBe(5);
    expect(markup).toContain('data-orientation="vertical"');
    expect(markup.match(/<table>/g)?.length).toBe(2);
    expect(markup).not.toContain("**How can we see who unfollowed you");
  });
});
