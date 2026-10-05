import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Facebook, Instagram, Menu, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolsDropdown, ToolsMobileSection } from "@/components/layout/ToolsNav";
import { cn } from "@/lib/utils";

const links = [
  { to: "/#how-it-works", label: "How it works", hash: true },
  { to: "/guide", label: "Export guide" },
  { to: "/analyze", label: "Analyze" },
];

const socialLinks = [
  {
    href: "https://web.facebook.com/profile.php?id=61589509679439",
    label: "Unfollow Tracker on Facebook",
    Icon: Facebook,
    className: "bg-[#1877F2] text-white",
  },
  {
    href: "https://www.instagram.com/unfollowed2026/",
    label: "Unfollow Tracker on Instagram",
    Icon: Instagram,
    className: "text-white",
    style: {
      background:
        "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
    },
  },
] as const;

function SocialLinks() {
  return (
    <div className="flex items-center gap-1">
      {socialLinks.map((item) => {
        const Icon = item.Icon;
        return (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            style={"style" in item ? item.style : undefined}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              item.className,
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </a>
        );
      })}
    </div>
  );
}

export function SiteHeader() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" aria-label="Unfollow Tracker" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden sm:inline">Unfollow Tracker</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <ToolsDropdown />
          <Link
            to="/blog"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              location.pathname === "/blog" && "text-foreground bg-border/40",
            )}
          >
            Blog
          </Link>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                !l.hash && location.pathname === l.to && "text-foreground bg-border/40",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link to="/analyze">Upload ZIP</Link>
          </Button>
          <SocialLinks />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="md:hidden"
            aria-expanded={open}
            aria-controls={open ? "mobile-nav" : undefined}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open ? (
        <nav id="mobile-nav" className="border-t border-border px-4 py-3 md:hidden">
          <ToolsMobileSection onNavigate={() => setOpen(false)} />
          <Link
            to="/blog"
            onClick={() => setOpen(false)}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              location.pathname === "/blog" && "bg-border/40",
            )}
          >
            Blog
          </Link>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
