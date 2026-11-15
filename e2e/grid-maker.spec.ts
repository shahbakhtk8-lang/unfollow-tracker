import path from "node:path";
import { mkdirSync } from "node:fs";
import { expect, shotDir, test } from "./support";

test.describe("Instagram Grid Maker", () => {
  test("loads, splits a photo locally, and offers a ZIP download", async ({ page }) => {
    mkdirSync(shotDir, { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/instagram-grid-maker");
    await expect(
      page.getByRole("heading", { level: 1, name: "Instagram Grid Maker" }),
    ).toBeVisible();
    await expect(page.getByText(/Never uploaded to our servers/i)).toBeVisible();
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://igunfollowed.com/images/instagram-grid-maker-featured.jpg",
    );
    await expect(page.getByRole("button", { name: "Is Instagram grid maker free?" })).toBeVisible();
    await expect(page.getByText(/Yes, fully free/i)).toBeVisible();

    await page.getByRole("button", { name: "Try sample" }).click();
    await expect(page.getByTestId("grid-crop-canvas")).toBeVisible();
    await expect(page.getByText("Posting order", { exact: true })).toBeVisible();
    await expect(page.getByText(/tile_01/i).first()).toBeVisible();

    await page.getByRole("tab", { name: "Carousel" }).click({ force: true });
    await expect(page.getByText("Carousel order", { exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "Profile grid" }).click({ force: true });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Create My Tiles" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("instagram-grid-3x3.zip");

    await page.screenshot({
      path: path.join(shotDir, "grid-maker-mobile-390x844.png"),
      fullPage: true,
    });
  });
});
