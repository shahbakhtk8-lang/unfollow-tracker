import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  loadArticle,
  renderArticleHtml,
  renderMarkdownFragment,
  slugifyHeading,
  splitArticleFaq,
} from "@/lib/content";

export function ArticleSection({ slug }: { slug: string }) {
  const source = loadArticle(slug);
  if (!source) return null;

  const { body, faqHeading, faqItems } = splitArticleFaq(source);
  const html = body.trim() ? renderArticleHtml(body) : "";
  if (!html && faqItems.length === 0) return null;

  const faqId = slugifyHeading(faqHeading ?? "Frequently Asked Questions");

  return (
    <section className="border-t border-border bg-background px-4 py-16 sm:px-6" aria-label="Article">
      <article className="article-prose mx-auto">
        {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : null}
        {faqItems.length > 0 ? (
          <section className="article-faq" aria-labelledby={faqId}>
            <h3 id={faqId}>{faqHeading ?? "Frequently Asked Questions"}</h3>
            <Accordion type="single" collapsible className="rounded-lg border border-border bg-card px-4">
              {faqItems.map((item, index) => (
                <AccordionItem key={item.question} value={`faq-${String(index)}`}>
                  <AccordionTrigger className="text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>
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
