import { Parser } from "htmlparser2";
import { dedupeUsers, normalizeUsername, type UserEntry } from "./normalize";

type JsonRecord = Record<string, unknown>;

/**
 * Threads export JSON keys (verified against public importer docs / fixtures descriptions, 2026):
 * - Followers wrapper: text_post_app_text_post_app_followers
 * - Following wrapper: text_post_app_text_post_app_following
 *
 * Also tolerate Instagram-style keys and a combined followers_and_following.json shape
 * because Meta packaging varies. Flag: re-verify against a real Threads ZIP if imports fail.
 */
const FOLLOWER_KEYS = [
  "text_post_app_text_post_app_followers",
  "relationships_followers",
  "followers",
] as const;

const FOLLOWING_KEYS = [
  "text_post_app_text_post_app_following",
  "relationships_following",
  "following",
] as const;

function extractFromRelationshipArray(items: unknown[]): UserEntry[] {
  const out: UserEntry[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const rec = item as JsonRecord;
    const title = normalizeUsername(typeof rec.title === "string" ? rec.title : undefined);
    const sld = rec.string_list_data;
    if (Array.isArray(sld) && sld.length > 0) {
      const first = sld[0] as JsonRecord;
      const value = normalizeUsername(typeof first.value === "string" ? first.value : undefined);
      const username = value ?? title;
      if (!username) continue;
      out.push({
        username,
        href: typeof first.href === "string" ? first.href : undefined,
        timestamp: typeof first.timestamp === "number" ? first.timestamp : undefined,
      });
      continue;
    }
    if (title) out.push({ username: title });
  }
  return out;
}

function arrayFromKeys(rec: JsonRecord, keys: readonly string[]): unknown[] | null {
  for (const key of keys) {
    const val = rec[key];
    if (Array.isArray(val)) return val;
  }
  return null;
}

/**
 * blocked_and_unfollowed.json lists accounts YOU blocked or unfollowed — not people who
 * unfollowed you. Never merge it into followers or following sets.
 */
export function isBlockedAndUnfollowedPath(path: string): boolean {
  const lower = path.toLowerCase().replace(/\\/g, "/");
  const base = lower.split("/").pop() ?? lower;
  return /^blocked_and_unfollowed(\.json|\.html)?$/i.test(base);
}

/** True when a ZIP entry path looks like Threads relationship data (not Instagram connections/). */
export function looksLikeThreadsExportPath(path: string): boolean {
  const lower = path.toLowerCase().replace(/\\/g, "/");
  if (isBlockedAndUnfollowedPath(lower)) return false;
  if (lower.includes("/threads/")) return true;
  if (lower.includes("your_instagram_activity/threads")) return true;
  if (/\/followers_and_following\.json$/i.test(lower)) return true;
  if (/\/(followers|following)(_\d+)?\.(json|html)$/i.test(lower) && !lower.includes("followers_and_following/")) {
    // Standalone Threads-style files outside Instagram's connections/followers_and_following/
    if (!lower.includes("connections/followers_and_following")) return true;
  }
  return false;
}

export function isThreadsFollowersPath(path: string): boolean {
  const lower = path.toLowerCase().replace(/\\/g, "/");
  if (isBlockedAndUnfollowedPath(lower)) return false;
  if (!looksLikeThreadsExportPath(lower) && !lower.includes("/threads/")) return false;
  const base = lower.split("/").pop() ?? lower;
  if (/^followers_and_following\.(json|html)$/i.test(base)) return false; // combined — handled separately
  return /^followers(_\d+)?\.(json|html)$/i.test(base);
}

export function isThreadsFollowingPath(path: string): boolean {
  const lower = path.toLowerCase().replace(/\\/g, "/");
  if (isBlockedAndUnfollowedPath(lower)) return false;
  if (!looksLikeThreadsExportPath(lower) && !lower.includes("/threads/")) return false;
  const base = lower.split("/").pop() ?? lower;
  return /^following\.(json|html)$/i.test(base);
}

export function isThreadsCombinedFollowersFollowingPath(path: string): boolean {
  const lower = path.toLowerCase().replace(/\\/g, "/");
  if (isBlockedAndUnfollowedPath(lower)) return false;
  const base = lower.split("/").pop() ?? lower;
  return /^followers_and_following\.(json|html)$/i.test(base);
}

export function threadsFollowerFileSortKey(filename: string): number {
  const base = filename.split("/").pop() ?? filename;
  const m = /^followers_(\d+)\./i.exec(base);
  return m ? parseInt(m[1], 10) : 0;
}

export function parseThreadsFollowersJson(text: string): UserEntry[] {
  const data = JSON.parse(text) as unknown;
  if (Array.isArray(data)) {
    return dedupeUsers(extractFromRelationshipArray(data));
  }
  if (data && typeof data === "object") {
    const rec = data as JsonRecord;
    const arr = arrayFromKeys(rec, FOLLOWER_KEYS);
    if (arr) return dedupeUsers(extractFromRelationshipArray(arr));
  }
  return [];
}

export function parseThreadsFollowingJson(text: string): UserEntry[] {
  const data = JSON.parse(text) as unknown;
  if (Array.isArray(data)) {
    return dedupeUsers(extractFromRelationshipArray(data));
  }
  if (data && typeof data === "object") {
    const rec = data as JsonRecord;
    const arr = arrayFromKeys(rec, FOLLOWING_KEYS);
    if (arr) return dedupeUsers(extractFromRelationshipArray(arr));
  }
  return [];
}

/** Combined file may hold both follower and following arrays under different keys. */
export function parseThreadsCombinedJson(text: string): {
  followers: UserEntry[];
  following: UserEntry[];
} {
  const data = JSON.parse(text) as unknown;
  if (Array.isArray(data)) {
    return { followers: dedupeUsers(extractFromRelationshipArray(data)), following: [] };
  }
  if (data && typeof data === "object") {
    const rec = data as JsonRecord;
    const followersArr = arrayFromKeys(rec, FOLLOWER_KEYS);
    const followingArr = arrayFromKeys(rec, FOLLOWING_KEYS);
    return {
      followers: followersArr
        ? dedupeUsers(extractFromRelationshipArray(followersArr))
        : [],
      following: followingArr
        ? dedupeUsers(extractFromRelationshipArray(followingArr))
        : [],
    };
  }
  return { followers: [], following: [] };
}

const THREADS_PROFILE_RE = /(?:threads\.(?:net|com)|www\.threads\.(?:net|com))\/@?([a-zA-Z0-9._]+)/i;

const RESERVED_PATHS = new Set([
  "explore",
  "accounts",
  "login",
  "about",
  "legal",
  "intent",
  "t",
]);

/** HTML export fallback (Threads profile links). Marked secondary — JSON is preferred. */
export function parseThreadsFollowersHtml(html: string): UserEntry[] {
  const out: UserEntry[] = [];
  const parser = new Parser(
    {
      onopentag(name, attribs) {
        if (name !== "a") return;
        const href = attribs.href ?? "";
        const m = THREADS_PROFILE_RE.exec(href);
        if (!m) return;
        const username = normalizeUsername(m[1]);
        if (username && !RESERVED_PATHS.has(username)) out.push({ username, href });
      },
    },
    { decodeEntities: true },
  );
  parser.write(html);
  parser.end();
  return dedupeUsers(out);
}

export function parseThreadsFollowingHtml(html: string): UserEntry[] {
  return parseThreadsFollowersHtml(html);
}
