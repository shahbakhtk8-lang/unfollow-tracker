export default function ContactPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-bold">Contact Us</h1>
      <p className="text-muted">
        Have a question, found a bug, or have feedback? We&apos;d like to hear from you.
      </p>

      <section>
        <h2 className="font-display text-xl font-bold">Email</h2>
        <p className="mt-2 text-muted">
          <a
            href="mailto:postmaster@igunfollowed.com"
            className="font-semibold text-primary underline underline-offset-2 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            postmaster@igunfollowed.com
          </a>
        </p>
        <p className="mt-2 text-muted">
          We read every message, though response times may vary since this is an independently run
          tool.
        </p>
        <p className="mt-2 text-muted">
          If you&apos;re reporting a bug, it helps to include what browser you&apos;re using and
          what happened — screenshots are welcome.
        </p>
      </section>
    </article>
  );
}
