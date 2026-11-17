# IGUnfollowed.com — Technical SEO & Website Quality Report

**Site:** https://igunfollowed.com/  
**Date:** 16 November 2026  
**Scope:** Complete technical SEO and website-quality pass on the existing Vite + React project.  
**Rules followed:** No rebuild, no Next.js conversion, no URL deletions, no `noindex`, no fake SEO copy, no unsupported privacy/accuracy/performance claims, no algorithm changes unless a real bug was found. Design, branding, tools, and existing pages were preserved.

This report documents what was inspected, what was changed, and what still needs Google Search Console. **Code changes do not mean Google rankings or indexing have improved.**

---

## Verification snapshot

| Check | Result |
|---|---|
| Production build | Passed (`tsc -b && vite build && node scripts/prerender-routes.mjs`) |
| Unique HTML files | 14 routes written under `dist/` |
| Vitest | 112/112 passed |
| Playwright document-meta e2e | 13/13 passed (unique title + canonical + og:url, no noindex) |
| ZIP/JSON parse unit tests | Passed (algorithms unchanged) |
| Pending-requests unit tests | Passed |
| Highlights unit tests | Passed |
| Grid Maker unit tests | Passed |

Changes are in the working tree. They were **not committed or pushed** as part of this pass.

---

## Stack (inspected, not rebuilt)

- Vite 6 + React 18 + TypeScript + Tailwind + React Router v6
- Hosted on **Cloudflare Pages** (not Next.js / Vercel)
- Client-side SPA: routes share `index.html` until JavaScript unless a static file exists
- Metadata after JS: `useDocumentMeta`
- SPA fallback: `public/_redirects` → `/* /index.html 200`
- Pages Functions only for `/api/*` (`public/_routes.json`)
- ZIP/JSON parse: in-browser worker (`zip.js` / Comlink)
- Snapshots: IndexedDB (Dexie `UnfollowTrackerDB`)
- Font Generator favorites: `localStorage`
- Grid Maker: client canvas, no upload
- Highlights Viewer: `GET /api/highlights` → Apify actor `seemuapps~instagram-highlights-scraper`
- YouTube: click-to-play; thumbnails from `i.ytimg.com`
- Canonical production domain: `https://igunfollowed.com` (home canonical has no trailing slash)

---

## Issue table

