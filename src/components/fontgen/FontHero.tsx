const CHIPS = ["Free", "No signup", "Text never leaves your browser"] as const;

export function FontHero() {
  return (
    <header className="fontgen-hero relative">
      <div aria-hidden className="fontgen-hero-drift pointer-events-none absolute inset-0 -z-10" />
      <h1 className="fontgen-hero-title font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
        Instagram Font Generator
      </h1>
      <p className="fontgen-hero-sub mt-3 max-w-xl text-base text-muted sm:text-lg">
        Style bio, display name, or caption text with Unicode lettering — copy and paste into Instagram.
      </p>
      <ul className="mt-5 flex list-none flex-wrap gap-2 p-0">
        {CHIPS.map((label) => (
          <li
            key={label}
            className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
          >
            {label}
          </li>
        ))}
      </ul>
    </header>
  );
}
