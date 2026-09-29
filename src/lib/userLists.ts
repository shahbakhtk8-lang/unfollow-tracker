export type ReviewFilter = "all" | "unreviewed" | "reviewed";

export function excludeIgnored(usernames: string[], ignored: Iterable<string>): string[] {
  const hide = new Set(ignored);
  return usernames.filter((name) => !hide.has(name));
}

export function ignoredOverlap(usernames: string[], ignored: Iterable<string>): number {
  const hide = new Set(ignored);
  let count = 0;
  for (const name of usernames) {
    if (hide.has(name)) count += 1;
  }
  return count;
}

export function applyReviewFilter<T extends { username: string }>(
  items: T[],
  reviewed: Iterable<string>,
  filter: ReviewFilter,
): T[] {
  if (filter === "all") return items;
  const marks = new Set(reviewed);
  if (filter === "reviewed") return items.filter((item) => marks.has(item.username));
  return items.filter((item) => !marks.has(item.username));
}
