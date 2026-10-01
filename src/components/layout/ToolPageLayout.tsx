import type { ReactNode } from "react";
import { ArticleSection } from "@/components/content/ArticleSection";
import { RelatedTools } from "@/components/content/RelatedTools";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

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
        {articleSlug ? <ArticleSection slug={articleSlug} /> : null}
        <RelatedTools toolSlug={toolSlug} />
      </main>
      <SiteFooter />
    </div>
  );
}
