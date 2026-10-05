import { expect, test } from "./support";

test("desktop Tools dropdown and Blog at 1440px", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: "Blog", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Blog coming soon" })).toBeVisible();
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("footer")).toHaveCount(1);

  const tools = page.getByRole("button", { name: "Tools" });
  await tools.click();
  const item = page.getByRole("menuitem", { name: /Unfollow Tracker/ });
  await expect(item).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(item).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(item).toHaveCount(0);

  await tools.click();
  await expect(item).toBeVisible();
  await page.mouse.click(20, 200);
  await expect(item).toHaveCount(0);

  await tools.click();
  await page.keyboard.press("ArrowDown");
  await expect(item).toBeFocused();
  await page.keyboard.press("Escape");

  await page.goto("/analyze");
  await page.getByRole("button", { name: "Tools" }).click();
  await expect(page.getByText("Current", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  const facebook = page.getByRole("link", { name: "Unfollow Tracker on Facebook" });
  const instagram = page.getByRole("link", { name: "Unfollow Tracker on Instagram" });
  await expect(facebook).toHaveAttribute("href", "https://web.facebook.com/profile.php?id=61589509679439");
  await expect(instagram).toHaveAttribute("href", "https://www.instagram.com/unfollowed2026/");
  for (const link of [facebook, instagram]) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});

test("mobile burger Tools and Blog at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/guide");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Tools" }).click();
  const mobileNav = page.locator("#mobile-nav");
  await expect(mobileNav.getByRole("link", { name: /See who/ })).toBeVisible();
  await mobileNav.getByRole("link", { name: "Blog", exact: true }).click();
  await expect(page).toHaveURL("/blog");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Blog coming soon" })).toBeVisible();

  const facebook = page.getByRole("link", { name: "Unfollow Tracker on Facebook" });
  const instagram = page.getByRole("link", { name: "Unfollow Tracker on Instagram" });
  await expect(facebook).toBeVisible();
  await expect(instagram).toBeVisible();
  await expect(facebook).toHaveAttribute("href", "https://web.facebook.com/profile.php?id=61589509679439");
  await expect(instagram).toHaveAttribute("href", "https://www.instagram.com/unfollowed2026/");
  for (const link of [facebook, instagram]) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});

test("dark mode Tools dropdown at 1440px", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/about");
  await page.getByRole("button", { name: "Tools" }).click();
  await expect(page.getByRole("menuitem", { name: /Unfollow Tracker/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menuitem", { name: /Unfollow Tracker/ })).toHaveCount(0);
});

test("dark mode mobile burger at 390px", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Tools" }).click();
  const mobileNav = page.locator("#mobile-nav");
  await expect(mobileNav.getByRole("link", { name: /See who/ })).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: "Blog", exact: true })).toBeVisible();
});
