/**
 * After vite build + meta prerender, crawl public routes with Playwright and
 * write the fully rendered DOM into each route's index.html so crawlers see
 * real headings/paragraphs/FAQ text without executing JavaScript.
 *
 * On Cloudflare Pages (and other CI), installs Chromium and launches with
 * --no-sandbox. If the browser cannot start, falls back to injecting static
 * SEO markup into #root so the deploy still ships indexable HTML.
 *
 * React still mounts with createRoot (client SPA) — interactive behavior
 * (ZIP upload, demos, etc.) is unchanged after JS loads.
 */
import { execSync } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const dist = join(process.cwd(), "dist");
const PORT = Number(process.env.PRERENDER_PORT || 4179);
const BASE = `http://127.0.0.1:${PORT}`;
const IS_CI = Boolean(process.env.CF_PAGES || process.env.CI);

/** Routes that must ship with real body text in the HTML source. */
const ROUTES = [
  {
    path: "/",
    waitFor: "Instagram Unfollow Tracker",
    h1: "Instagram Unfollow Tracker Free online - Without Login 2026",
    lead:
      "Igunfollowed is an Instagram unfollow tracker. Upload your official data export and compare followers with following on this device. A non-followback means you follow someone who is not following you in that file.",
    faqs: [
      {
        q: "How can we see who unfollowed you on instagram?",
        a: "A single Instagram export shows who does not follow you back in that file. To see who left since last time, compare an older export with a newer one on Analyze. Igunfollowed does not log into Instagram.",
      },
      {
        q: "Is igunfollowed safe to use?",
        a: "No Instagram password is required. ZIP and JSON analysis runs in your browser and is not uploaded to our servers. The Highlights Viewer is separate: it looks up a public username through our API.",
      },
      {
        q: "Can I check non followers of multiple accounts?",
        a: "Yes, by exporting multiple zip files you can analyze their data separately.",
      },
      {
        q: "Difference between unfollowers and users who don't follow you back",
        a: '"Not following back" means you follow an account that isn\'t on your followers list and may never have followed you, while an unfollower is someone who was on your older list but is missing from your newer one.',
      },
      {
        q: "Can I see who blocked me on Instagram?",
        a: "No there is not any app or software to see this, when someone blocked you on instagram, you cannot see their profile from any other sources.",
      },
    ],
  },
  {
    path: "/blog",
    waitFor: "Blog",
    h1: "Blog",
    lead: "Guides on Instagram exports, recent followers, and private unfollow checks.",
  },
  {
    path: "/pending-requests",
    waitFor: "Pending Follow Requests",
    h1: "Instagram Pending Follow Requests Checker",
    lead: "See which Instagram follow requests you sent are still waiting — even from years ago. Upload your official export ZIP. Private, in-browser analysis, no login.",
  },
  {
    path: "/analyze",
    waitFor: "Analyze",
    h1: "Analyze your export",
    lead: "Upload an Instagram ZIP or JSON export to list accounts that do not follow you back. Compare two exports to see who left. Processing stays in your browser.",
  },
  {
    path: "/instagram-grid-maker",
    waitFor: "Instagram Grid Maker",
    h1: "Instagram Grid Maker",
    lead: "Free Instagram grid maker — split one photo into a 3×3 profile grid or a swipeable carousel. Preview the real 3:4 thumbnail crop, then download tiles. No login, no upload.",
  },
  {
    path: "/threads-unfollow-tracker",
    waitFor: "Threads Unfollow Tracker",
    h1: "Threads Unfollow Tracker (2026)",
    lead: "Upload your official Threads data export. One ZIP shows who doesn't follow back; two exports show who left. Everything runs in your browser.",
  },
  {
    path: "/instagram-highlights-viewer",
    waitFor: "Instagram Highlights Viewer",
    h1: "Instagram Highlights Viewer",
    lead: "Open public Instagram Highlights by username, step through stories, and download media. No Instagram login. Lookups go through our server API.",
  },
  {
    path: "/guide",
    waitFor: "download your Instagram export",
    h1: "How to download your Instagram export",
    lead: "Request an official Meta export with Followers and following, then upload the ZIP on Analyze.",
  },
  {
    path: "/privacy",
    waitFor: "Privacy Policy",
    h1: "Privacy Policy",
    lead: "ZIP analysis stays in the browser. Highlights lookups go through our API. Optional snapshots stay on this device.",
  },
  {
    path: "/terms",
    waitFor: "Terms of Use",
    h1: "Terms of Use",
    lead: "Rules for using IGUnfollowed export tools. Results depend on your official Instagram file.",
  },
  {
    path: "/about",
    waitFor: "About",
    h1: "About Unfollow Tracker",
    lead: "Independent tools that read official Instagram exports in your browser without an Instagram password.",
  },
  {
    path: "/disclaimer",
    waitFor: "Disclaimer",
    h1: "Disclaimer",
    lead: "IGUnfollowed is not affiliated with Meta or Instagram. Results come from the file you provide.",
  },
  {
    path: "/contact",
    waitFor: "Contact",
    h1: "Contact Us",
    lead: "Email postmaster@igunfollowed.com for questions or bug reports.",
  },
  {
    path: "/blog/recent-followers",
    waitFor: "Recent Followers",
    h1: "How to See Recent Followers on Instagram",
    lead: "Check recent followers on Instagram manually or with your official export. Sort by date followed, compare Followers snapshots, and analyze your ZIP privately on igunfollowed.com — no login required.",
  },
  {
    path: "/instagram-font-generator",
    waitFor: "Instagram Font Generator",
    h1: "Instagram Font Generator",
    lead: "Free Instagram font generator with 60+ styles. Type your text, preview it for your bio, name or caption, and copy it in one tap. No signup needed.",
  },
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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

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

function staticRootHtml(route) {
  const faqs = (route.faqs || [])
    .map(
      (item) =>
        `<section><h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p></section>`,
    )
    .join("");
  const faqBlock = faqs
    ? `<section><h2>Frequently Asked Questions</h2>${faqs}</section>`
    : "";
  return `<div id="root"><main><h1>${escapeHtml(route.h1)}</h1><p>${escapeHtml(route.lead)}</p>${faqBlock}</main></div>`;
}

function injectStaticRoute(route) {
  const file = outFileFor(route.path);
  if (!existsSync(file)) {
    throw new Error(`prerender-spa: missing ${file}`);
  }
  let html = readFileSync(file, "utf8");
  html = html.replace(/<noscript><h1>[\s\S]*?<\/noscript>\s*/g, "");
  if (!html.includes('<div id="root"')) {
    throw new Error(`prerender-spa: ${route.path} has no #root`);
  }
  html = html.replace(/<div id="root"[\s\S]*?<\/div>/, staticRootHtml(route));
  // If #root was empty self-closing style already replaced; also handle empty div.
  if (html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', staticRootHtml(route));
  }
  writeFileSync(file, html);
  console.log(`prerender-spa: static ${route.path} → ${file.replace(process.cwd(), ".")}`);
}

function ensureChromium() {
  console.log("prerender-spa: ensuring Playwright Chromium is installed…");
  execSync("npx playwright install chromium", {
    stdio: "inherit",
    env: process.env,
  });
}

async function captureWithPlaywright() {
  const { chromium } = await import("playwright");
  ensureChromium();
  const server = await startServer();
  const launchArgs = IS_CI
    ? ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    : [];
  const browser = await chromium.launch({ headless: true, args: launchArgs });
  const page = await browser.newPage();
  try {
    for (const route of ROUTES) {
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
      await page.evaluate(() => {
        document.querySelectorAll("button[data-state='closed']").forEach((btn) => {
          if (btn.getAttribute("aria-controls")) btn.click();
        });
      });
      await new Promise((r) => setTimeout(r, 300));
      let html = await page.content();
      html = html.replace(/<noscript><h1>[\s\S]*?<\/noscript>\s*/g, "");
      if (!html.includes('id="root"') || !html.includes("<h1")) {
        throw new Error(`prerender-spa: ${route.path} captured HTML missing #root or h1`);
      }
      const file = outFileFor(route.path);
      writeFileSync(file, html);
      console.log(`prerender-spa: ${route.path} → ${file.replace(process.cwd(), ".")}`);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

function captureStaticFallback() {
  console.warn("prerender-spa: Playwright unavailable — writing static SEO HTML into #root");
  for (const route of ROUTES) {
    injectStaticRoute(route);
  }
}

async function main() {
  if (!existsSync(join(dist, "index.html"))) {
    throw new Error("prerender-spa: dist/index.html missing — run vite build first");
  }
  try {
    await captureWithPlaywright();
  } catch (err) {
    console.error("prerender-spa: browser capture failed:", err);
    captureStaticFallback();
  }
  console.log(`prerender-spa: wrote HTML for ${String(ROUTES.length)} routes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
