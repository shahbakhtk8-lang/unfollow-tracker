import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArticleSection } from "../src/components/content/ArticleSection";
import {
  isDraftArticle,
  loadArticle,
  renderArticleHtml,
  splitArticleFaq,
} from "../src/lib/content";

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

  it("parses and renders the Pending Requests article FAQ accordion", () => {
    const source = loadArticle("pending-requests");
    expect(source).not.toBeNull();
    expect(source).not.toMatch(/[—–]/);
    const { body, faqHeading, faqItems } = splitArticleFaq(source ?? "");
    expect(faqHeading).toBe("Frequently Asked Questions");
    expect(faqItems).toHaveLength(4);
    expect(faqItems.map((item) => item.question)).toEqual([
      "How long can a pending request stay unaccepted?",
      'What happens when I click "Cancel on Instagram"?',
      "Can I check pending requests for multiple accounts?",
      "Do I need to give my login credentials to check pending requests?",
    ]);
    expect(faqItems.every((item) => item.answer.length > 0)).toBe(true);
    expect(body).not.toContain("Understanding Your Pending Follow Requests");
    expect(body).toContain("Why Do You Have Pending Follow Requests?");

    const html = renderArticleHtml(body);
    expect(html).not.toMatch(/<h1\b/);
    expect(html).not.toContain("Understanding Your Pending Follow Requests");
    expect(html).toContain("How Our Tool Reads Your Pending Requests");
    // Lead body is h2 card with no step number; remaining four body sections are numbered h3 cards.
    const cardBlocks = [
      ...html.matchAll(
        /<div class="article-section-card[^"]*">([\s\S]*?)(?=<div class="article-section-card|$)/g,
      ),
    ];
    expect(cardBlocks.length).toBe(5);
    const bodyHeadings = cardBlocks.map((match) => {
      const hasStepNumber = /article-section-step-number/.test(match[1] ?? "");
      const heading = match[1]?.match(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/i);
      expect(heading).not.toBeNull();
      return {
        level: heading![1],
        text: heading![2]?.replace(/<[^>]+>/g, "").trim(),
        hasStepNumber,
      };
    });
    expect(bodyHeadings.map((item) => item.level)).toEqual(["2", "3", "3", "3", "3"]);
    expect(bodyHeadings.map((item) => item.hasStepNumber)).toEqual([
      false,
      true,
      true,
      true,
      true,
    ]);
    expect(bodyHeadings.map((item) => item.text)).toEqual([
      "Why Do You Have Pending Follow Requests?",
      "How Our Tool Reads Your Pending Requests",
      "Your Data Stays Safe in Your Browser",
      "Why Some Requests Stay Pending for Years",
      "How to Act on Your Pending Requests",
    ]);
    expect(html).toContain("rounded-2xl border border-border/80 bg-card/90");
    expect(html).toContain("shadow-sm p-6");
    expect(html).toContain("text-4xl font-extrabold text-primary/40");
    expect(html).toContain(">1</span>");
    expect(html).toContain(">4</span>");
    expect(html).not.toContain(">5</span>");

    const markup = renderToStaticMarkup(createElement(ArticleSection, { slug: "pending-requests" }));
    expect(markup).toContain("Frequently Asked Questions");
    expect(markup).toContain("How long can a pending request stay unaccepted?");
    expect(markup.match(/aria-expanded="false"/g)?.length).toBe(4);
    expect(markup).not.toContain("**How long can a pending request");
    expect(markup).toContain("article-section-card");
    expect(markup).toMatch(
      /<\/div><section class="article-faq"[\s\S]*Frequently Asked Questions/,
    );
  });

  it("hides draft articles (first-line <!-- draft -->) with no empty section", () => {
    const source = loadArticle("instagram-font-generator");
    expect(source).not.toBeNull();
    expect(isDraftArticle(source ?? "")).toBe(true);
    expect(isDraftArticle("## Visible\n\nHello")).toBe(false);
    expect(isDraftArticle(" <!-- draft -->\n## Title")).toBe(false);

    const markup = renderToStaticMarkup(
      createElement(ArticleSection, { slug: "instagram-font-generator" }),
    );
    expect(markup).toBe("");
    expect(markup).not.toContain("article");
    expect(markup).not.toContain("Instagram Font Generator");
    expect(markup).not.toContain("Placeholder");
  });
});
