import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { expect, saveSnapshot, shotDir, test, uploadZip, writeTiming } from "./support";

async function expectTabs(
  page: Page,
  counts: {
    notBack: number;
    mutuals: number;
    fans: number;
    followers: number;
    following: number;
  },
) {
  await expect(page.getByRole("tab", { name: `Not back (${counts.notBack})` })).toBeVisible();
  await expect(page.getByRole("tab", { name: `Mutuals (${counts.mutuals})` })).toBeVisible();
  await expect(page.getByRole("tab", { name: `Fans (${counts.fans})` })).toBeVisible();
  await expect(page.getByRole("tab", { name: `Followers (${counts.followers})` })).toBeVisible();
  await expect(page.getByRole("tab", { name: `Following (${counts.following})` })).toBeVisible();
}

async function expectRate(page: Page, rate: string) {
  await expect(page.getByText(`${rate}% of people you follow`)).toBeVisible();
}

const NEW_COUNTS = { notBack: 165, mutuals: 185, fans: 105, followers: 290, following: 350 };
const OLD_COUNTS = { notBack: 150, mutuals: 200, fans: 100, followers: 300, following: 350 };

async function expectCompareResult(page: Page) {
  await expect(page.getByRole("tab", { name: "Unfollowed (30)" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "New (20)" })).toBeVisible();
  const banner = page.getByText(/Comparing/);
  await expect(banner).toBeVisible();
  const text = await banner.innerText();
  expect(text).toContain("estimated from latest follow activity");
  const aug = text.indexOf("Aug");
  const sep = text.indexOf("Sep");
  expect(aug, text).toBeGreaterThan(-1);
  expect(sep, text).toBeGreaterThan(aug);
  expect(text).not.toContain("28 Sep 2026");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/analyze");
  await expect(page.getByRole("heading", { name: "Analyze your export" })).toBeVisible();
});

test("A home loads and the demo shows results", async ({ page, consoleErrors }) => {
  consoleErrors.splice(0, consoleErrors.length);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Instagram Unfollow Tracker Free online/ })).toBeVisible();
  expect(consoleErrors).toEqual([]);
  await page.getByRole("button", { name: "Try demo (10 sec)" }).click();
  await expect(page.getByRole("heading", { name: "Analyze your export" })).toBeVisible();
  await expect(page.getByText("instagram-demo.zip")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("tab", { name: /Followers \([1-9]\d*\)/ })).toBeVisible();
});

