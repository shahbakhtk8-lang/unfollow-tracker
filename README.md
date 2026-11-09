# Unfollow Tracker

Privacy-first Instagram unfollow checker. Upload your official Meta data export (ZIP) — analysis runs **100% in your browser**. No Instagram password. No server upload.

**Live demo:** [https://unfollow-tracker.pages.dev/](https://unfollow-tracker.pages.dev/)

## Features

- Not following back, mutuals, fans, full follower/following lists
- Compare two export ZIPs directly, or compare a new export against a **saved snapshot** (IndexedDB on your device) to see unfollows and new followers
- Ignore list and reviewed marks stored only on this device
- Web Worker parsing, virtualized lists for large accounts
- Free CSV export
- Demo ZIP included

## Quick start

Requires [Node.js](https://nodejs.org/) 20+.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

```bash
npm run build   # production build → dist/
npm run preview
npm test        # parser & insights unit tests
```

## Demo ZIP

`public/demo/instagram-demo.zip` contains sample `connections/followers_and_following/` JSON files. Regenerate after editing fixtures:

```bash
node scripts/build-demo-zip.mjs
```

## Architecture

- **ZIP:** [@zip.js/zip.js](https://gildas-lormeau.github.io/zip.js/) in a dedicated worker ([`src/worker/parseZip.worker.ts`](src/worker/parseZip.worker.ts))
- **Insights:** [`src/lib/sets.ts`](src/lib/sets.ts), diff in [`src/lib/diff.ts`](src/lib/diff.ts)
- **Snapshots:** Dexie / IndexedDB ([`src/db/snapshots.ts`](src/db/snapshots.ts)), max 10 entries

## Deploy

- **Cloudflare Pages (primary):** build `npm run build`, output `dist`.  
  Highlights API lives in `functions/api/highlights.ts`.  
  Set secret **`APIFY_TOKEN`** in Pages → Settings → Environment variables (Production + Preview), then redeploy.
- **Vercel:** `api/highlights.ts` + `vercel.json` SPA rewrite; set `APIFY_TOKEN` the same way.
- **Netlify:** `public/_redirects` for SPA (Highlights API needs a Netlify Function if you host there).

## Privacy

See the in-app Privacy page. Your ZIP never leaves the browser; snapshots store username lists locally only.

## License

MIT
