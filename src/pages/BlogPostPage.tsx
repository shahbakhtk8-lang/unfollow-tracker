import { useEffect, useRef, type MouseEvent, type RefObject } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { YouTubeEmbed } from "@/components/content/YouTubeEmbed";
import {
  blogPostCanonical,
  blogPostImageUrl,
  getBlogPost,
} from "@/content/blog/posts";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import {
  loadBlogMarkdown,
  renderBlogHtml,
  renderMarkdownFragment,
  slugifyHeading,
  splitArticleFaq,
} from "@/lib/content";

function useArticleReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let cancelled = false;
    let io: IntersectionObserver | undefined;
    const w = window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const start = () => {
      if (cancelled || !rootRef.current) return;
      const el = rootRef.current;
      el.classList.add("article-reveal-ready");
      const items = el.querySelectorAll<HTMLElement>(
        ".article-section-card, .article-faq, .article-table-wrap, blockquote, ol",
      );
      items.forEach((node) => node.classList.add("article-reveal-item"));
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io?.unobserve(entry.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
      );
      items.forEach((node) => io?.observe(node));
    };

    const idleId =
      typeof w.requestIdleCallback === "function"
        ? w.requestIdleCallback(start, { timeout: 3200 })
        : undefined;
    const fallbackId = idleId == null ? window.setTimeout(start, 400) : undefined;

    return () => {
      cancelled = true;
      if (idleId != null) w.cancelIdleCallback?.(idleId);
      if (fallbackId != null) window.clearTimeout(fallbackId);
      io?.disconnect();
      root.classList.remove("article-reveal-ready");
    };
  }, [rootRef]);
}

function isModifiedClick(e: MouseEvent): boolean {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

export default function BlogPostPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const post = getBlogPost(slug);
  const source = post ? loadBlogMarkdown(post.slug) : null;
  const rootRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  useArticleReveal(rootRef);

  useDocumentMeta(
    post
      ? {
          title: post.metaTitle,
          description: post.metaDescription,
          canonical: blogPostCanonical(post.slug),
          image: blogPostImageUrl(post),
          imageAlt: post.imageAlt,
          imageWidth: post.imageWidth,
          imageHeight: post.imageHeight,
        }
      : {
          title: "Blog — Unfollow Tracker",
          description: "Guides and notes on private unfollow tracking and Instagram exports.",
          canonical: blogPostCanonical(slug || "missing"),
        },
  );

  if (!post || !source) {
    return <Navigate to="/blog" replace />;
  }

  const { body, faqHeading, faqItems } = splitArticleFaq(source);
  const VIDEO_MARKER = "<!-- blog-video -->";
  const markerAt = body.indexOf(VIDEO_MARKER);
  const bodyBefore = markerAt >= 0 ? body.slice(0, markerAt) : body;
  const bodyAfter = markerAt >= 0 ? body.slice(markerAt + VIDEO_MARKER.length) : "";
  const htmlBefore = bodyBefore.trim() ? renderBlogHtml(bodyBefore) : "";
  const htmlAfter = bodyAfter.trim() ? renderBlogHtml(bodyAfter) : "";
  const faqId = slugifyHeading(faqHeading ?? "Frequently Asked Questions");
  const publishedLabel = new Date(`${post.publishedAt}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleArticleClick = (e: MouseEvent<HTMLElement>) => {
    if (e.defaultPrevented || isModifiedClick(e)) return;
    const target = e.target as HTMLElement | null;
    const anchor = target?.closest?.("a");
    if (!anchor || !rootRef.current?.contains(anchor)) return;
    if (anchor.target && anchor.target !== "_self") return;

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }
    if (/^https?:\/\//i.test(href) || href.startsWith("//")) return;

    e.preventDefault();
    navigate(href);
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm text-muted">
        <Link
          to="/blog"
          className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Blog
        </Link>
        <span aria-hidden="true"> · </span>
        <time dateTime={post.publishedAt}>{publishedLabel}</time>
      </p>

      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">{post.title}</h1>
      <p className="mt-4 text-lg text-muted">{post.metaDescription}</p>

      <figure className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <img
          src={post.imagePath}
          alt={post.imageAlt}
          width={post.imageWidth}
          height={post.imageHeight}
          className="h-auto w-full object-cover"
          decoding="async"
        />
      </figure>

      <section
        ref={rootRef}
        className="article-prose mt-10"
        aria-label="Article"
        onClick={handleArticleClick}
      >
        {htmlBefore ? <div dangerouslySetInnerHTML={{ __html: htmlBefore }} /> : null}
        {markerAt >= 0 ? (
          <div className="relative my-8 aspect-video overflow-hidden rounded-2xl border border-border bg-card not-prose">
            <YouTubeEmbed videoId={post.youtubeVideoId} title={post.youtubeTitle} />
          </div>
        ) : null}
        {htmlAfter ? <div dangerouslySetInnerHTML={{ __html: htmlAfter }} /> : null}
        {faqItems.length > 0 ? (
          <section className="article-faq" aria-labelledby={faqId}>
            <h2 id={faqId} className="article-heading">
              {faqHeading ?? "Frequently Asked Questions"}
            </h2>
            <Accordion
              type="single"
              collapsible
              defaultValue="faq-0"
              className="article-faq-accordion rounded-2xl border border-border bg-card px-4 shadow-sm"
            >
              {faqItems.map((item, index) => (
                <AccordionItem key={item.question} value={`faq-${String(index)}`}>
                  <AccordionTrigger className="text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent forceMount>
                    <div
                      className="article-faq-answer"
                      dangerouslySetInnerHTML={{ __html: renderMarkdownFragment(item.answer) }}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ) : null}
      </section>
    </article>
  );
}
