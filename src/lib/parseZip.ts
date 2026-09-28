import {
  ZipReader,
  BlobReader,
  TextWriter,
  configure,
  type Entry,
  type FileEntry,
} from "@zip.js/zip.js";
import {
  followerFileSortKey,
  isFollowersPath,
  isFollowingPath,
  parseFollowersHtml,
  parseFollowersJson,
  parseFollowingHtml,
  parseFollowingJson,
} from "./extractUsers";
import { computeInsights, type ParsedLists } from "./sets";
import { timestampMapFromEntries, usernamesFromEntries } from "./normalize";

configure({ useWebWorkers: false });

export type ParseStage =
  | "reading"
  | "parsing_followers"
  | "parsing_following"
  | "computing"
  | "done"
  | "error";

export interface ParseProgress {
  stage: ParseStage;
  percent: number;
  message: string;
}

export interface ParseResult {
  lists: ParsedLists;
  insights: ReturnType<typeof computeInsights>;
  followerUsernames: string[];
  followingUsernames: string[];
  followerTimestamps: Record<string, number>;
  followingTimestamps: Record<string, number>;
}

function isFileEntry(entry: Entry): entry is FileEntry {
  return entry.directory === false;
}

async function readEntryText(entry: FileEntry): Promise<string> {
  return entry.getData(new TextWriter());
}

export async function parseZipBlob(
  blob: Blob,
  onProgress?: (p: ParseProgress) => void,
): Promise<ParseResult> {
  const report = (stage: ParseStage, percent: number, message: string) => {
    onProgress?.({ stage, percent, message });
  };

  report("reading", 5, "Opening ZIP archive…");

  const reader = new ZipReader(new BlobReader(blob));
  const entries = await reader.getEntries();
  const total = entries.length || 1;

  const followerFiles: { path: string; entry: FileEntry }[] = [];
  let followingEntry: FileEntry | null = null;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry || !isFileEntry(entry) || !entry.filename) continue;
    const path = entry.filename.replace(/\\/g, "/");
    if (isFollowersPath(path)) {
      followerFiles.push({ path, entry });
    } else if (isFollowingPath(path)) {
      followingEntry = entry;
    }
    if (i % 50 === 0) {
      report("reading", 5 + Math.round((i / total) * 25), "Scanning archive…");
    }
  }

  followerFiles.sort((a, b) => followerFileSortKey(a.path) - followerFileSortKey(b.path));

  if (followerFiles.length === 0 && !followingEntry) {
    const fuzzyFollowers = entries.filter(
      (e): e is FileEntry =>
        isFileEntry(e) &&
        !!e.filename &&
        /followers_\d+\.(json|html)$/i.test(e.filename),
    );
    const fuzzyFollowing = entries.find(
      (e): e is FileEntry =>
        isFileEntry(e) && !!e.filename && /following\.(json|html)$/i.test(e.filename),
    );
    for (const e of fuzzyFollowers) {
      if (e.filename) followerFiles.push({ path: e.filename, entry: e });
    }
    followerFiles.sort((a, b) => followerFileSortKey(a.path) - followerFileSortKey(b.path));
    if (fuzzyFollowing) followingEntry = fuzzyFollowing;
  }

  if (followerFiles.length === 0 && !followingEntry) {
    await reader.close();
    throw new Error(
      "Could not find followers or following files. Export with Connections → Followers and following.",
    );
  }

  report("parsing_followers", 35, "Parsing followers…");

  const followersAccum: ReturnType<typeof parseFollowersJson> = [];
  for (let i = 0; i < followerFiles.length; i++) {
    const { path, entry } = followerFiles[i];
    const text = await readEntryText(entry);
    const lower = path.toLowerCase();
    const chunk = lower.endsWith(".html")
      ? parseFollowersHtml(text)
      : parseFollowersJson(text);
    followersAccum.push(...chunk);
    report(
      "parsing_followers",
      35 + Math.round(((i + 1) / Math.max(followerFiles.length, 1)) * 25),
      `Parsing followers (${i + 1}/${followerFiles.length})…`,
    );
  }

  report("parsing_following", 65, "Parsing following…");

  let followingAccum: ReturnType<typeof parseFollowingJson> = [];
  if (followingEntry?.filename) {
    const text = await readEntryText(followingEntry);
    const lower = followingEntry.filename.toLowerCase();
    followingAccum = lower.endsWith(".html")
      ? parseFollowingHtml(text)
      : parseFollowingJson(text);
  }

  await reader.close();

  report("computing", 90, "Computing insights…");

  const lists: ParsedLists = {
    followers: followersAccum,
    following: followingAccum,
  };

  const insights = computeInsights(lists);
  const followerUsernames = usernamesFromEntries(lists.followers);
  const followingUsernames = usernamesFromEntries(lists.following);

  report("done", 100, "Done");

  return {
    lists,
    insights,
    followerUsernames,
    followingUsernames,
    followerTimestamps: timestampMapFromEntries(lists.followers),
    followingTimestamps: timestampMapFromEntries(lists.following),
  };
}
