import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FEATURED_IMAGE_ALT,
  FEATURED_IMAGE_HEIGHT,
  FEATURED_IMAGE_URL,
  FEATURED_IMAGE_WIDTH,
  HOME_META_DESCRIPTION,
  HOME_META_TITLE,
  YOUTUBE_VIDEO_ID,
  buildHomeJsonLd,
  homeFaqs,
} from "../src/content/seo";

describe("home SEO", () => {
  it("uses the 2026 title, featured image size, and full JSON-LD graph", () => {
    expect(HOME_META_TITLE).toBe("Instagram Unfollow Tracker Free online - Without Login 2026");
    expect(FEATURED_IMAGE_ALT).toBe(HOME_META_TITLE);
    expect(FEATURED_IMAGE_WIDTH).toBe(1280);
    expect(FEATURED_IMAGE_HEIGHT).toBe(850);

    const graph = buildHomeJsonLd()["@graph"] as Array<Record<string, unknown>>;
    const types = graph.map((node) => node["@type"]);
    expect(types).toEqual([
      "WebSite",
      "WebPage",
      "ImageObject",
      "SoftwareApplication",
      "VideoObject",
      "FAQPage",
    ]);
    expect(types).not.toContain("HowTo");

    const video = graph.find((node) => node["@type"] === "VideoObject");
    expect(video?.embedUrl).toBe(`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`);
    expect(video?.contentUrl).toBe(`https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`);

    const faq = graph.find((node) => node["@type"] === "FAQPage");
    const entities = faq?.mainEntity as unknown[];
    expect(entities).toHaveLength(homeFaqs.length);

    const image = graph.find((node) => node["@type"] === "ImageObject");
    expect(image?.url).toBe(FEATURED_IMAGE_URL);
    expect(image?.width).toBe(1280);
    expect(image?.height).toBe(850);
  });

  it("keeps index.html meta tags aligned with the SEO constants", () => {
    const html = readFileSync(resolve("index.html"), "utf8");
    expect(html).toContain(`<title>${HOME_META_TITLE}</title>`);
    expect(html).toContain(`content="${HOME_META_DESCRIPTION}"`);
    expect(html).toContain(FEATURED_IMAGE_URL);
    expect(html).toContain('property="og:image:width" content="1280"');
    expect(html).toContain('property="og:image:height" content="850"');
    expect(html).toContain("application/ld+json");
    expect(html).toContain("VideoObject");
    expect(html).toContain("FAQPage");
    expect(html).toContain("SoftwareApplication");
    expect(html).not.toContain("HowTo");
    expect(html).not.toContain("How Does Igunfollow Tool Works?");
    expect(html).toContain(YOUTUBE_VIDEO_ID);
    expect(html).toMatch(/rel="canonical" href="https:\/\/igunfollowed\.com"/);
    expect(html).toContain('property="og:url" content="https://igunfollowed.com"');
    expect(html).not.toMatch(/name=["']twitter:url["']/);
  });

  it("points robots.txt at the production sitemap", () => {
    const robots = readFileSync(resolve("public/robots.txt"), "utf8");
    expect(robots).toContain("Sitemap: https://igunfollowed.com/sitemap.xml");
    expect(robots).not.toContain("pages.dev");
    expect(robots).toMatch(/User-agent:\s*\*/);
    expect(robots).toMatch(/Allow:\s*\//);
  });

  it("lists canonical production URLs in the sitemap", () => {
    const xml = readFileSync(resolve("public/sitemap.xml"), "utf8");
    expect(xml).toContain("<loc>https://igunfollowed.com</loc>");
    expect(xml).not.toContain("<loc>https://igunfollowed.com/</loc>");
    expect(xml).not.toContain("pages.dev");
    expect(xml).not.toContain("<loc>https://igunfollowed.com/analyze</loc>");
    expect(xml).toContain("<lastmod>2026-11-25</lastmod>");
    expect(xml).toContain("<loc>https://igunfollowed.com/guide</loc>");
    expect(xml).toContain("<loc>https://igunfollowed.com/privacy</loc>");
    expect(xml).toContain("<loc>https://igunfollowed.com/instagram-highlights-viewer</loc>");
    expect(xml).toContain("<loc>https://igunfollowed.com/instagram-grid-maker</loc>");
    expect(xml).toContain("<loc>https://igunfollowed.com/blog/recent-followers</loc>");
  });
});
