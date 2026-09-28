export interface UserEntry {
  username: string;
  href?: string;
  timestamp?: number;
}

export function normalizeUsername(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed === "instagram user") return null;
  return trimmed;
}

export function dedupeUsers(entries: UserEntry[]): UserEntry[] {
  const seen = new Set<string>();
  const out: UserEntry[] = [];
  for (const e of entries) {
    const u = normalizeUsername(e.username);
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push({ ...e, username: u });
  }
  return out;
}

export function usernamesFromEntries(entries: UserEntry[]): string[] {
  return dedupeUsers(entries).map((e) => e.username);
}

export function timestampMapFromEntries(entries: UserEntry[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const entry of dedupeUsers(entries)) {
    if (typeof entry.timestamp === "number") {
      map[entry.username] = entry.timestamp;
    }
  }
  return map;
}