test("B new export shows the expected counts and drops instagram", async ({ page }) => {
  await uploadZip(page, "new.zip");
  await expectTabs(page, NEW_COUNTS);
  await expectRate(page, "52.9");
  await expect(page.getByText("@instagram", { exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "Followers (290)" }).click();
  await page.getByPlaceholder(/Search username/).fill("instagram");
  await expect(page.getByText("No accounts in this list.")).toBeVisible();
  await page.getByPlaceholder(/Search username/).fill("test_user_007");
  await expect(page.getByText("@test_user_007")).toHaveCount(1);
  const visibleText = await page.locator("main").innerText();
  expect(visibleText).toContain("@test_user_007");
  expect(visibleText).not.toContain("Test_User_007");
});

test("C saved old snapshot compared with new upload", async ({ page }) => {
  await uploadZip(page, "old.zip");
  await expectTabs(page, OLD_COUNTS);
  await expectRate(page, "57.1");
  await saveSnapshot(page);
  await expect(page.getByText(/Export (9|10) Aug 2026/)).toBeVisible();
  await uploadZip(page, "new.zip");
  await expect(page.getByRole("tab", { name: "Followers (290)" })).toBeVisible();
  await page.getByRole("button", { name: "Compare" }).click();
  await expectCompareResult(page);
});

test("D saved new snapshot compared with old upload keeps the same diff", async ({ page }) => {
  await uploadZip(page, "new.zip");
  await expect(page.getByRole("tab", { name: "Followers (290)" })).toBeVisible();
  await saveSnapshot(page);
  await uploadZip(page, "old.zip");
  await expect(page.getByRole("tab", { name: "Followers (300)" })).toBeVisible();
  await page.getByRole("button", { name: "Compare" }).click();
  await expectCompareResult(page);
});

test("E same-date exports wait for an unselected older choice", async ({ page }) => {
  await uploadZip(page, "new.zip");
  await expect(page.getByRole("tab", { name: "Followers (290)" })).toBeVisible();
  await saveSnapshot(page);
  await uploadZip(page, "new-same-date.zip");
  await expect(page.getByRole("tab", { name: "Followers (290)" })).toBeVisible();
  await page.getByRole("button", { name: "Compare" }).click();

  await expect(page.getByText("Which export is older?")).toBeVisible();
  const saved = page.getByRole("button", { name: "Saved snapshot" });
  const current = page.getByRole("button", { name: "Current upload" });
  await expect(saved).toHaveAttribute("aria-pressed", "false");
  await expect(current).toHaveAttribute("aria-pressed", "false");
  const savedBg = await saved.evaluate((el) => getComputedStyle(el).backgroundColor);
  const currentBg = await current.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(savedBg).toBe(currentBg);
  expect(savedBg).toMatch(/rgba?\(0,\s*0,\s*0,\s*0\)/);
  await expect(page.getByRole("tab", { name: "Unfollowed (0)" })).toBeDisabled();
  await expect(page.getByRole("tab", { name: "New (0)" })).toBeDisabled();
  await expect(page.getByText(/^Comparing/)).toHaveCount(0);

  await saved.click();
  await expect(page.getByText(/Comparing|Order set by your choice/)).toBeVisible();
  await expect(page.getByRole("tab", { name: "Unfollowed (0)" })).toBeEnabled();
  await expect(page.getByRole("tab", { name: "New (0)" })).toBeEnabled();
  await expect(page.getByText("No accounts in this list.")).toBeVisible();
});

test("F export without timestamps does not guess follow activity", async ({ page }) => {
  await uploadZip(page, "no-timestamps.zip");
  await expectTabs(page, NEW_COUNTS);
  await saveSnapshot(page);
  const card = page.locator("li").filter({ hasText: "Export" }).first();
  const cardText = await card.innerText();
  const exported = cardText.match(/Export[^\n]*/)?.[0] ?? "";
  const saved = cardText.match(/Saved[^\n]*/)?.[0] ?? "";
  expect(exported.length).toBeGreaterThan(0);
  expect(saved.length).toBeGreaterThan(0);
  expect(exported).not.toBe(saved.replace("Saved", "Export"));
  expect(exported).not.toMatch(/Sep 2026/);
  expect(exported === "Export date unknown" || /Jun 2020/.test(exported)).toBeTruthy();

  await uploadZip(page, "no-timestamps.zip");
  await expect(page.getByRole("tab", { name: "Followers (290)" })).toBeVisible();
  await page.getByRole("button", { name: "Compare" }).click();
  const choice = page.getByRole("button", { name: "Current upload" });
  if (await choice.isVisible()) {
    await expect(page.getByRole("button", { name: "Saved snapshot" })).toHaveAttribute("aria-pressed", "false");
    await expect(choice).toHaveAttribute("aria-pressed", "false");
    await choice.click();
  }
  await expect(page.getByText("estimated from latest follow activity")).toHaveCount(0);
  await expect(
    page.getByText(/estimated from the ZIP file date|Export dates were not available/),
  ).toBeVisible();
});

test("G html export matches the old json counts", async ({ page }) => {
  await uploadZip(page, "old-html.zip");
  await expectTabs(page, OLD_COUNTS);
  await expectRate(page, "57.1");
});

test("H bad files show an in-page error and the app still works", async ({ page }) => {
  await uploadZip(page, "bad-missing.zip");
  await expect(
    page.getByText(
      "Could not find followers or following files. Export with Connections → Followers and following.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "See the export guide" })).toBeVisible();

  await uploadZip(page, "bad-not-zip.zip");
  await expect(
    page.getByText(
      "This file could not be read as an Instagram export ZIP. Choose the .zip you downloaded from Meta.",
    ),
  ).toBeVisible();

  await uploadZip(page, "empty-lists.zip");
  await expect(
    page.getByText(
      "This export has no followers or following accounts. Check that you included Followers and following in the Meta download.",
    ),
  ).toBeVisible();

  await uploadZip(page, "old.zip");
  await expectTabs(page, OLD_COUNTS);
});

test("I search, sort, copy, and csv match the open tab", async ({ page }) => {
  await uploadZip(page, "new.zip");
  await expect(page.getByRole("tab", { name: "Not back (165)" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("notfollowingback.csv");
  const filePath = await download.path();
  if (!filePath) throw new Error("CSV download has no file");
  const csv = readFileSync(filePath, "utf8");
  const lines = csv.trim().split(/\r?\n/);
  expect(lines[0]).toBe("username,followed_at");
  expect(lines.length - 1).toBe(165);

  await page.getByRole("tab", { name: "Followers (290)" }).click();
  await expect(page.locator("p.truncate").first()).toHaveText("@test_user_000");
  const oldestFollow = await page.locator("p.truncate").first().locator("xpath=..").innerText();
  await page.getByRole("button", { name: "Z–A" }).click();
  await expect(page.locator("p.truncate").first()).toHaveText("@test_user_469");
  await page.getByRole("button", { name: "Recent" }).click();
  await expect(page.locator("p.truncate").first()).toHaveText("@test_user_469");
  const newestFollow = await page.locator("p.truncate").first().locator("xpath=..").innerText();
  expect(newestFollow).toMatch(/2026/);
  expect(oldestFollow).toMatch(/2021|2022/);
  await page.getByRole("button", { name: "A–Z" }).click();
  await expect(page.locator("p.truncate").first()).toHaveText("@test_user_000");

  await page.getByPlaceholder(/Search username/).fill("test_user_007");
  await expect(page.getByText("@test_user_007")).toHaveCount(1);
  await page.getByRole("button", { name: "Copy test_user_007" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("test_user_007");
});

test("J snapshots rename, survive reload, delete, and confirm the tenth cap", async ({ page }) => {
  await uploadZip(page, "old.zip");
  await expect(page.getByRole("tab", { name: "Followers (300)" })).toBeVisible();

  for (let i = 1; i <= 10; i += 1) {
    const before = (await snapshotLabels(page)).length;
    await saveSnapshot(page);
    await expect.poll(async () => (await snapshotLabels(page)).length).toBe(before + 1);
    const name = page.getByLabel("Snapshot name").first();
    await name.fill(`snap-${i}`);
    await name.press("Tab");
    await expect.poll(async () => snapshotLabels(page)).toContain(`snap-${i}`);
  }

  await saveSnapshot(page);
  await expect(page.getByText(/Saving will remove the oldest snapshot, “snap-1”/)).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect.poll(() => snapshotLabels(page)).toContain("snap-1");
  expect(await snapshotLabels(page)).toHaveLength(10);

  await saveSnapshot(page);
  await page.getByRole("button", { name: "Replace and save" }).click();
  await expect.poll(async () => {
    const labels = await snapshotLabels(page);
    return labels.includes("snap-1");
  }).toBeFalsy();
  expect(await snapshotLabels(page)).toHaveLength(10);

  await page.reload();
  await expect(page.getByLabel("Snapshot name").first()).toBeVisible();
  const afterReload = await snapshotLabels(page);
  expect(afterReload).toHaveLength(10);
  expect(afterReload).not.toContain("snap-1");

  await page.getByRole("button", { name: "Delete snapshot" }).first().click();
  await expect.poll(() => snapshotLabels(page).then((labels) => labels.length)).toBe(9);
});

test("K a 20000-account export stays responsive", async ({ page }) => {
  test.setTimeout(180_000);
  const input = page.locator('input[type="file"]');
  const started = Date.now();
  await input.setInputFiles(path.join(process.cwd(), "e2e", ".generated", "big.zip"));
  const frames = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let count = 0;
        const start = performance.now();
        const step = () => {
          count += 1;
          if (performance.now() - start >= 600) resolve(count);
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
  );
  const clickStarted = Date.now();
  await page.locator("header").getByRole("link", { name: "Export guide" }).click();
  const clickMs = Date.now() - clickStarted;
  expect(clickMs).toBeLessThan(2000);
  await expect(page.getByRole("heading", { name: /How to download your Instagram export/ })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("tab", { name: "Followers (20000)" })).toBeVisible({ timeout: 120_000 });
  const parseMs = Date.now() - started;
  writeTiming("bigParseMs", parseMs);
  writeTiming("bigFramesIn600ms", frames);
  writeTiming("bigClickMs", clickMs);
  console.log(`BIG parse ${parseMs}ms, frames in 600ms ${frames}, guide click ${clickMs}ms`);
  expect(frames).toBeGreaterThan(8);
  expect(parseMs).toBeLessThan(60_000);

  await page.getByRole("tab", { name: "Followers (20000)" }).click();
  const scroller = page.locator("div.overflow-auto").last();
  const before = await scroller.locator("p.truncate").count();
  expect(before).toBeGreaterThan(3);
  expect(before).toBeLessThan(80);
  const scrollStarted = Date.now();
  await scroller.evaluate((el) => {
    el.scrollTop = 12000;
  });
  await expect.poll(async () => scroller.locator("p.truncate").first().innerText()).not.toBe("@test_user_00000");
  const scrollMs = Date.now() - scrollStarted;
  writeTiming("bigScrollMs", scrollMs);
  console.log(`BIG scroll ${scrollMs}ms`);
  expect(scrollMs).toBeLessThan(3000);
  const visible = await scroller.locator("p.truncate").count();
  expect(visible).toBeLessThan(80);
});

test("L uploads do not send the archive or usernames off-device", async ({ page, leaks }) => {
  await uploadZip(page, "new.zip");
  await expect(page.getByRole("tab", { name: "Followers (290)" })).toBeVisible();
  expect(leaks).toEqual([]);
});

test("M layout, dark mode, and keyboard focus", async ({ page }) => {
  mkdirSync(shotDir, { recursive: true });
  await uploadZip(page, "new.zip");
  await expect(page.getByRole("tab", { name: "Followers (290)" })).toBeVisible();
  await expect(page.getByText("290", { exact: true })).toBeVisible();
  await expect(page.getByText("52.9%", { exact: true })).toBeVisible();
  await saveSnapshot(page);

  await shoot(page, "results-1440-light.png", 1440, 900, "light");
  await assertButtonsInFrame(page, 1440);
  await assertTabsInFrame(page, 1440);
  await page.getByPlaceholder(/Search username/).scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(shotDir, "results-1440-light-list.png") });
  await shoot(page, "results-390-light.png", 390, 844, "light");
  await assertButtonsInFrame(page, 390);
  await assertTabsInFrame(page, 390);
  await page.getByPlaceholder(/Search username/).scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(shotDir, "results-390-light-list.png") });

  await page.emulateMedia({ colorScheme: "dark" });
  await shoot(page, "results-1440-dark.png", 1440, 900, "dark");
  await shoot(page, "results-390-dark.png", 390, 844, "dark");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe("rgb(11, 15, 25)");

  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator("header a").first().focus();
  const choose = await tabUntil(page, (info) => info.text.includes("Choose file"));
  expect(choose, "Tab never reached Choose file").not.toBeNull();
  expect(choose!.w).toBeGreaterThan(40);
  expect(choose!.h).toBeGreaterThan(20);
  expect(hasVisibleFocus(choose!)).toBeTruthy();

  const tabStop = await tabUntil(page, (info) => info.text.startsWith("Not back"));
  expect(tabStop, "Tab never reached result tabs").not.toBeNull();
  expect(hasVisibleFocus(tabStop!)).toBeTruthy();

  const copy = await tabUntil(page, (info) => info.label.startsWith("Copy "));
  expect(copy, "Tab never reached copy").not.toBeNull();
  expect(hasVisibleFocus(copy!)).toBeTruthy();
});

test("direct routes survive a refresh", async ({ page }) => {
  const routes: { path: string; heading: RegExp }[] = [
    { path: "/analyze", heading: /Analyze your export/ },
    { path: "/guide", heading: /How to download your Instagram export/ },
    { path: "/privacy", heading: /Privacy Policy/ },
    { path: "/terms", heading: /Terms of Use/ },
  ];
  for (const route of routes) {
    const response = await page.goto(route.path);
    expect(response?.status(), route.path).toBe(200);
    await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
    await page.reload();
    expect(page.url()).toContain(route.path);
    await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
  }
});

async function snapshotLabels(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("UnfollowTrackerDB");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    try {
      return await new Promise<string[]>((resolve, reject) => {
        const tx = db.transaction("snapshots", "readonly");
        const req = tx.objectStore("snapshots").getAll();
        req.onsuccess = () => {
          const rows = req.result as { label: string }[];
          resolve(rows.map((row) => row.label));
        };
        req.onerror = () => reject(req.error);
      });
    } finally {
      db.close();
    }
  });
}

async function shoot(page: Page, name: string, width: number, height: number, scheme: "light" | "dark") {
  await page.emulateMedia({ colorScheme: scheme });
  await page.setViewportSize({ width, height });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(shotDir, name), fullPage: false });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, name).toBeLessThanOrEqual(1);
}

