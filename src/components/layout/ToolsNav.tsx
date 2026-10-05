import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { isToolActive, tools, type ToolEntry } from "@/content/tools";

function ToolRow({
  tool,
  pathname,
  onNavigate,
  role,
}: {
  tool: ToolEntry;
  pathname: string;
  onNavigate?: () => void;
  role?: "menuitem";
}) {
  const current = isToolActive(tool, pathname);
  const comingSoon = tool.status === "coming-soon";

  const inner = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="font-display font-bold text-foreground">{tool.name}</span>
        {comingSoon ? (
          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Coming soon
          </span>
        ) : current ? (
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Current
          </span>
        ) : null}
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-muted">{tool.shortDescription}</span>
    </>
  );

  if (comingSoon) {
    return (
      <div
        className="cursor-not-allowed rounded-xl px-3 py-2.5 opacity-60"
        aria-disabled="true"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      role={role}
      to={tool.href}
      aria-current={current ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "block rounded-xl px-3 py-2.5 transition-colors hover:bg-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        current && "bg-border/40",
      )}
    >
      {inner}
    </Link>
  );
}

export function ToolsNavItems({
  onNavigate,
  role,
}: {
  onNavigate?: () => void;
  role?: "menuitem";
}) {
  const { pathname } = useLocation();

  return (
    <ul className="flex list-none flex-col gap-1 p-0">
      {tools.map((tool) => (
        <li key={tool.slug}>
          <ToolRow tool={tool} pathname={pathname} onNavigate={onNavigate} role={role} />
        </li>
      ))}
    </ul>
  );
}

export function ToolsDropdown() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }

      const items = wrapRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
      if (!items || items.length === 0) return;
      const list = Array.from(items);
      const index = list.indexOf(document.activeElement as HTMLElement);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = index < 0 ? 0 : (index + 1) % list.length;
        list[next]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const next = index < 0 ? list.length - 1 : (index - 1 + list.length) % list.length;
        list[next]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        list[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        list[list.length - 1]?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          open && "bg-border/40 text-foreground",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown") return;
          event.preventDefault();
          setOpen(true);
          requestAnimationFrame(() => {
            wrapRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
          });
        }}
      >
        Tools
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <div
          id={panelId}
          role="menu"
          aria-label="Tools"
          className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-border bg-card p-2 shadow-lg"
        >
          <ToolsNavItems role="menuitem" onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}

export function ToolsMobileSection({ onNavigate }: { onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        Tools
        <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <div id={panelId} className="mt-1 border-l border-border pl-2">
          <ToolsNavItems onNavigate={onNavigate} />
        </div>
      ) : null}
    </div>
  );
}

