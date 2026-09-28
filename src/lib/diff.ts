import { toSet, setDifference } from "./sets";

export interface SnapshotDiff {
  unfollowed: string[];
  newFollowers: string[];
}

export function diffSnapshots(oldFollowers: string[], newFollowers: string[]): SnapshotDiff {
  const oldSet = toSet(oldFollowers);
  const newSet = toSet(newFollowers);
  return {
    unfollowed: setDifference(oldSet, newSet),
    newFollowers: setDifference(newSet, oldSet),
  };
}
