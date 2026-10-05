import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold">About Unfollow Tracker</h1>
      <p className="text-muted">
        Unfollow Tracker is a small, independent tool built to answer one simple question: who
        doesn&apos;t follow you back on Instagram — without ever asking for your password or
        uploading your data anywhere.
      </p>

      <section>
        <h2 className="font-display text-xl font-bold">Why we built this</h2>
        <p className="mt-2 text-muted">
          Instagram doesn&apos;t tell you when someone unfollows you, and third-party apps that
          promise to show you usually ask for your login credentials, which puts your account at
          risk. We wanted a tool that uses only the official data export Instagram already gives
          you, and does all the analysis on your own device.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">How it works</h2>
        <p className="mt-2 text-muted">
          You request your official data export from Instagram, upload the ZIP file here, and
          everything — reading the file, comparing your followers and following lists, and showing
          results — happens entirely in your browser. Nothing is uploaded to any server.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Who&apos;s behind it</h2>
        <p className="mt-2 text-muted">
          Unfollow Tracker is built and maintained independently. It isn&apos;t affiliated with,
          endorsed by, or sponsored by Instagram or Meta.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Questions or feedback?</h2>
        <p className="mt-2 text-muted">
          Reach out any time — see our{" "}
          <Link
            to="/contact"
            className="font-semibold text-primary underline underline-offset-2 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Contact page
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
