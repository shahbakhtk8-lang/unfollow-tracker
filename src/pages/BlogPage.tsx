export default function BlogPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold">Blog</h1>
      <p className="text-muted">
        Guides and notes on private unfollow tracking, Instagram exports, and using this tool
        without handing over your password.
      </p>

      <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <h2 className="font-display text-xl font-bold">Blog coming soon</h2>
        <p className="mt-2 max-w-md text-sm text-muted">
          Posts are on the way. Nothing to read here yet — check back when we publish the first
          article.
        </p>
      </div>
    </article>
  );
}
