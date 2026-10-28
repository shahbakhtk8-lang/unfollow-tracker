import { SITE_URL } from "@/content/seo";

export type BlogPostMeta = {
  slug: string;
  /** Visible H1 */
  title: string;
  /** <title> / og:title */
  metaTitle: string;
  metaDescription: string;
  /** ISO date YYYY-MM-DD */
  publishedAt: string;
  /** Path under /public */
  imagePath: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  youtubeVideoId: string;
  youtubeTitle: string;
};

export const BLOG_POSTS: readonly BlogPostMeta[] = [
  {
    slug: "recent-followers",
    title: "How to See Recent Followers on Instagram",
    metaTitle: "How to See Recent Followers on Instagram (No Login)",
    metaDescription:
      "Check recent followers on Instagram manually or with your official export. Sort by date followed, compare Followers snapshots, and analyze your ZIP privately on igunfollowed.com — no login required.",
    publishedAt: "2026-10-28",
    imagePath: "/images/recent-followers-featured.webp",
    imageAlt: "How to see recent followers on Instagram — Followers list with recent dates highlighted",
    imageWidth: 1280,
    imageHeight: 720,
    youtubeVideoId: "y0KEl_pHsMc",
    youtubeTitle: "How to see recent followers on Instagram | IGUnfollowed.com",
  },
] as const;

export function getBlogPost(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function blogPostCanonical(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}

export function blogPostImageUrl(post: BlogPostMeta): string {
  return `${SITE_URL}${post.imagePath}`;
}
