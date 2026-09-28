import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight">
        How to download your Instagram export
      </h1>
      <p className="mt-4 text-lg text-muted">
        Unfollow Tracker needs the official Meta export that includes follower and following lists.
        Follow these steps once — then reuse the same ZIP anytime.
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
