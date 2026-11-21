import { describe, expect, it } from "vitest";
import { loadArticle, renderArticleHtml, splitArticleFaq } from "@/lib/content";

describe("threads article screenshots", () => {
  it("renders six step-rows with images without breaking tables or FAQ", () => {
    const source = loadArticle("threads-unfollow-tracker");
    expect(source).toBeTruthy();
    const { body, faqItems } = splitArticleFaq(source!);
    const html = renderArticleHtml(body);
    expect(html.match(/class="article-step-row /g)?.length).toBe(6);
    expect(html.match(/article-step-row--wide/g)?.length).toBe(6);
    expect(html.match(/article-step-row--phone/g)?.length ?? 0).toBe(0);
    expect(html.match(/<img /g)?.length).toBe(6);
    expect(html).toContain('src="/images/articles/threads-unfollow-tracker/threads-step1-export-info.webp"');
    expect(html).toContain('src="/images/articles/threads-unfollow-tracker/threads-step5-upload-real.webp"');
    expect(html).toContain('src="/images/articles/threads-unfollow-tracker/threads-step6-results-real.webp"');
    expect(html.match(/loading="lazy"/g)?.length).toBe(6);
    expect(html.match(/decoding="async"/g)?.length).toBe(6);
    expect(html.match(/article-img--wide/g)?.length).toBe(6);
    expect(html.match(/<table/g)?.length).toBeGreaterThanOrEqual(2);
    expect(faqItems).toHaveLength(4);
    expect(html).not.toContain("<script");
  });
});
