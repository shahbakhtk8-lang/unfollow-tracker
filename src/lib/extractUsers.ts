import { Parser } from "htmlparser2";
import { dedupeUsers, normalizeUsername, type UserEntry } from "./normalize";

type JsonRecord = Record<string, unknown>;

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
    if (title) {
      out.push({ username: title });
    }
  }
  return out;
}

export function parseFollowersJson(text: string): UserEntry[] {
  const data = JSON.parse(text) as unknown;
  if (Array.isArray(data)) {
    return dedupeUsers(extractFromRelationshipArray(data));
  }
  if (data && typeof data === "object") {
    const rec = data as JsonRecord;
    const key = rec.relationships_followers ?? rec.relationships_following;
    if (Array.isArray(key)) {
      return dedupeUsers(extractFromRelationshipArray(key));
    }
  }
  return [];
}

export function parseFollowingJson(text: string): UserEntry[] {
  const data = JSON.parse(text) as unknown;
  if (data && typeof data === "object") {
    const rec = data as JsonRecord;
    const arr = rec.relationships_following;
    if (Array.isArray(arr)) {
      return dedupeUsers(extractFromRelationshipArray(arr));
    }
  }
  if (Array.isArray(data)) {
    return dedupeUsers(extractFromRelationshipArray(data));
  }
  return [];
}

const IG_PROFILE_RE = /instagram\.com\/([a-zA-Z0-9._]+)/i;

const RESERVED_PATHS = new Set([
  "explore",
  "accounts",
  "reel",
  "reels",
  "p",
  "stories",
  "direct",
  "about",
  "legal",
  "directory",
  "emails",
  "tv",
  "tags",
  "locations",
]);

export function parseFollowersHtml(html: string): UserEntry[] {
  const out: UserEntry[] = [];
  const parser = new Parser(
    {
      onopentag(name, attribs) {
        if (name !== "a") return;
        const href = attribs.href ?? "";
        const m = IG_PROFILE_RE.exec(href);
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

export function parseFollowingHtml(html: string): UserEntry[] {
  return parseFollowersHtml(html);
}

export function followerFileSortKey(filename: string): number {
  const base = filename.split("/").pop() ?? filename;
  const m = /^followers_(\d+)\./i.exec(base);
  return m ? parseInt(m[1], 10) : 0;
}

export function isFollowersPath(path: string): boolean {
  const lower = path.toLowerCase().replace(/\\/g, "/");
  return (
    lower.includes("followers_and_following") &&
    /followers_\d+\.(json|html)$/i.test(lower)
  );
}

export function isFollowingPath(path: string): boolean {
  const lower = path.toLowerCase().replace(/\\/g, "/");
  return lower.includes("followers_and_following") && /following\.(json|html)$/i.test(lower);
}
