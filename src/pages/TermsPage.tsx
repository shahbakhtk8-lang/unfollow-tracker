import { Link } from "react-router-dom";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { SITE_URL } from "@/content/seo";

const linkClass =
  "font-semibold text-primary underline underline-offset-2 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export default function TermsPage() {
  useDocumentMeta({
    title: "Terms of Use — Unfollow Tracker",
    description:
      "Terms for using Unfollow Tracker’s browser-based Instagram export analysis tools.",
    canonical: `${SITE_URL}/terms`,
  });

  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold">Terms of Use</h1>
      <p className="text-muted">Last updated: {new Date().toLocaleDateString("en-US")}</p>

      <section>
      <h2 className="font-display text-xl font-bold">Service description</h2>
      <p className="mt-2 text-muted">
        Unfollow Tracker is a browser-based tool that helps you analyze follower and following lists
        from your official Meta (Instagram) data export. The tool displays information for your
        review; any follow or unfollow actions must be performed by you in the official Instagram
        app. Details on how we handle your file are in our{" "}
        <Link to="/privacy" className={linkClass}>
          Privacy Policy
        </Link>
        .
      </p>

      <h2 className="font-display mt-6 text-xl font-bold">No affiliation</h2>
      <p className="mt-2 text-muted">
        Unfollow Tracker is not affiliated with, endorsed by, or sponsored by Meta Platforms, Inc.
        or Instagram. The same point is stated in our{" "}
        <Link to="/disclaimer" className={linkClass}>
          Disclaimer
        </Link>
        .
      </p>

      <h2 className="font-display mt-6 text-xl font-bold">Accuracy</h2>
      <p className="mt-2 text-muted">
        Results depend on the completeness and date of your export. Comparing two exports shows
        differences between snapshots — not proof of intentional unfollows. Username changes,
        deactivated accounts, and export errors may affect lists.
      </p>

      <h2 className="font-display mt-6 text-xl font-bold">Acceptable use</h2>
      <p className="mt-2 text-muted">
        You may only analyze data exports from accounts you own or are authorized to access. Do not
        use this tool to harass others or violate Instagram&apos;s Terms of Use.
      </p>

      <h2 className="font-display mt-6 text-xl font-bold">Disclaimer</h2>
      <p className="mt-2 text-muted">
        The service is provided &quot;as is&quot; without warranties. We are not liable for decisions
        you make based on displayed lists or for any account actions taken on Instagram. See our
        full{" "}
        <Link to="/disclaimer" className={linkClass}>
          Disclaimer
        </Link>{" "}
        for more on independence and accuracy limits.
      </p>
      </section>
    </article>
  );
}
