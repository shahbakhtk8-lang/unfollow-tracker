export type ExportDateSource = "follow-activity" | "zip-modified";

export interface ExportDateEstimate {
  exportDate: number | null;
  source: ExportDateSource | null;
}

export function toEpochMillis(value: number): number {
  return value < 1e12 ? value * 1000 : value;
}

export function getExportDate(parsed: {
  followerTimestamps?: Record<string, number>;
  followingTimestamps?: Record<string, number>;
  zipModifiedDates?: Array<Date | number | null | undefined>;
}): ExportDateEstimate {
  let newestFollow: number | null = null;
  for (const map of [parsed.followerTimestamps, parsed.followingTimestamps]) {
    if (!map) continue;
    for (const raw of Object.values(map)) {
      if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) continue;
      const ms = toEpochMillis(raw);
      if (newestFollow == null || ms > newestFollow) newestFollow = ms;
    }
  }
  if (newestFollow != null) {
    return { exportDate: newestFollow, source: "follow-activity" };
  }

  let newestZip: number | null = null;
  for (const raw of parsed.zipModifiedDates ?? []) {
    const ms =
      raw instanceof Date
        ? raw.getTime()
        : typeof raw === "number" && Number.isFinite(raw) && raw > 0
          ? toEpochMillis(raw)
          : Number.NaN;
    if (!Number.isFinite(ms) || ms <= 0) continue;
    if (newestZip == null || ms > newestZip) newestZip = ms;
  }
  if (newestZip != null) {
    return { exportDate: newestZip, source: "zip-modified" };
  }

  return { exportDate: null, source: null };
}

export function snapshotExportDate(snapshot: { exportDate?: number | null }): number | null {
  return typeof snapshot.exportDate === "number" && Number.isFinite(snapshot.exportDate)
    ? snapshot.exportDate
    : null;
}

export function describeExportDate(source: ExportDateSource | null): string {
  if (source === "follow-activity") return "estimated from latest follow activity";
  if (source === "zip-modified") return "estimated from the ZIP file date";
  return "date unknown";
}
