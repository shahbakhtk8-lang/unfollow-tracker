import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
});

export function slugifyHeading(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

markdown.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const state = (env ?? {}) as { headingIds?: Set<string> };
  const ids = state.headingIds ?? new Set<string>();
  state.headingIds = ids;
  const inline = tokens[idx + 1];
  const text =
    inline?.children
      ?.filter((child) => child.type === "text" || child.type === "code_inline")
      .map((child) => child.content)
      .join("") ??
    inline?.content ??
    "";
  const base = slugifyHeading(text);
  let id = base;
  let n = 2;
  while (ids.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  ids.add(id);
  tokens[idx].attrSet("id", id);
  return self.renderToken(tokens, idx, options);
};

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

export interface ArticleFaqItem {
  question: string;
  answer: string;
}

/**
 * FAQ convention in article markdown:
 * a heading matching "Frequently Asked Questions", then pairs of
 * a line that is only **Question?** followed by one or more answer lines
 * until the next question, a new heading, or end of file.
 * Parsing the source (not HTML) keeps Q/A pairs stable even when markdown-it
 * joins a bold line and the next paragraph into one <p>.
 */
export function splitArticleFaq(source: string): {
  body: string;
  faqHeading: string | null;
  faqItems: ArticleFaqItem[];
} {
  const lines = source.split(/\r?\n/);
  const faqAt = lines.findIndex((line) =>
    /^#{1,3}\s+frequently asked questions\s*$/i.test(line.trim()),
  );
  if (faqAt === -1) {
    return { body: source, faqHeading: null, faqItems: [] };
  }

  const headingMatch = lines[faqAt]?.trim().match(/^#{1,3}\s+(.+?)\s*$/);
  const faqHeading = headingMatch?.[1] ?? "Frequently Asked Questions";
  const body = lines.slice(0, faqAt).join("\n").trimEnd();
  const rest = lines.slice(faqAt + 1);
  const questionRe = /^\*\*(.+?)\*\*\s*$/;
  const faqItems: ArticleFaqItem[] = [];

  let i = 0;
  while (i < rest.length) {
    const line = rest[i] ?? "";
    if (/^#{1,3}\s+/.test(line.trim())) break;
    const question = line.match(questionRe);
    if (!question) {
      i += 1;
      continue;
    }
    i += 1;
    const answerLines: string[] = [];
    while (i < rest.length) {
      const next = rest[i] ?? "";
      if (questionRe.test(next) || /^#{1,3}\s+/.test(next.trim())) break;
      answerLines.push(next);
      i += 1;
    }
    const answer = answerLines.join("\n").trim();
    const q = question[1]?.trim() ?? "";
    if (q && answer) faqItems.push({ question: q, answer });
  }

  return { body, faqHeading, faqItems };
}

export function renderMarkdownFragment(source: string): string {
  return markdown.render(source);
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

const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_SEP_CELL = /^:?-+:?$/;

function splitTableCells(line: string): string[] {
  let inner = line.trim();
  if (inner.startsWith("|")) inner = inner.slice(1);
  if (inner.endsWith("|")) inner = inner.slice(0, -1);
  return inner.split("|").map((cell) => cell.trim());
}

function isSeparatorLine(line: string): boolean {
  const cells = splitTableCells(line);
  return cells.length > 0 && cells.every((cell) => TABLE_SEP_CELL.test(cell.replaceAll(" ", "")));
}

function isTableBlockStart(lines: string[], index: number): boolean {
  const header = lines[index];
  const separator = lines[index + 1];
  return Boolean(header && separator && TABLE_ROW.test(header) && isSeparatorLine(separator));
}

function renderTableHtml(block: string[]): string {
  const [headerLine, , ...bodyLines] = block;
  const headers = splitTableCells(headerLine);
  const rows = bodyLines.filter((line) => TABLE_ROW.test(line)).map(splitTableCells);
  const head = headers
    .map((cell) => `<th scope="col">${markdown.renderInline(cell)}</th>`)
    .join("");
  const body = rows
    .map((cells) => {
      const tds = headers
        .map((_, i) => `<td>${markdown.renderInline(cells[i] ?? "")}</td>`)
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");
  return `<div class="article-table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>\n`;
}

/** Render markdown, turning GFM tables into HTML without enabling raw HTML. */
function renderMarkdownWithTables(source: string): string {
  const lines = source.split(/\r?\n/);
  const htmlParts: string[] = [];
  const env = { headingIds: new Set<string>() };
  let markdownBuffer: string[] = [];
  let i = 0;

  const flushMarkdown = () => {
    if (markdownBuffer.length === 0) return;
    htmlParts.push(markdown.render(markdownBuffer.join("\n"), env as Record<string, unknown>));
    markdownBuffer = [];
  };

  while (i < lines.length) {
    if (isTableBlockStart(lines, i)) {
      flushMarkdown();
      const block = [lines[i], lines[i + 1]];
      i += 2;
      while (i < lines.length && TABLE_ROW.test(lines[i] ?? "")) {
        block.push(lines[i] ?? "");
        i += 1;
      }
      htmlParts.push(renderTableHtml(block));
      continue;
    }
    markdownBuffer.push(lines[i] ?? "");
    i += 1;
  }
  flushMarkdown();
  return htmlParts.join("");
}

export function wrapArticleTables(html: string): string {
  return html.replace(/<table[\s\S]*?<\/table>/gi, (table, offset: number) => {
    const start = Math.max(0, offset - '<div class="article-table-wrap">'.length);
    const before = html.slice(start, offset);
    if (before.endsWith('<div class="article-table-wrap">')) return table;
    return `<div class="article-table-wrap">${table}</div>`;
  });
}

export function renderArticleHtml(source: string): string {
  return wrapArticleTables(demoteArticleHeadings(renderMarkdownWithTables(source)));
}
