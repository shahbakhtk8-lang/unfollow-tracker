import { Link } from "react-router-dom";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { SITE_URL } from "@/content/seo";

export default function PrivacyPage() {
  useDocumentMeta({
    title: "Privacy Policy — Unfollow Tracker",
    description:
      "How IGUnfollowed handles data: local ZIP analysis, optional IndexedDB snapshots, Highlights API lookups, and YouTube embeds.",
    canonical: `${SITE_URL}/privacy`,
  });

  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
      <p className="text-muted">Last updated: November 16, 2026</p>

      <section>
        <h2 className="font-display text-xl font-bold">Instagram ZIP and JSON analysis</h2>
        <p className="mt-2 text-muted">
          Unfollow Tracker, Analyze, and the Pending Requests Checker process your official
          Instagram data export in your web browser. When you select a ZIP or JSON file, it is read
          from your device and parsed in a background worker. We do not upload that archive to our
          servers, and we do not ask for your Instagram password.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">What we do not collect from your export</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>Your ZIP or JSON file contents</li>
          <li>Your Instagram password or login</li>
          <li>Private messages, photos, or other export categories the tools do not read</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Local storage on your device</h2>
        <p className="mt-2 text-muted">
          If you choose to save a snapshot on Analyze, username lists and counts are stored in
          IndexedDB on this browser so you can compare a later export. Reviewed marks and the ignore
          list are stored the same way. These records stay on this device until you delete snapshots
          from the Analyze page or clear this site&apos;s data in your browser. We do not copy them
          to a server.
        </p>
        <p className="mt-2 text-muted">
          On the Instagram Font Generator, favorite style ids are saved in localStorage on this
          device only. The text you type is not stored or sent; it stays in memory for the session.
          On the Instagram Grid Maker, the photo you choose is decoded and split with canvas in this
          browser. It is not uploaded, and closing the tab discards it.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Highlights Viewer</h2>
        <p className="mt-2 text-muted">
          The Highlights Viewer does not use your Instagram export. When you look up a public
          username, your browser requests <code>/api/highlights</code> on this site. That Cloudflare
          Pages Function uses a third-party scraping service (Apify) to fetch publicly visible
          Highlight metadata and media URLs. The username you typed is sent so the public profile
          can be loaded. We do not ask for your Instagram password. We do not operate an application
          user database of Highlights results. Media you download is saved to your device.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">YouTube and other third parties</h2>
        <p className="mt-2 text-muted">
          The homepage and some articles can show a YouTube video. Thumbnails may be requested from
          Google&apos;s i.ytimg.com. Playing the video loads YouTube (Google) in an iframe. Those
          requests follow Google&apos;s and YouTube&apos;s own policies. Highlights lookups also
          contact Apify, as described above.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Cookies and analytics</h2>
        <p className="mt-2 text-muted">
          This site does not set first-party analytics or advertising cookies, and we do not run
          first-party analytics or ad scripts. Optional snapshots, reviewed marks, ignore lists, and
          font favorites are not cookies: they live in IndexedDB or localStorage on this device.
          YouTube or Apify may set their own cookies if you use those features. ZIP files are not
          uploaded, so there is no server-side auto-deletion of those files.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Hosting</h2>
        <p className="mt-2 text-muted">
          Public pages are static files on Cloudflare Pages over HTTPS. API routes under{" "}
          <code>/api/*</code> run as Cloudflare Pages Functions. We do not run an account system or
          a database of your Instagram export. How you may use the tools is covered in our{" "}
          <Link
            to="/terms"
            className="font-semibold text-primary underline underline-offset-2 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Terms of Use
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Contact</h2>
        <p className="mt-2 text-muted">
          Questions about privacy? See our{" "}
          <Link
            to="/contact"
            className="font-semibold text-primary underline underline-offset-2 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Contact page
          </Link>{" "}
          or email{" "}
          <a
            href="mailto:postmaster@igunfollowed.com"
            className="font-semibold text-primary underline underline-offset-2 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            postmaster@igunfollowed.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}
