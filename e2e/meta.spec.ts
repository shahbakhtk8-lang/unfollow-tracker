import { expect, test } from "@playwright/test";

const ROUTES: Array<{ path: string; title: string; canonical: string }> = [
  {
    path: "/",
    title: "Instagram Unfollow Tracker Free online - Without Login 2026",
    canonical: "https://igunfollowed.com",
  },
  {
    path: "/analyze",
    title: "Analyze — Unfollow Tracker",
    canonical: "https://igunfollowed.com/analyze",
  },
  {
    path: "/guide",
    title: "How to download your Instagram export — Unfollow Tracker",
    canonical: "https://igunfollowed.com/guide",
  },
  {
    path: "/privacy",
    title: "Privacy Policy — Unfollow Tracker",
    canonical: "https://igunfollowed.com/privacy",
  },
  {
    path: "/terms",
    title: "Terms of Use — Unfollow Tracker",
    canonical: "https://igunfollowed.com/terms",
  },
  {
    path: "/about",
    title: "About — Unfollow Tracker",
    canonical: "https://igunfollowed.com/about",
  },
  {
    path: "/disclaimer",
    title: "Disclaimer — Unfollow Tracker",
    canonical: "https://igunfollowed.com/disclaimer",
  },
  {
    path: "/contact",
    title: "Contact — Unfollow Tracker",
    canonical: "https://igunfollowed.com/contact",
  },
  {
    path: "/blog",
    title: "Blog — Unfollow Tracker",
    canonical: "https://igunfollowed.com/blog",
  },
  {
    path: "/instagram-font-generator",
    title: "Instagram Font Generator: 60+ Styles to Copy & Paste",
    canonical: "https://igunfollowed.com/instagram-font-generator",
  },
  {
    path: "/pending-requests",
    title: "Instagram Pending Follow Requests Checker",
    canonical: "https://igunfollowed.com/pending-requests",
  },
];

for (const route of ROUTES) {
  test(`document meta for ${route.path}`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page).toHaveTitle(route.title);

    const canonicals = page.locator('link[rel="canonical"]');
    await expect(canonicals).toHaveCount(1);
    await expect(canonicals).toHaveAttribute("href", route.canonical);

    const ogUrl = page.locator('meta[property="og:url"]');
    await expect(ogUrl).toHaveCount(1);
    await expect(ogUrl).toHaveAttribute("content", route.canonical);

    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
  });
}
