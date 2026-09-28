export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
      <p className="text-muted">Last updated: {new Date().toLocaleDateString("en-US")}</p>

      <section>
      <h2 className="font-display text-xl font-bold">Local-first analysis</h2>
      <p className="mt-2 text-muted">
        Unfollow Tracker processes your Instagram data export entirely in your web browser. When you
        select a ZIP file, it is read from your device and parsed in a background worker. We do
        not upload your archive to our servers.
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
        your browser only. You can delete snapshots anytime from the Analyze page. Clearing site
        data removes this information.
      </p>
      </section>

      <section>
      <h2 className="font-display text-xl font-bold">Hosting &amp; analytics</h2>
      <p className="mt-2 text-muted">
        This site is static files served over HTTPS. We do not run account systems or backend
        databases for your Instagram data. If basic anonymous analytics are enabled in the future,
        they will not include export contents and will offer an opt-out in the footer.
      </p>
      </section>

      <section>
      <h2 className="font-display text-xl font-bold">Contact</h2>
      <p className="mt-2 text-muted">
        Questions about privacy? Use the contact method listed on this site when published.
      </p>
      </section>
    </article>
  );
}
