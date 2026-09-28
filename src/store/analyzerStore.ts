import { create } from "zustand";
import type { Insights } from "@/lib/sets";
import type { SnapshotDiff } from "@/lib/diff";
import type { ParseProgress } from "@/lib/parseZip";

export interface ListedUser {
  username: string;
  timestamp?: number;
}

export type ResultTab =
  | "notFollowingBack"
  | "mutuals"
  | "fans"
  | "unfollowed"
  | "newFollowers"
  | "allFollowers"
  | "allFollowing";

interface AnalyzerState {
  isParsing: boolean;
  progress: ParseProgress | null;
  error: string | null;
  fileName: string | null;
  insights: Insights | null;
  followerUsernames: string[];
  followingUsernames: string[];
  followerTimestamps: Record<string, number>;
  followingTimestamps: Record<string, number>;
  baselineFollowerTimestamps: Record<string, number>;
  diff: SnapshotDiff | null;
  activeTab: ResultTab;
  compareSnapshotId: number | null;
  setTab: (tab: ResultTab) => void;
  setCompareSnapshotId: (id: number | null) => void;
  setParsing: (v: boolean) => void;
  setProgress: (p: ParseProgress | null) => void;
  setError: (e: string | null) => void;
  setResults: (payload: {
    fileName: string;
    insights: Insights;
    followerUsernames: string[];
    followingUsernames: string[];
    followerTimestamps?: Record<string, number>;
    followingTimestamps?: Record<string, number>;
    baselineFollowerTimestamps?: Record<string, number>;
    diff?: SnapshotDiff | null;
  }) => void;
  setDiff: (diff: SnapshotDiff | null, baselineFollowerTimestamps?: Record<string, number>) => void;
  reset: () => void;
}

const initial = {
  isParsing: false,
  progress: null as ParseProgress | null,
  error: null as string | null,
  fileName: null as string | null,
  insights: null as Insights | null,
  followerUsernames: [] as string[],
  followingUsernames: [] as string[],
  followerTimestamps: {} as Record<string, number>,
  followingTimestamps: {} as Record<string, number>,
  baselineFollowerTimestamps: {} as Record<string, number>,
  diff: null as SnapshotDiff | null,
  activeTab: "notFollowingBack" as ResultTab,
  compareSnapshotId: null as number | null,
};

export const useAnalyzerStore = create<AnalyzerState>((set) => ({
  ...initial,
  setTab: (activeTab) => set({ activeTab }),
  setCompareSnapshotId: (compareSnapshotId) => set({ compareSnapshotId }),
  setParsing: (isParsing) => set({ isParsing }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  setResults: (payload) =>
    set({
      isParsing: false,
      progress: null,
      error: null,
      fileName: payload.fileName,
      insights: payload.insights,
      followerUsernames: payload.followerUsernames,
      followingUsernames: payload.followingUsernames,
      followerTimestamps: payload.followerTimestamps ?? {},
      followingTimestamps: payload.followingTimestamps ?? {},
      baselineFollowerTimestamps: payload.baselineFollowerTimestamps ?? {},
      diff: payload.diff ?? null,
    }),
  setDiff: (diff, baselineFollowerTimestamps) =>
    set({
      diff,
      baselineFollowerTimestamps: diff ? (baselineFollowerTimestamps ?? {}) : {},
    }),
  reset: () => set({ ...initial }),
}));

function withTimestamps(usernames: string[], map: Record<string, number>): ListedUser[] {
  return usernames.map((username) => ({
    username,
    timestamp: map[username],
  }));
}

function withFallbackTimestamps(
  usernames: string[],
  primary: Record<string, number>,
  fallback: Record<string, number>,
): ListedUser[] {
  return usernames.map((username) => ({
    username,
    timestamp: primary[username] ?? fallback[username],
  }));
}

export function getActiveList(state: AnalyzerState): ListedUser[] {
  const {
    insights,
    followerUsernames,
    followingUsernames,
    followerTimestamps,
    followingTimestamps,
    baselineFollowerTimestamps,
    diff,
    activeTab,
  } = state;
  if (!insights) return [];
  switch (activeTab) {
    case "notFollowingBack":
      return withTimestamps(insights.notFollowingBack, followingTimestamps);
    case "mutuals":
      return withFallbackTimestamps(insights.mutuals, followerTimestamps, followingTimestamps);
    case "fans":
      return withTimestamps(insights.fans, followerTimestamps);
    case "unfollowed":
      return withTimestamps(diff?.unfollowed ?? [], baselineFollowerTimestamps);
    case "newFollowers":
      return withTimestamps(diff?.newFollowers ?? [], followerTimestamps);
    case "allFollowers":
      return withTimestamps(followerUsernames, followerTimestamps);
    case "allFollowing":
      return withTimestamps(followingUsernames, followingTimestamps);
    default:
      return [];
  }
}