| Issue | Original Problem | Fix Implemented | Files Changed | Verification |
|---|---|---|---|---|
| SPA first HTML was identical | Every URL served homepage title/description until JavaScript. `index.html` had no canonical. | Post-build prerender writes unique title, description, canonical, OG/Twitter tags, and a noscript H1+summary per public URL. Homepage JSON-LD is removed from non-home HTML. | `scripts/prerender-routes.mjs` (created), `package.json`, `index.html`, `src/App.tsx` | Build log: `wrote unique HTML for 14 paths`. `dist/analyze/index.html` title is Analyze-specific. e2e 13/13. |
| Analyze metadata too generic | Title was `Analyze — Unfollow Tracker`. | Unique title/description: ZIP/JSON upload, not-follow-back, two-export compare. | `src/App.tsx`, `e2e/meta.spec.ts`, prerender script | Playwright `/analyze` passed. |
| Duplicate homepage FAQs on Analyze | `unfollow-tracker.md` repeated homepage FAQs and was not shown on Analyze. | Rewrote the article for Analyze-only intent and mounted it on Analyze. Homepage FAQs stay on `/` only. | `src/content/articles/unfollow-tracker.md`, `src/pages/AnalyzePage.tsx`, `tests/content.test.ts` | Content tests passed. Analyze intro states one export ≠ recent unfollows. |
| Repeated page purpose | Home, Analyze, Guide, Pending overlapped. | Each page now answers its own job: home = what it is; analyze = upload/compare; guide = how to export; pending = pending requests only. | `HomePage.tsx`, `AnalyzePage.tsx`, `GuidePage.tsx`, `pending-requests.md`, `PendingRequestsPage.tsx` | Manual review of copy. Guide/pending tests passed. |
| Unsupported claims | “100% accurate”, “completely safe”, “50% growth”, “30% reach”, auto-deletion, username analysis, “signing in is optional”. | Replaced with capability-true wording. Health ranges marked as informal illustrations, not official stats. | `HomePage.tsx`, `seo.ts`, `index.html`, `tools.ts`, `README.md` | Repo grep for those phrases in public source: no matches. |
| Privacy Policy contradicted Highlights | Policy said static-only / nothing uploaded. Highlights actually calls `GET /api/highlights` → Cloudflare Function → Apify. IndexedDB/localStorage and YouTube were under-disclosed. | Privacy, About, Terms, and footer now match the code: ZIP local; snapshots on device; Highlights via API/Apify; YouTube thumbnails/iframe. | `PrivacyPage.tsx`, `AboutPage.tsx`, `TermsPage.tsx`, `SiteFooter.tsx`, highlights article | Code-checked against `functions/api/highlights.ts` and Dexie/localStorage usage. |
| robots.txt pointed at Pages.dev | Sitemap was `https://unfollow-tracker.pages.dev/sitemap.xml`. | Production sitemap only. | `public/robots.txt`, `tests/seo.test.ts` | `dist/robots.txt` contains `Sitemap: https://igunfollowed.com/sitemap.xml`. Test asserts no `pages.dev`. |
| Sitemap vs canonical | Sitemap already used `https://igunfollowed.com` URLs and included the public pages. Home loc uses a trailing slash; canonical does not. | Left sitemap URLs in place (all exist, HTTPS, no `/api`, no noindex). Did not invent `lastmod`. | `public/sitemap.xml` (unchanged) | File lists all 14 public URLs. Google treats `/` and no-slash home as equivalent. |
| Highlights “anonymous / no server” | Meta and article implied a fully local/anonymous viewer. | Meta now says lookups go through the server API. Article no longer claims Instagram cannot log the scrape. | `HighlightsViewerPage.tsx`, `instagram-highlights-viewer.md`, `tools.ts` | e2e `/instagram-highlights-viewer` passed. |
| Internal links | Home lacked visible guide/pending links. Pending lacked `/guide`. Analyze article was unused. | Natural links added; no stuffed end-sentences. | Home, Analyze, Guide, Pending article/page | Crawlable React `Link` / `<a>` in source. |
| Structured data on inner pages | Prerender copies would have carried homepage FAQ JSON-LD onto `/analyze`, `/guide`, etc. | Homepage `#home-jsonld` stripped from non-home prerendered HTML. | `scripts/prerender-routes.mjs` | `dist/analyze/index.html` has no FAQ JSON-LD. `dist/index.html` still has it. |

---

## Task 1 — JavaScript SEO and Google rendering

**What the site actually is:** client-side React SPA. Cloudflare `/* /index.html 200` still exists for unknown paths. Interactive tools (Analyze, Pending, Grid Maker, Fonts, Highlights) were **not** converted to static pages.

**What changed:** after Vite build, `scripts/prerender-routes.mjs` writes a real HTML file per public URL (`guide/index.html`, `analyze/index.html`, and so on). Cloudflare static files should beat the SPA fallback for those paths.

Each of these now has unique first HTML:

- `/`
- `/analyze`
- `/guide`
- `/pending-requests`
- `/privacy`
- `/terms`
- `/about`
- `/disclaimer`
- `/contact`
- `/blog`
- `/blog/recent-followers`
- `/instagram-font-generator`
- `/instagram-highlights-viewer`
- `/instagram-grid-maker`

React `useDocumentMeta` still updates title/canonical after JS so hydration matches the prerendered tags.

**Google Search Console still required:** URL Inspection → Live test on `/`, `/analyze`, `/guide`, `/pending-requests` after deploy, to confirm Googlebot sees the unique HTML.

---

## Task 2 — Duplicate content and FAQs

