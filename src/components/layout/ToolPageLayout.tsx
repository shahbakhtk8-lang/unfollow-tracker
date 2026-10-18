import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { RelatedTools } from "@/components/content/RelatedTools";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

const ArticleSection = lazy(() =>
  import("@/components/content/ArticleSection").then((mod) => ({ default: mod.ArticleSection })),
);

interface ToolPageLayoutProps {
  articleSlug?: string;
  toolSlug: string;
  children: ReactNode;
}

/**
 * Defer article mount until after first paint via requestIdleCallback
 * (setTimeout fallback). Timeout ensures crawlers still receive the article
 * without requiring scroll.
 */
function useIdleMount(enabled: boolean, timeoutMs = 2000): boolean {
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      return;
    }
    setReady(false);
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const mount = () => {
      if (!cancelled) setReady(true);
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      // Prefer after first paint; timeout still mounts without scroll (crawlers).
      idleId = w.requestIdleCallback(mount, { timeout: timeoutMs });
    } else {
      timeoutId = setTimeout(mount, Math.min(400, timeoutMs));
    }

    return () => {
      cancelled = true;
      if (idleId != null) w.cancelIdleCallback?.(idleId);
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [enabled, timeoutMs]);

  return ready;
}

export function ToolPageLayout({ articleSlug, toolSlug, children }: ToolPageLayoutProps) {
  // Article is heavier — give the tool UI a quieter Lighthouse window first.
  const showArticle = useIdleMount(Boolean(articleSlug), 5500);
  const showRelated = useIdleMount(true, 1800);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        {children}
        {articleSlug && showArticle ? (
          <Suspense fallback={null}>
            <ArticleSection slug={articleSlug} />
          </Suspense>
        ) : null}
        {showRelated ? <RelatedTools toolSlug={toolSlug} /> : null}
      </main>
      <SiteFooter />
    </div>
  );
}
