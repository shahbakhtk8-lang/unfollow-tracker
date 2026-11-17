import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { SITE_URL } from "@/content/seo";

const steps = [
  "Open Meta Accounts Center (Instagram app → Settings → Accounts Center, or accounts.center.meta.com).",
  'Go to "Your information and permissions" → "Export your information".',
  'Choose "Export to device" and select your Instagram profile.',
  'Under customize information: clear all, then check ONLY "Followers and following" under Connections.',
  'Set date range to "All time".',
  'Choose format JSON (recommended) or HTML — both work with Unfollow Tracker.',
  'Tap "Start export" and wait for the email (usually 5–30 minutes).',
  "Download the ZIP from Accounts Center when ready — do not rename or unzip.",
  "Upload the .zip file on Unfollow Tracker Analyze page.",
];

export default function GuidePage() {
  useDocumentMeta({
    title: "How to download your Instagram export — Unfollow Tracker",
    description:
      "Step-by-step: request Instagram information, choose Followers and following, pick JSON, download the ZIP, and upload it to Analyze.",
    canonical: `${SITE_URL}/guide`,
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight">
        How to download your Instagram export
      </h1>
      <p className="mt-4 text-lg text-muted">
        This page is only about requesting your official Instagram information. After you have the
        ZIP, upload it on{" "}
        <Link
          to="/analyze"
          className="font-semibold text-primary underline underline-offset-2 hover:text-accent"
        >
          Analyze
        </Link>
        . The{" "}
        <Link to="/" className="font-semibold text-primary underline underline-offset-2 hover:text-accent">
          homepage
        </Link>{" "}
        explains what a non-followback is.
      </p>

      <ol className="mt-10 space-y-6">
        {steps.map((text, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 font-display font-bold text-primary">
              {i + 1}
            </span>
            <p className="pt-2 text-foreground">{text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-12 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold">What&apos;s inside the ZIP?</h2>
        <p className="mt-2 text-sm text-muted">
          Look for{" "}
          <code className="rounded bg-border/50 px-1.5 py-0.5 text-xs">
            connections/followers_and_following/following.json
          </code>{" "}
          and{" "}
          <code className="rounded bg-border/50 px-1.5 py-0.5 text-xs">
            followers_1.json
          </code>{" "}
          (plus followers_2.json if you have many followers). If those files are missing, re-export
          with Followers and following selected.
        </p>
      </div>

      <section className="mt-12 space-y-4">
        <h2 className="font-display text-2xl font-bold">How to select JSON and locate the files</h2>
        <p className="text-muted">
          Choose JSON unless you already have an HTML export. JSON is easier for Analyze to read.
          Keep the download as a ZIP; do not rename folders inside it. After download, you do not
          need to unzip it for Analyze. If you do unzip, the files live under{" "}
          <code className="rounded bg-border/50 px-1.5 py-0.5 text-xs">
            connections/followers_and_following/
          </code>
          .
        </p>
        <p className="text-muted">
          The Pending Requests Checker reads{" "}
          <code className="rounded bg-border/50 px-1.5 py-0.5 text-xs">pending_follow_requests</code>{" "}
          from the same Connections export. Request that category once, then use{" "}
          <Link
            to="/analyze"
            className="font-semibold text-primary underline underline-offset-2 hover:text-accent"
          >
            Analyze
          </Link>{" "}
          or{" "}
          <Link
            to="/pending-requests"
            className="font-semibold text-primary underline underline-offset-2 hover:text-accent"
          >
            pending requests
          </Link>{" "}
          depending on what you want to see.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Common export problems</h2>
        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="font-semibold">The ZIP uploads but lists are empty</dt>
            <dd className="mt-1 text-muted">
              The export often omitted Followers and following. Request a new download with that
              Connections category selected and date range All time.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Instagram emailed HTML instead of JSON</dt>
            <dd className="mt-1 text-muted">
              HTML from the same category still works. JSON is recommended because it is simpler to
              parse. You can request another export and pick JSON.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">The file is huge or the browser stalls</dt>
            <dd className="mt-1 text-muted">
              Keep the archive zipped. Do not add extra folders. If the ZIP is unrelated media, it
              will fail on Analyze with an error instead of a fake result.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Frequently Asked Questions</h2>
        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="font-semibold">Which Instagram format should I choose?</dt>
            <dd className="mt-1 text-muted">
              JSON. HTML also works if that is what you already downloaded.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Do I need messages, photos, or the full account dump?</dt>
            <dd className="mt-1 text-muted">
              No. Select Followers and following under Connections. Extra categories make a larger
              ZIP and are not used for unfollow checks.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Where do I upload the ZIP after it downloads?</dt>
            <dd className="mt-1 text-muted">
              Use Analyze for not-follow-back lists and two-export comparison. Use Pending Requests
              if you only want outgoing requests that were never accepted.
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/analyze">Upload my ZIP</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <a
            href="https://accountscenter.meta.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Accounts Center
          </a>
        </Button>
      </div>
    </article>
  );
}
