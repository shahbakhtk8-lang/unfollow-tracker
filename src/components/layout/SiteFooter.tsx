import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-sm font-bold">Unfollow Tracker</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Your Instagram export never leaves this browser. No password. No upload to our servers.
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm font-medium text-muted">
          <Link
            to="/about"
            className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            About
          </Link>
          <Link
            to="/guide"
            className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Export guide
          </Link>
          <Link
            to="/privacy"
            className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Privacy
          </Link>
          <Link
            to="/disclaimer"
            className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Disclaimer
          </Link>
          <Link
            to="/terms"
            className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Terms
          </Link>
          <Link
            to="/contact"
            className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Contact
          </Link>
          <Link
            to="/analyze"
            className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Analyze
          </Link>
        </nav>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Unfollow Tracker · All analysis runs locally on your device
      </div>
    </footer>
  );
}
