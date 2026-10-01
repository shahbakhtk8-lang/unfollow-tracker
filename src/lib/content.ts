import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
});

const articleModules = import.meta.glob("../content/articles/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function articlePath(slug: string): string | undefined {
  const suffix = `/articles/${slug}.md`;
  return Object.keys(articleModules).find((key) => key.replaceAll("\\", "/").endsWith(suffix));
}

export function loadArticle(slug: string): string | null {
  const key = articlePath(slug);
  if (!key) return null;
  const source = articleModules[key];
  return typeof source === "string" && source.trim().length > 0 ? source : null;
}

/** Shift article headings down one level so the tool page can keep a single h1. */
export function demoteArticleHeadings(html: string): string {
  return html
    .replaceAll("<h5", "<h6")
    .replaceAll("</h5>", "</h6>")
    .replaceAll("<h4", "<h5")
    .replaceAll("</h4>", "</h5>")
    .replaceAll("<h3", "<h4")
    .replaceAll("</h3>", "</h4>")
    .replaceAll("<h2", "<h3")
    .replaceAll("</h2>", "</h3>")
    .replaceAll("<h1", "<h2")
    .replaceAll("</h1>", "</h2>");
}

export function renderArticleHtml(source: string): string {
  return demoteArticleHeadings(markdown.render(source));
}
