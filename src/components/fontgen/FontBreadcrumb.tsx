import { Link } from "react-router-dom";

export function FontBreadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li>
          <Link
            to="/"
            className="rounded font-medium text-foreground/80 underline-offset-2 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Unfollow Tracker
          </Link>
        </li>
        <li aria-hidden="true" className="text-muted/70">
          /
        </li>
        <li>
          <span aria-current="page" className="font-medium text-foreground">
            Instagram Font Generator
          </span>
        </li>
      </ol>
    </nav>
  );
}
