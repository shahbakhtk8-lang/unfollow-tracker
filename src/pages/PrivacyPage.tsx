import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
      <p className="text-muted">Last updated: {new Date().toLocaleDateString("en-US")}</p>

      <section>
        <h2 className="font-display text-xl font-bold">Local-first analysis</h2>
        <p className="mt-2 text-muted">
          Unfollow Tracker processes your Instagram data export entirely in your web browser. When
          you select a ZIP file, it is read from your device and parsed in a background worker. We
          do not upload your archive to our servers.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">What we do not collect from your export</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>Your ZIP file contents</li>
          <li>Your Instagram password or login</li>
          <li>Private messages, photos, or other export categories</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Local storage on your device</h2>
        <p className="mt-2 text-muted">
          If you choose to save a snapshot, username lists and counts are stored in IndexedDB on
          your browser only. Reviewed marks and the ignore list are stored the same way — only on
          this device, never on our servers. You can delete snapshots anytime from the Analyze page.
          Clearing site data removes this information.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Cookies</h2>
        <p className="mt-2 text-muted">
          Unfollow Tracker does not use cookies, and we do not run any analytics or tracking
          scripts of any kind — not even privacy-friendly ones. Optional snapshots, reviewed marks,
          and the ignore list are not cookies: they live in IndexedDB on this device only (see Local
          storage on your device above), are never sent anywhere, and you can clear them any time
          by using delete inside the app or clearing your browser&apos;s site data.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Hosting</h2>
        <p className="mt-2 text-muted">
          This site is static files served over HTTPS. We do not run account systems or backend
          databases for your Instagram data.
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
