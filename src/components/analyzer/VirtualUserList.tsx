import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn, formatFollowDate } from "@/lib/utils";
import type { ListedUser } from "@/store/analyzerStore";

interface VirtualUserListProps {
  users: ListedUser[];
  emptyMessage?: string;
}

function UserRow({ user, index }: { user: ListedUser; index: number }) {
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const followed = formatFollowDate(user.timestamp);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(user.username);
      setCopyState("ok");
    } catch {
      setCopyState("fail");
    }
    setTimeout(() => setCopyState("idle"), 1500);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5 text-sm",
        index % 2 === 0 && "bg-border/10",
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-medium">@{user.username}</p>
        {copyState === "fail" ? (
          <p className="text-xs text-danger">Couldn’t copy</p>
        ) : followed ? (
          <p className="text-xs text-muted">Followed {followed}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => void copy()} aria-label={`Copy ${user.username}`}>
          {copyState === "ok" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" asChild>
          <a
            href={`https://www.instagram.com/${user.username}/`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${user.username} on Instagram`}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export function VirtualUserList({ users, emptyMessage = "No accounts in this list." }: VirtualUserListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 12,
  });

  const items = virtualizer.getVirtualItems();

  if (users.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-[min(420px,50vh)] overflow-auto rounded-xl border border-border bg-card">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {items.map((virtualRow) => {
          const user = users[virtualRow.index];
          if (!user) return null;
          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <UserRow user={user} index={virtualRow.index} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
