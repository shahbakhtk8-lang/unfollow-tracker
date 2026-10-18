import { useEffect, useRef, type MouseEvent, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  isDraftArticle,
  loadArticle,
  renderArticleHtml,
  renderMarkdownFragment,
  slugifyHeading,
  splitArticleFaq,
} from "@/lib/content";

/** Progressive scroll-reveal: content stays visible without JS. */
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

export function ArticleSection({ slug }: { slug: string }) {
  const source = loadArticle(slug);
  const rootRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  useArticleReveal(rootRef);

  if (!source || isDraftArticle(source)) return null;

  const { body, faqHeading, faqItems } = splitArticleFaq(source);
  const html = body.trim() ? renderArticleHtml(body) : "";
  if (!html && faqItems.length === 0) return null;

  const faqId = slugifyHeading(faqHeading ?? "Frequently Asked Questions");

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
    // Relative / same-origin app paths only — external links keep native navigation.
    if (/^https?:\/\//i.test(href) || href.startsWith("//")) return;

    e.preventDefault();
    navigate(href);
  };

  return (
    <section
      ref={rootRef}
      className="border-t border-border bg-background px-4 py-16 sm:px-6"
      aria-label="Article"
      onClick={handleArticleClick}
    >
      <article className="article-prose mx-auto">
        {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : null}
        {faqItems.length > 0 ? (
          <section className="article-faq" aria-labelledby={faqId}>
            <h3 id={faqId} className="article-heading">
              {faqHeading ?? "Frequently Asked Questions"}
            </h3>
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
      </article>
    </section>
  );
}
