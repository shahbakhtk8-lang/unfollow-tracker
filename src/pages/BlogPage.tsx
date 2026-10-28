import { Link } from "react-router-dom";
import { BLOG_POSTS } from "@/content/blog/posts";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { SITE_URL } from "@/content/seo";

export default function BlogPage() {
  useDocumentMeta({
    title: "Blog — Unfollow Tracker",
    description:
      "Guides on recent followers, private unfollow tracking, and Instagram data exports — no password required.",
    canonical: `${SITE_URL}/blog`,
  });

  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-sm leading-relaxed sm:px-6 sm:py-16">
      <header className="space-y-3">
        <h1 className="font-display text-4xl font-bold">Blog</h1>
        <p className="text-muted">
          Guides and notes on private unfollow tracking, Instagram exports, and checking recent
          followers without handing over your password.
        </p>
      </header>

      {BLOG_POSTS.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <h2 className="font-display text-xl font-bold">Blog coming soon</h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            Posts are on the way. Nothing to read here yet — check back when we publish the first
            article.
          </p>
        </div>
      ) : (
        <ul className="space-y-6">
          {BLOG_POSTS.map((post) => {
            const publishedLabel = new Date(`${post.publishedAt}T12:00:00`).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long", day: "numeric" },
            );
            return (
              <li key={post.slug}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <img
                    src={post.imagePath}
                    alt=""
                    width={post.imageWidth}
                    height={post.imageHeight}
                    className="aspect-[16/9] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="space-y-2 p-5 sm:p-6">
                    <time className="text-xs text-muted" dateTime={post.publishedAt}>
                      {publishedLabel}
                    </time>
                    <h2 className="font-display text-xl font-bold text-foreground group-hover:text-primary">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted">{post.metaDescription}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
