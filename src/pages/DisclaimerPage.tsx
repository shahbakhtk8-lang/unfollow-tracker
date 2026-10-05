export default function DisclaimerPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold">Disclaimer</h1>

      <section>
        <h2 className="font-display text-xl font-bold">Not affiliated with Instagram or Meta</h2>
        <p className="mt-2 text-muted">
          Unfollow Tracker is an independent, third-party tool. It is not affiliated with, endorsed
          by, sponsored by, or in any way officially connected to Instagram, Meta Platforms, Inc.,
          or any of their subsidiaries or affiliates. &quot;Instagram&quot; and related trademarks
          are the property of Meta Platforms, Inc.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Accuracy of results</h2>
        <p className="mt-2 text-muted">
          Unfollow Tracker reads and compares the data inside the official export file Instagram
          provides to you. The accuracy and completeness of your results depend entirely on the
          export Instagram generates — we have no way to verify or correct Instagram&apos;s own
          data. Results may not reflect real-time changes to your account.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">No guarantee</h2>
        <p className="mt-2 text-muted">
          This tool is provided &quot;as is,&quot; free of charge, with no warranty of any kind. We
          do not guarantee uninterrupted availability, error-free operation, or that results will
          be complete or current.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Your responsibility</h2>
        <p className="mt-2 text-muted">
          Any decisions you make based on results shown here — including unfollowing, following, or
          otherwise managing your Instagram account — are entirely your own responsibility.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Changes</h2>
        <p className="mt-2 text-muted">
          This disclaimer may be updated from time to time. Continued use of the tool after changes
          means you accept the updated terms.
        </p>
      </section>
    </article>
  );
}
