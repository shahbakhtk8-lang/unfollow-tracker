import { loadArticle, renderArticleHtml } from "@/lib/content";

export function ArticleSection({ slug }: { slug: string }) {
  const source = loadArticle(slug);
  if (!source) return null;
  const html = renderArticleHtml(source);

  return (
    <section className="border-t border-border bg-background px-4 py-16 sm:px-6" aria-label="Article">
      <article
        className="article-prose mx-auto max-w-3xl"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