| URL | Search intent after the rewrite |
|---|---|
| `/` | What Igunfollowed is, what a non-followback means, features, how ZIP analysis works, accurate privacy summary, **general FAQs only** |
| `/analyze` | Upload ZIP/JSON, followers vs following, not-follow-backs, compare two exports, CSV, troubleshooting. **Fact stated on page:** one export does not prove recent unfollows |
| `/guide` | Accounts Center steps, JSON vs HTML, where files live, common export failures, export-only FAQs |
| `/pending-requests` | Pending outgoing requests, `pending_follow_requests` file, limitations, link to the export guide |

Homepage FAQs were rewritten so they no longer claim one ZIP “detects who unfollowed you.”

---

## Task 3 — Unsupported claims removed

Removed or rewritten:

- 100% accurate / 100% accuracy rate
- Completely safe
- 50% growth
- Up to 30% more reach
- Auto-deletion from “our system”
- Username analysis (the unfollow tool has no username lookup)
- “Signing in is optional” (there is no Instagram login)
- About: “Nothing is uploaded to any server”
- Footer: “All analysis runs locally” (false for Highlights)

Not replaced with a new guarantee. Health table kept only as **informal examples**.

---

## Task 4 — Privacy Policy vs real code

Verified in code, then written into the policy:

| Feature | Actual behavior | Policy now says |
|---|---|---|
| ZIP/JSON unfollow + pending | Browser worker (`zip.js` / Comlink). Not posted to site servers | Local processing; files not uploaded |
| Snapshots / reviewed / ignored | Dexie IndexedDB on the device | What/why/how to delete (Analyze UI or clear site data) |
| Font favorites | `localStorage` | Device-only; typed text not stored |
| Grid Maker | Canvas in the browser | Not uploaded; discarded when the tab closes |
| Highlights | Browser → `/api/highlights` → Apify actor `seemuapps~instagram-highlights-scraper` | Username sent to our API and Apify; no Instagram password; no Highlights user database |
| YouTube | Thumbnail from `i.ytimg.com`; iframe on play | Google/YouTube third-party requests |
| Analytics/ads | No first-party analytics/ad scripts found | Stated; third parties may set cookies if YouTube/Apify are used |
| Hosting | Cloudflare Pages + Pages Functions for `/api/*` | Not “static files only” |

ZIP auto-delete on a server is **not** claimed, because ZIPs never upload.

---

## Task 5 — robots.txt and sitemap

`robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://igunfollowed.com/sitemap.xml
```

Sitemap includes the 14 public canonical URLs on `https://igunfollowed.com`. Excluded: `/api/*`, 404, hashes, `pages.dev`. No noindex added. No URLs deleted.

---

## Task 6 — Per-page technical SEO

For each important public page, after JS (and in prerendered HTML):

- Unique `<title>`
- Unique meta description
- One H1
- Canonical `https://igunfollowed.com…` (home has no trailing slash)
- No `noindex`
- OG title/description match the page title/description
- Homepage FAQ JSON-LD matches visible homepage FAQs only

Highlights Viewer was added to the meta e2e list.

---

## Task 7 — Internal linking

- Home → Analyze (Get started), Guide, Pending Requests
- Analyze → Guide (intro + article), Pending Requests (article), home via header/footer
- Guide → Analyze, Home, Pending Requests
- Pending → Guide

Anchors are descriptive (`Instagram export guide`, `pending follow requests`, `Analyze`), not exact-match stuffed.

---

## Task 8 — Functionality

**Not changed:** ZIP parse, JSON parse, not-follow-back set logic, two-export compare, CSV export, pending-request parser, Grid Maker, Font Generator, Highlights API.

**Tests that still cover the tools:** `parseZip.test.ts`, `compareTwoExports.test.ts`, `pendingRequests.test.ts`, `instagramHighlights.test.ts`, `instagramGrid.test.ts`, `fontStyles.test.ts`.

A personal Instagram ZIP was **not** uploaded in the GUI during this pass. Invalid-file and large-HTML streaming remain covered by unit tests.

---

## Files modified

