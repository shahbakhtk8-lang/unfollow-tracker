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
  const head = headers.map((cell) => `<th>${markdown.renderInline(cell)}</th>`).join("");
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
  let markdownBuffer: string[] = [];
  let i = 0;

  const flushMarkdown = () => {
    if (markdownBuffer.length === 0) return;
    htmlParts.push(markdown.render(markdownBuffer.join("\n")));
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

export function renderArticleHtml(source: string): string {
  return demoteArticleHeadings(renderMarkdownWithTables(source));
}
