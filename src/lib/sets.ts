import type { UserEntry } from "./normalize";
import { usernamesFromEntries } from "./normalize";

export interface ParsedLists {
  followers: UserEntry[];
  following: UserEntry[];
}

export interface Insights {
  followerCount: number;
  followingCount: number;
  notFollowingBack: string[];
  mutuals: string[];
  fans: string[];
  followBackRate: number;
}

export function toSet(usernames: string[]): Set<string> {
  return new Set(usernames);
}

export function setDifference(a: Set<string>, b: Set<string>): string[] {
  const out: string[] = [];
  for (const x of a) {
    if (!b.has(x)) out.push(x);
  }
  out.sort((x, y) => x.localeCompare(y));
  return out;
}

export function setIntersection(a: Set<string>, b: Set<string>): string[] {
  const out: string[] = [];
  for (const x of a) {
    if (b.has(x)) out.push(x);
  }
  out.sort((x, y) => x.localeCompare(y));
  return out;
}

export function computeInsights(lists: ParsedLists): Insights {
  const followerNames = usernamesFromEntries(lists.followers);
  const followingNames = usernamesFromEntries(lists.following);
  const followers = toSet(followerNames);
  const following = toSet(followingNames);

  const notFollowingBack = setDifference(following, followers);
  const mutuals = setIntersection(followers, following);
  const fans = setDifference(followers, following);

  const followBackRate =
    following.size === 0 ? 0 : Math.round((mutuals.length / following.size) * 1000) / 10;

  return {
    followerCount: followers.size,
    followingCount: following.size,
    notFollowingBack,
    mutuals,
    fans,
    followBackRate,
  };
}