- `README.md`
- `e2e/meta.spec.ts`
- `index.html`
- `package.json`
- `public/robots.txt`
- `src/App.tsx`
- `src/components/layout/SiteFooter.tsx`
- `src/content/articles/instagram-highlights-viewer.md`
- `src/content/articles/pending-requests.md`
- `src/content/articles/unfollow-tracker.md`
- `src/content/seo.ts`
- `src/content/tools.ts`
- `src/pages/AboutPage.tsx`
- `src/pages/AnalyzePage.tsx`
- `src/pages/GuidePage.tsx`
- `src/pages/HighlightsViewerPage.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/PendingRequestsPage.tsx`
- `src/pages/PrivacyPage.tsx`
- `src/pages/TermsPage.tsx`
- `tests/content.test.ts`
- `tests/seo.test.ts`

## Files created

- `scripts/prerender-routes.mjs`
- `docs/technical-seo-quality-report.md` (this file)

`public/sitemap.xml` was already correct for the production domain and was not edited.

---

## Issues successfully fixed

1. Production robots.txt no longer points at `pages.dev`.
2. Unique prerendered HTML titles/descriptions/canonicals for 14 public URLs.
3. Analyze title/description is distinct from the homepage.
4. Homepage FAQs are no longer cloned onto Analyze.
5. One-export vs two-export meaning is stated clearly.
6. Unsupported accuracy/growth/safety/auto-delete claims removed from UI, FAQs, JSON-LD, and tool blurbs.
7. Privacy/About/Terms/footer match ZIP-local vs Highlights-server vs IndexedDB vs YouTube.
8. Highlights no longer claims a fully local/anonymous scrape.
9. Natural internal links among Home, Analyze, Guide, Pending.
10. Tests and production build updated and passing.

## Issues that could not be verified here

- Googlebot rendering of the live Cloudflare deployment (this machine is not Search Console).
- Live ZIP upload of a real Instagram export in the browser.
- Whether Cloudflare Pages is already serving the new `dist/` (changes are local until deploy).
- Whether Google currently has duplicate-title issues in the index (needs GSC).
- Apify retention on Apify’s side (we do not control that vendor’s logs).
- Mobile layout click-through of every tool after copy changes (layout/CSS were not redesigned).

## Remaining risks

1. **Until you deploy**, production `igunfollowed.com` still has the old robots.txt, claims, and single homepage HTML.
2. **SPA fallback remains** for unknown paths; that is correct, but any URL not in the prerender list still gets homepage first HTML.
3. **OG image** on legal/guide/analyze prerendered HTML still uses the homepage featured image until JS; pages that set their own image (Highlights, Grid Maker, Fonts, blog post) replace it after hydration.
4. **Home sitemap loc** is `https://igunfollowed.com/` while canonical is `https://igunfollowed.com` (no slash). Usually equivalent; GSC may still show both.
5. **Highlights** still sends the typed username to Apify. Privacy now discloses it; some users may still assume “everything is local.”
6. **Click-to-play YouTube** still hits `i.ytimg.com` for the thumbnail.

---

## Manual Google Search Console tasks

After deploy:

1. Confirm `https://igunfollowed.com/robots.txt` shows the igunfollowed.com sitemap.
2. Submit `https://igunfollowed.com/sitemap.xml`.
3. URL Inspection → Live test: `/`, `/analyze`, `/guide`, `/pending-requests`, `/privacy`, `/instagram-highlights-viewer`.
4. Check **Page indexing** for duplicate title/description clusters.
5. Request indexing only for URLs that already return 200 with the new unique HTML.
6. Do not expect ranking movement from these code changes alone.

---

## Confirmation: existing tools still work

| Tool | What was tested | Result |
|---|---|---|
| Analyze ZIP/JSON parse + compare | Unit tests; no algorithm edits | Pass |
| Pending requests parser | Unit tests; no algorithm edits | Pass |
| Highlights API mapping | Unit tests; meta/copy only | Pass |
| Grid Maker | Unit tests; no canvas logic edits | Pass |
| Font generator | Unit tests; copy only | Pass |
| Unique page metadata | Playwright 13 routes | Pass |
| Production compile | `npm run build` | Pass |

A personal Instagram ZIP was not uploaded in the GUI during this pass.
