import { create } from "zustand";
import type { Insights } from "@/lib/sets";
import type { SnapshotDiff } from "@/lib/diff";
import type { ExportDateSource } from "@/lib/exportDate";
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
  newerFollowerTimestamps: Record<string, number>;
  exportDate: number | null;
  exportDateSource: ExportDateSource | null;
  comparisonFrom: number | null;
  comparisonTo: number | null;
  comparisonOldSource: ExportDateSource | null;
  comparisonNewSource: ExportDateSource | null;
  comparisonManual: boolean;
  needsOlderChoice: boolean;
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
    newerFollowerTimestamps?: Record<string, number>;
    exportDate?: number | null;
    exportDateSource?: ExportDateSource | null;
    comparisonFrom?: number | null;
    comparisonTo?: number | null;
    comparisonOldSource?: ExportDateSource | null;
    comparisonNewSource?: ExportDateSource | null;
    comparisonManual?: boolean;
    needsOlderChoice?: boolean;
    diff?: SnapshotDiff | null;
  }) => void;
  setDiff: (
    diff: SnapshotDiff | null,
    meta?: {
      baselineFollowerTimestamps?: Record<string, number>;
      newerFollowerTimestamps?: Record<string, number>;
      from?: number | null;
      to?: number | null;
      oldSource?: ExportDateSource | null;
      newSource?: ExportDateSource | null;
      manual?: boolean;
      needsOlderChoice?: boolean;
    },
  ) => void;
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
  newerFollowerTimestamps: {} as Record<string, number>,
  exportDate: null as number | null,
  exportDateSource: null as ExportDateSource | null,
  comparisonFrom: null as number | null,
  comparisonTo: null as number | null,
  comparisonOldSource: null as ExportDateSource | null,
  comparisonNewSource: null as ExportDateSource | null,
  comparisonManual: false,
  needsOlderChoice: false,
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
      newerFollowerTimestamps: payload.newerFollowerTimestamps ?? {},
      exportDate: payload.exportDate ?? null,
      exportDateSource: payload.exportDateSource ?? null,
      comparisonFrom: payload.comparisonFrom ?? null,
      comparisonTo: payload.comparisonTo ?? null,
      comparisonOldSource: payload.comparisonOldSource ?? null,
      comparisonNewSource: payload.comparisonNewSource ?? null,
      comparisonManual: payload.comparisonManual ?? false,
      needsOlderChoice: payload.needsOlderChoice ?? false,
      diff: payload.diff ?? null,
    }),
  setDiff: (diff, meta) =>
    set({
      diff,
      baselineFollowerTimestamps: diff ? (meta?.baselineFollowerTimestamps ?? {}) : {},
      newerFollowerTimestamps: diff ? (meta?.newerFollowerTimestamps ?? {}) : {},
      comparisonFrom: diff ? (meta?.from ?? null) : null,
      comparisonTo: diff ? (meta?.to ?? null) : null,
      comparisonOldSource: diff ? (meta?.oldSource ?? null) : null,
      comparisonNewSource: diff ? (meta?.newSource ?? null) : null,
      comparisonManual: diff ? (meta?.manual ?? false) : false,
      needsOlderChoice: meta?.needsOlderChoice ?? false,
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
    newerFollowerTimestamps,
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
      return withTimestamps(diff?.newFollowers ?? [], newerFollowerTimestamps);
    case "allFollowers":
      return withTimestamps(followerUsernames, followerTimestamps);
    case "allFollowing":
      return withTimestamps(followingUsernames, followingTimestamps);
    default:
      return [];
  }
}
