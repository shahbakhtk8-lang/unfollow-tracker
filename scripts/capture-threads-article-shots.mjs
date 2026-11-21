import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "images", "articles", "threads-unfollow-tracker");
const BASE = process.env.THREADS_SHOT_BASE ?? "http://127.0.0.1:5173";

async function captureWebp(page, path, clip) {
  const client = await page.context().newCDPSession(page);
  const params = {
    format: "webp",
    quality: 90,
    fromSurface: true,
  };
  if (clip) {
    params.clip = { x: clip.x, y: clip.y, width: clip.width, height: clip.height, scale: 1 };
  }
  const { data } = await client.send("Page.captureScreenshot", params);
  const buf = Buffer.from(data, "base64");
  writeFileSync(path, buf);
  const size = statSync(path).size;
  if (size < 1000) throw new Error(`Screenshot too small: ${path} (${size}B)`);
  console.log(`Wrote ${path} (${size} bytes)`);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await page.goto(`${BASE}/threads-unfollow-tracker`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.getByRole("heading", { level: 1, name: /Threads Unfollow Tracker/i }).waitFor({
      timeout: 30_000,
    });
    await page.getByText("Drop Threads export .zip").waitFor();

    // Step 5: empty state with dropzone — crop to hero + dropzone area
    const hero = page.locator("main .mesh-bg > section").first();
    await hero.scrollIntoViewIfNeeded();
    const box = await hero.boundingBox();
    if (!box) throw new Error("Hero section not found");
    await captureWebp(page, join(outDir, "threads-step5-upload-real.webp"), {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y),
      width: Math.min(box.width, 1280),
      height: Math.min(box.height, 900),
    });

    // Run demo (hero button, not the empty-state copy mention)
    await page.getByRole("button", { name: /^Try demo$/i }).first().click();
    await page.getByText(/Analyzed:/i).waitFor({ timeout: 60_000 });
    await page.getByText("Not following back").first().waitFor();
    await page.getByRole("tab", { name: /Not back/i }).waitFor();

    // Step 6: results — stats + tabs + list (exclude sticky header)
    const analyzed = page.getByText(/Analyzed:/i).first();
    await analyzed.scrollIntoViewIfNeeded();
    const statsLabel = page.getByText("Not following back").first();
    const tablist = page.getByRole("tablist").first();
    const list = page.locator("[data-testid=virtual-user-list], .overflow-auto").first();
    const statsBox = await statsLabel.boundingBox();
    const tabBox = await tablist.boundingBox();
    const listBox = await list.boundingBox().catch(() => null);
    if (!statsBox || !tabBox) throw new Error("Results UI not found");
    const top = Math.max(0, statsBox.y - 56);
    const bottom = listBox
      ? Math.min(listBox.y + Math.min(listBox.height, 360), top + 900)
      : Math.min(tabBox.y + 480, top + 900);
    await captureWebp(page, join(outDir, "threads-step6-results-real.webp"), {
      x: 0,
      y: top,
      width: 1280,
      height: Math.max(400, bottom - top),
    });
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
