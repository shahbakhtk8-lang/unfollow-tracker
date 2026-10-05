import { lazy, Suspense, type ReactNode } from "react";
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

export function ToolPageLayout({ articleSlug, toolSlug, children }: ToolPageLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        {children}
        {articleSlug ? (
          <Suspense fallback={null}>
            <ArticleSection slug={articleSlug} />
          </Suspense>
        ) : null}
        <RelatedTools toolSlug={toolSlug} />
      </main>
      <SiteFooter />
    </div>
  );
}
