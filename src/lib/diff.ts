import type { ExportDateSource } from "./exportDate";
import { toSet, setDifference } from "./sets";

export interface SnapshotDiff {
  unfollowed: string[];
  newFollowers: string[];
}

export type OlderChoice = "snapshot" | "current";

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface OrderedComparison {
  oldFollowers: string[];
  newFollowers: string[];
  oldTimestamps: Record<string, number>;
  newTimestamps: Record<string, number>;
  oldAt: number | null;
  newAt: number | null;
  oldSource: ExportDateSource | null;
  newSource: ExportDateSource | null;
  swapped: boolean;
  chosenManually: boolean;
}

export type ComparisonDecision =
  | { status: "needs-choice" }
  | { status: "ready"; ordered: OrderedComparison };

export function diffSnapshots(oldFollowers: string[], newFollowers: string[]): SnapshotDiff {
  const oldSet = toSet(oldFollowers);
  const newSet = toSet(newFollowers);
  return {
    unfollowed: setDifference(oldSet, newSet),
    newFollowers: setDifference(newSet, oldSet),
  };
}

function olderSide(
  snapshotDate: number | null,
  currentDate: number | null,
  choice: OlderChoice | null,
): OlderChoice | "needs-choice" {
  const datesMissing = snapshotDate == null || currentDate == null;
  const tooClose =
    snapshotDate != null &&
    currentDate != null &&
    Math.abs(snapshotDate - currentDate) < ONE_DAY_MS;
  if (datesMissing || tooClose) {
    return choice ?? "needs-choice";
  }
  return snapshotDate < currentDate ? "snapshot" : "current";
}

export function orderComparison(input: {
  snapshotDate: number | null;
  currentDate: number | null;
  snapshotSource?: ExportDateSource | null;
  currentSource?: ExportDateSource | null;
  snapshotFollowers: string[];
  currentFollowers: string[];
  snapshotTimestamps?: Record<string, number>;
  currentTimestamps?: Record<string, number>;
  olderChoice?: OlderChoice | null;
}): ComparisonDecision {
  const side = olderSide(input.snapshotDate, input.currentDate, input.olderChoice ?? null);
  if (side === "needs-choice") return { status: "needs-choice" };

  const chosenManually =
    input.snapshotDate == null ||
    input.currentDate == null ||
    Math.abs(input.snapshotDate - input.currentDate) < ONE_DAY_MS;
  const snapshotTimestamps = input.snapshotTimestamps ?? {};
  const currentTimestamps = input.currentTimestamps ?? {};
  const snapshotSource = input.snapshotSource ?? null;
  const currentSource = input.currentSource ?? null;
  const snapshotIsOlder = side === "snapshot";

  if (snapshotIsOlder) {
    return {
      status: "ready",
      ordered: {
        swapped: false,
        chosenManually,
        oldFollowers: input.snapshotFollowers,
        newFollowers: input.currentFollowers,
        oldTimestamps: snapshotTimestamps,
        newTimestamps: currentTimestamps,
        oldAt: input.snapshotDate,
        newAt: input.currentDate,
        oldSource: snapshotSource,
        newSource: currentSource,
      },
    };
  }

  return {
    status: "ready",
    ordered: {
      swapped: true,
      chosenManually,
      oldFollowers: input.currentFollowers,
      newFollowers: input.snapshotFollowers,
      oldTimestamps: currentTimestamps,
      newTimestamps: snapshotTimestamps,
      oldAt: input.currentDate,
      newAt: input.snapshotDate,
      oldSource: currentSource,
      newSource: snapshotSource,
    },
  };
}
