import {
  orderComparison,
  type ComparisonDecision,
  type OlderChoice,
} from "./diff";
import type { ExportDateSource } from "./exportDate";

/** One parsed export in a two-ZIP compare. Maps to orderComparison's snapshot/current sides. */
export interface TwoZipExport {
  fileName: string;
  followerUsernames: string[];
  followerTimestamps?: Record<string, number>;
  exportDate: number | null;
  exportDateSource: ExportDateSource | null;
}

/**
 * Compare two parsed ZIPs in the order they were dropped.
 * The first file is the "snapshot" side and the second is the "current" side
 * of orderComparison — dates still decide which list is older.
 */
export function compareTwoExports(
  first: TwoZipExport,
  second: TwoZipExport,
  olderChoice: OlderChoice | null = null,
): ComparisonDecision {
  return orderComparison({
    snapshotDate: first.exportDate,
    currentDate: second.exportDate,
    snapshotSource: first.exportDateSource,
    currentSource: second.exportDateSource,
    snapshotFollowers: first.followerUsernames,
    currentFollowers: second.followerUsernames,
    snapshotTimestamps: first.followerTimestamps,
    currentTimestamps: second.followerTimestamps,
    olderChoice,
  });
}