async function assertTabsInFrame(page: Page, width: number) {
  const tabs = page.getByRole("tab");
  const count = await tabs.count();
  for (let i = 0; i < count; i += 1) {
    const tab = tabs.nth(i);
    await tab.scrollIntoViewIfNeeded();
    const box = await tab.boundingBox();
    const label = await tab.innerText();
    expect(box, label).not.toBeNull();
    expect(box!.x, label).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width, label).toBeLessThanOrEqual(width + 1);
  }
}

async function assertButtonsInFrame(page: Page, width: number) {
  const buttons = page.getByRole("button");
  const count = await buttons.count();
  for (let i = 0; i < count; i += 1) {
    const button = buttons.nth(i);
    if (!(await button.isVisible())) continue;
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox();
    expect(box, await button.innerText()).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
  }
}

type FocusInfo = {
  text: string;
  label: string;
  outline: string;
  shadow: string;
  w: number;
  h: number;
};

function hasVisibleFocus(info: FocusInfo): boolean {
  return (info.outline !== "none" && info.outline !== "") || (info.shadow !== "none" && info.shadow !== "");
}

async function tabUntil(page: Page, predicate: (info: FocusInfo) => boolean): Promise<FocusInfo | null> {
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        text: (el.innerText || el.textContent || "").trim().slice(0, 80),
        label: el.getAttribute("aria-label") || "",
        outline: style.outlineStyle,
        shadow: style.boxShadow,
        w: rect.width,
        h: rect.height,
      };
    });
    if (info && predicate(info)) return info;
  }
  return null;
}
