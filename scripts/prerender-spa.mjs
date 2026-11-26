/**
 * After vite build + meta prerender, crawl public routes with Playwright and
 * write the fully rendered DOM into each route's index.html so crawlers see
 * real headings/paragraphs/FAQ text without executing JavaScript.
 *
 * React still mounts with createRoot (client SPA) — interactive behavior
 * (ZIP upload, demos, etc.) is unchanged after JS loads.
 */
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { chromium } from "playwright";

const dist = join(process.cwd(), "dist");
const PORT = Number(process.env.PRERENDER_PORT || 4179);
const BASE = `http://127.0.0.1:${PORT}`;

/** Routes that must ship with real body text in the HTML source. */
const ROUTES = [
  { path: "/", waitFor: "Instagram Unfollow Tracker" },
  { path: "/blog", waitFor: "Blog" },
  { path: "/pending-requests", waitFor: "Pending Follow Requests" },
  { path: "/analyze", waitFor: "Analyze" },
  { path: "/instagram-grid-maker", waitFor: "Instagram Grid Maker" },
  { path: "/threads-unfollow-tracker", waitFor: "Threads Unfollow Tracker" },
  { path: "/instagram-highlights-viewer", waitFor: "Instagram Highlights Viewer" },
  // Keep remaining public shells filled too (meta already unique).
  { path: "/guide", waitFor: "download your Instagram export" },
  { path: "/privacy", waitFor: "Privacy Policy" },
  { path: "/terms", waitFor: "Terms of Use" },
  { path: "/about", waitFor: "About" },
  { path: "/disclaimer", waitFor: "Disclaimer" },
  { path: "/contact", waitFor: "Contact" },
  { path: "/blog/recent-followers", waitFor: "Recent Followers" },
  { path: "/instagram-font-generator", waitFor: "Instagram Font Generator" },
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0] || "/");
  const candidates = [];
  if (clean === "/") {
    candidates.push(join(dist, "index.html"));
  } else {
    const rel = clean.replace(/^\//, "").replace(/\/$/, "");
    candidates.push(join(dist, rel));
    candidates.push(join(dist, rel, "index.html"));
    candidates.push(join(dist, `${rel}.html`));
  }
  for (const file of candidates) {
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  return join(dist, "index.html");
}

function startServer() {
  const server = createServer((req, res) => {
    const urlPath = new URL(req.url || "/", BASE).pathname;
    const file = resolveFile(urlPath);
    try {
      const body = readFileSync(file);
      const type = MIME[extname(file).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

function outFileFor(routePath) {
  if (routePath === "/") return join(dist, "index.html");
  return join(dist, routePath.replace(/^\//, ""), "index.html");
}

async function captureRoute(page, route) {
  const url = route.path === "/" ? `${BASE}/` : `${BASE}${route.path}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForFunction(
    (needle) => {
      const h1 = document.querySelector("h1");
      if (!h1 || !h1.textContent) return false;
      if (!h1.textContent.includes(needle)) return false;
      const body = document.body?.innerText || "";
      return !body.includes("Loading…");
    },
    route.waitFor,
    { timeout: 45_000 },
  );
  // Expand closed FAQ triggers so answers are present even without forceMount.
  await page.evaluate(() => {
    document.querySelectorAll("button[data-state='closed']").forEach((btn) => {
      if (btn.getAttribute("aria-controls")) btn.click();
    });
  });
  await new Promise((r) => setTimeout(r, 300));
  let html = await page.content();
  // Drop the thin noscript stub — #root now has real content for no-JS crawlers.
  html = html.replace(/<noscript><h1>[\s\S]*?<\/noscript>\s*/g, "");
  if (!html.includes('id="root"') || !html.includes("<h1")) {
    throw new Error(`prerender-spa: ${route.path} captured HTML missing #root or h1`);
  }
  const file = outFileFor(route.path);
  writeFileSync(file, html);
  console.log(`prerender-spa: ${route.path} → ${file.replace(process.cwd(), ".")}`);
}

async function main() {
  if (!existsSync(join(dist, "index.html"))) {
    throw new Error("prerender-spa: dist/index.html missing — run vite build first");
  }
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    for (const route of ROUTES) {
      await captureRoute(page, route);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
  console.log(`prerender-spa: wrote rendered HTML for ${String(ROUTES.length)} routes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
