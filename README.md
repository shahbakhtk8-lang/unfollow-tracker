# Unfollow Tracker

Privacy-first Instagram unfollow checker. Upload your official Meta data export (ZIP) — analysis runs **100% in your browser**. No Instagram password. No server upload.

## Features

- Not following back, mutuals, fans, full follower/following lists
- Compare a new export against a **saved snapshot** (IndexedDB on your device) to see unfollows and new followers
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

Static hosting only (no backend):

- **Vercel:** connect repo; `vercel.json` SPA rewrite included
- **Cloudflare Pages:** build command `npm run build`, output `dist`
- **Netlify:** `public/_redirects` for SPA

## Privacy

See the in-app Privacy page. Your ZIP never leaves the browser; snapshots store username lists locally only.

## License

MIT
