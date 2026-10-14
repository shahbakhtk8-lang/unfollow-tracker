import type { UserEntry } from "./normalize";
import { downloadTextFile } from "./utils";

export type PendingSortMode = "oldest" | "newest" | "username";

/** Instagram export timestamps are usually Unix seconds; accept ms too. */
export function timestampToMs(timestamp: number): number {
  return timestamp < 1e12 ? timestamp * 1000 : timestamp;
}

/** Whole days between the sent timestamp and `now` (defaults to today). */
export function daysPending(timestamp: number, now: number = Date.now()): number {
  const sent = timestampToMs(timestamp);
  const diff = Math.max(0, now - sent);
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

export function formatDaysPending(days: number): string {
  const formatted = new Intl.NumberFormat("en-US").format(days);
  return days === 1 ? `Pending for ${formatted} day` : `Pending for ${formatted} days`;
}

export interface PendingRow extends UserEntry {
  daysPending: number | null;
}

export function toPendingRows(entries: UserEntry[], now: number = Date.now()): PendingRow[] {
  return entries.map((entry) => ({
    ...entry,
    daysPending:
      typeof entry.timestamp === "number" ? daysPending(entry.timestamp, now) : null,
  }));
}

export function sortPendingRows(rows: PendingRow[], mode: PendingSortMode): PendingRow[] {
  const copy = [...rows];
  if (mode === "username") {
    copy.sort((a, b) => a.username.localeCompare(b.username));
    return copy;
  }
  copy.sort((a, b) => {
    const aTs = typeof a.timestamp === "number" ? timestampToMs(a.timestamp) : null;
    const bTs = typeof b.timestamp === "number" ? timestampToMs(b.timestamp) : null;
    if (aTs == null && bTs == null) return a.username.localeCompare(b.username);
    if (aTs == null) return 1;
    if (bTs == null) return -1;
    return mode === "oldest" ? aTs - bTs : bTs - aTs;
  });
  return copy;
}

export function filterPendingRows(rows: PendingRow[], query: string): PendingRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => row.username.includes(q));
}

export function buildPendingRequestsCsv(rows: PendingRow[]): string {
  const header = "username,sent_at,days_pending,profile_url\n";
  const body = rows
    .map((row) => {
      const iso =
        row.timestamp == null
          ? ""
          : new Date(timestampToMs(row.timestamp)).toISOString();
      const days = row.daysPending == null ? "" : String(row.daysPending);
      const url = `https://www.instagram.com/${row.username}/`;
      return `${row.username},${iso},${days},${url}`;
    })
    .join("\n");
  return header + body;
}

export function exportPendingRequestsCsv(
  rows: PendingRow[],
  filename = "pending-follow-requests.csv",
) {
  downloadTextFile(filename, buildPendingRequestsCsv(rows));
}
