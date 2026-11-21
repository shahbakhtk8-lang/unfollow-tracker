/**
 * Generate Threads Unfollow Tracker OG / featured WebP images via Playwright.
 * Outputs:
 *   public/images/threads-unfollow-tracker-featured.webp      (1280×850)
 *   public/images/threads-unfollow-tracker-featured-800.webp  (800×531)
 *
 * Uses Chromium CDP Page.captureScreenshot (format: webp) — no sharp required.
 */
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "images");
const FULL_W = 1280;
const FULL_H = 850;
const SMALL_W = 800;
const SMALL_H = 531;

/** Lucide Shield path (matches SiteHeader brand mark). */
const SHIELD_PATH =
  "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z";

function buildHtml(width, height) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600&family=Plus+Jakarta+Sans:wght@700;800&display=swap" rel="stylesheet" />
  <style>
    :root {
      --color-background: #fafafa;
      --color-foreground: #0f172a;
      --color-muted: #64748b;
      --color-border: #e2e8f0;
      --color-card: #ffffff;
      --color-primary: #4f46e5;
      --color-primary-foreground: #ffffff;
      --color-accent: #818cf8;
      --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
      --font-display: "Plus Jakarta Sans", var(--font-sans);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      font-family: var(--font-sans);
      color: var(--color-foreground);
      -webkit-font-smoothing: antialiased;
    }
    .frame {
      width: ${width}px;
      height: ${height}px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: ${Math.round(width * 0.055)}px ${Math.round(width * 0.06)}px;
      background:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgb(99 102 241 / 0.25), transparent),
        radial-gradient(ellipse 60% 40% at 100% 0%, rgb(168 85 247 / 0.15), transparent),
        radial-gradient(ellipse 50% 30% at 0% 50%, rgb(59 130 246 / 0.12), transparent),
        var(--color-background);
    }
    .blob {
      position: absolute;
      pointer-events: none;
      border-radius: 9999px;
      filter: blur(64px);
      background: rgb(79 70 229 / 0.2);
      width: ${Math.round(width * 0.35)}px;
      height: ${Math.round(width * 0.35)}px;
      right: -${Math.round(width * 0.08)}px;
      top: ${Math.round(height * 0.08)}px;
    }
    .card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: ${Math.round(width * 0.92)}px;
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      align-items: center;
      gap: ${Math.round(width * 0.04)}px;
      background: color-mix(in srgb, var(--color-card) 92%, transparent);
      border: 1px solid var(--color-border);
      border-radius: ${Math.round(width * 0.028)}px;
      box-shadow: 0 25px 50px -12px rgb(15 23 42 / 0.12);
      padding: ${Math.round(height * 0.09)}px ${Math.round(width * 0.05)}px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: ${Math.round(width * 0.012)}px;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: ${Math.round(width * 0.022)}px;
      margin-bottom: ${Math.round(height * 0.035)}px;
      color: var(--color-foreground);
    }
    .brand-mark {
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${Math.round(width * 0.036)}px;
      height: ${Math.round(width * 0.036)}px;
      border-radius: ${Math.round(width * 0.01)}px;
      background: var(--color-primary);
      color: var(--color-primary-foreground);
    }
    .brand-mark svg {
      width: ${Math.round(width * 0.02)}px;
      height: ${Math.round(width * 0.02)}px;
    }
    h1 {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: ${Math.round(width * 0.052)}px;
      line-height: 1.12;
      letter-spacing: -0.03em;
      max-width: 14ch;
    }
    .year {
      background: linear-gradient(90deg, var(--color-primary), #a78bfa);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .tagline {
      margin-top: ${Math.round(height * 0.035)}px;
      font-size: ${Math.round(width * 0.024)}px;
      font-weight: 500;
      color: var(--color-muted);
      line-height: 1.4;
      max-width: 28ch;
    }
    .pill {
      margin-top: ${Math.round(height * 0.04)}px;
      display: inline-flex;
      align-items: center;
      border: 1px solid rgb(79 70 229 / 0.3);
      background: rgb(79 70 229 / 0.1);
      color: var(--color-primary);
      font-size: ${Math.round(width * 0.016)}px;
      font-weight: 600;
      padding: ${Math.round(height * 0.012)}px ${Math.round(width * 0.018)}px;
      border-radius: 9999px;
    }
    .motif-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .motif {
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${Math.round(width * 0.22)}px;
      height: ${Math.round(width * 0.22)}px;
      border-radius: ${Math.round(width * 0.04)}px;
      background: linear-gradient(135deg, rgb(79 70 229 / 0.18), rgb(129 140 248 / 0.28));
      color: var(--color-primary);
      box-shadow: 0 10px 30px rgb(79 70 229 / 0.15), inset 0 0 0 1px rgb(79 70 229 / 0.15);
      font-family: var(--font-display);
      font-weight: 800;
      font-size: ${Math.round(width * 0.12)}px;
      line-height: 1;
      letter-spacing: -0.04em;
    }
  </style>
</head>
<body>
  <div class="frame" id="og">
    <div class="blob" aria-hidden="true"></div>
    <div class="card">
      <div>
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
              <path d="${SHIELD_PATH}" />
            </svg>
          </span>
          Unfollow Tracker
        </div>
        <h1>Threads Unfollow Tracker <span class="year">(2026)</span></h1>
        <p class="tagline">See who unfollowed you — free, no login</p>
        <p class="pill">No password · Local analysis</p>
      </div>
      <div class="motif-wrap">
        <div class="motif" aria-hidden="true">@</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function captureWebp(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.setContent(buildHtml(width, height), { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  // Brief settle for paint after font swap
  await page.waitForTimeout(150);

  const client = await page.context().newCDPSession(page);
  const { data } = await client.send("Page.captureScreenshot", {
    format: "webp",
    quality: 90,
    fromSurface: true,
    clip: { x: 0, y: 0, width, height, scale: 1 },
  });
  return Buffer.from(data, "base64");
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const fullPath = join(outDir, "threads-unfollow-tracker-featured.webp");
    const smallPath = join(outDir, "threads-unfollow-tracker-featured-800.webp");

    const fullBuf = await captureWebp(page, FULL_W, FULL_H);
    writeFileSync(fullPath, fullBuf);

    const smallBuf = await captureWebp(page, SMALL_W, SMALL_H);
    writeFileSync(smallPath, smallBuf);

    const fullStat = statSync(fullPath);
    const smallStat = statSync(smallPath);
    if (fullStat.size < 1000 || smallStat.size < 500) {
      throw new Error(`Generated files look empty (full=${fullStat.size}B, small=${smallStat.size}B)`);
    }

    console.log(`Wrote ${fullPath} (${fullStat.size} bytes, ${FULL_W}×${FULL_H})`);
    console.log(`Wrote ${smallPath} (${smallStat.size} bytes, ${SMALL_W}×${SMALL_H})`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
