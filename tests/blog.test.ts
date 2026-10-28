import { describe, expect, it } from "vitest";
import { BLOG_POSTS, getBlogPost } from "../src/content/blog/posts";
import { loadBlogMarkdown, renderBlogHtml, splitArticleFaq } from "../src/lib/content";

describe("blog recent-followers post", () => {
  it("is registered with recent-followers SEO fields", () => {
    const post = getBlogPost("recent-followers");
    expect(post).toBeDefined();
    expect(post?.metaTitle).toContain("Recent Followers");
    expect(post?.metaDescription.toLowerCase()).toContain("recent followers");
    expect(post?.imagePath.endsWith(".webp")).toBe(true);
    expect(post?.youtubeVideoId).toBe("y0KEl_pHsMc");
    expect(BLOG_POSTS.length).toBeGreaterThan(0);
  });

  it("loads markdown with internal links and FAQ pairs", () => {
    const source = loadBlogMarkdown("recent-followers");
    expect(source).toBeTruthy();
    expect(source).toContain("](/guide)");
    expect(source).toContain("](/)");
    expect(source).toContain("](/analyze)");
    expect(source).toContain("](/pending-requests)");
    expect(source?.toLowerCase()).toContain("recent followers");

    const { body, faqItems } = splitArticleFaq(source!);
    expect(faqItems.length).toBeGreaterThanOrEqual(4);
    const html = renderBlogHtml(body);
    expect(html).toContain("article-table-wrap");
    expect(html).toContain('href="/guide"');
  });
});
