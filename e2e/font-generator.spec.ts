import path from "node:path";
import { mkdirSync } from "node:fs";
import { convert } from "../src/lib/fontStyles";
import { expect, shotDir, test } from "./support";

const SAMPLE = "Hi @friend https://example.com #tag";

test.describe("Instagram Font Generator", () => {
  test("type → cards, copy, preserve links, favorites, network, keyboard, motion", async ({
    page,
    context,
  }) => {
    mkdirSync(shotDir, { recursive: true });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/instagram-font-generator");
    await expect(
      page.getByRole("heading", { level: 1, name: "Instagram Font Generator" }),
    ).toBeVisible();

    const input = page.locator("#fontgen-input");
    await input.fill(SAMPLE);
    await expect(page.locator("[data-style-card]").first()).toBeVisible();

    const boldCard = page.locator('[data-style-id="math-bold"]');
    await expect(boldCard).toBeVisible();
    await boldCard.getByRole("button", { name: /Copy Bold/i }).click();
    await expect(page.getByRole("status")).toContainText(/Copied Bold/i);

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toBe(convert(SAMPLE, "math-bold").text);
    expect(clip).toContain("@friend");
    expect(clip).toContain("https://example.com");
    expect(clip).toContain("#tag");

    await boldCard.getByRole("button", { name: /Favorite Bold/i }).click();
    await page.getByRole("tab", { name: /Favorites/ }).click();
    await expect(page.locator('[data-style-id="math-bold"]')).toBeVisible();

    await page.reload();
    await page.getByRole("tab", { name: /Favorites/ }).click();
    await expect(page.locator('[data-style-id="math-bold"]')).toBeVisible();

    await page.screenshot({
      path: path.join(shotDir, "fontgen-mobile-390x844.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/instagram-font-generator");
    await expect(
      page.getByRole("heading", { level: 1, name: "Instagram Font Generator" }),
    ).toBeVisible();
    await page.screenshot({
      path: path.join(shotDir, "fontgen-desktop-1440x900.png"),
      fullPage: true,
    });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "Instagram Font Generator" }),
    ).toBeVisible();
    const animating = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll(".fontgen-page *"));
      return nodes.some((el) => {
        const styles = getComputedStyle(el);
        const name = styles.animationName;
        if (!name || name === "none") return false;
        const dur = parseFloat(styles.animationDuration || "0");
        return dur > 0.05;
      });
    });
    expect(animating).toBe(false);

    await page.evaluate(() => {
      (document.activeElement as HTMLElement | null)?.blur?.();
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "/", bubbles: true, cancelable: true }),
      );
    });
    await expect(page.locator("#fontgen-input")).toBeFocused({ timeout: 5000 });

    await page.locator("#fontgen-input").fill("Keyboard copy");
    const plain = page.locator('[data-style-id="plain"]');
    await expect(plain).toContainText("Keyboard copy");
    await plain.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toContainText(/Copied Plain/i);
    const clip2 = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip2).toBe(convert("Keyboard copy", "plain").text);

    // robots noindex
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toBe("noindex");
  });
});
