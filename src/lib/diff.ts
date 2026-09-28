import { toSet, setDifference } from "./sets";

export interface SnapshotDiff {
  unfollowed: string[];
  newFollowers: string[];
}

export interface OrderedComparison {
  oldFollowers: string[];
  newFollowers: string[];
  oldTimestamps: Record<string, number>;
  newTimestamps: Record<string, number>;
  oldAt: number;
  newAt: number;
  swapped: boolean;
}

export function diffSnapshots(oldFollowers: string[], newFollowers: string[]): SnapshotDiff {
  const oldSet = toSet(oldFollowers);
  const newSet = toSet(newFollowers);
  return {
    unfollowed: setDifference(oldSet, newSet),
    newFollowers: setDifference(newSet, oldSet),
  };
}

/** The current upload is dated "now". A newer saved snapshot becomes the new list. */
export function orderComparison(input: {
  snapshotAt: number;
  currentAt: number;
  snapshotFollowers: string[];
  currentFollowers: string[];
  snapshotTimestamps?: Record<string, number>;
  currentTimestamps?: Record<string, number>;
}): OrderedComparison {
  const snapshotIsNewer = input.snapshotAt > input.currentAt;
  const snapshotTimestamps = input.snapshotTimestamps ?? {};
  const currentTimestamps = input.currentTimestamps ?? {};
  if (snapshotIsNewer) {
    return {
      swapped: true,
      oldAt: input.currentAt,
      newAt: input.snapshotAt,
      oldFollowers: input.currentFollowers,
      newFollowers: input.snapshotFollowers,
      oldTimestamps: currentTimestamps,
      newTimestamps: snapshotTimestamps,
    };
  }
  return {
    swapped: false,
    oldAt: input.snapshotAt,
    newAt: input.currentAt,
    oldFollowers: input.snapshotFollowers,
    newFollowers: input.currentFollowers,
    oldTimestamps: snapshotTimestamps,
    newTimestamps: currentTimestamps,
  };
}
