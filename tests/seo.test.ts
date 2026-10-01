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
      "HowTo",
      "VideoObject",
      "FAQPage",
    ]);

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
    expect(html).toContain(YOUTUBE_VIDEO_ID);
  });
});
