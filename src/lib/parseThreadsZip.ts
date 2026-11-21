import {
  ZipReader,
  BlobReader,
  TextWriter,
  configure,
  type Entry,
  type FileEntry,
} from "@zip.js/zip.js";
import {
  isBlockedAndUnfollowedPath,
  isThreadsCombinedFollowersFollowingPath,
  isThreadsFollowersPath,
  isThreadsFollowingPath,
  looksLikeThreadsExportPath,
  parseThreadsCombinedJson,
  parseThreadsFollowersHtml,
  parseThreadsFollowersJson,
  parseThreadsFollowingHtml,
  parseThreadsFollowingJson,
  threadsFollowerFileSortKey,
} from "./extractUsersThreads";
import { getExportDate, type ExportDateSource } from "./exportDate";
import { computeInsights, type ParsedLists } from "./sets";
import { timestampMapFromEntries, usernamesFromEntries, type UserEntry } from "./normalize";
import type { ParseProgress, ParseResult } from "./parseZip";

configure({ useWebWorkers: false });

function isFileEntry(entry: Entry): entry is FileEntry {
  return entry.directory === false;
}

async function readEntryText(entry: FileEntry): Promise<string> {
  return entry.getData(new TextWriter());
}

/**
 * Distinguishing marker vs Instagram:
 * - Threads paths live under `/threads/` (or `your_instagram_activity/threads/`),
 *   or use a combined `followers_and_following.json` outside `connections/followers_and_following/`.
 * - Instagram uses `connections/followers_and_following/followers_N.json`.
 */
export function zipLooksLikeThreadsExport(filenames: string[]): boolean {
  return filenames.some((name) => looksLikeThreadsExportPath(name.replace(/\\/g, "/")));
}

export async function parseThreadsZipBlob(
  blob: Blob,
  onProgress?: (p: ParseProgress) => void,
): Promise<ParseResult> {
  try {
    return await readThreadsExportZip(blob, onProgress);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Could not find")) throw error;
    if (error instanceof Error && error.message.startsWith("This export has no")) throw error;
    throw new Error(
      "This file could not be read as a Threads export ZIP. Choose the .zip you downloaded from Meta (Threads or Accounts Center).",
    );
  }
}

async function readThreadsExportZip(
  blob: Blob,
  onProgress?: (p: ParseProgress) => void,
): Promise<ParseResult> {
  const report = (stage: ParseProgress["stage"], percent: number, message: string) => {
    onProgress?.({ stage, percent, message });
  };

  report("reading", 5, "Opening Threads ZIP…");

  const reader = new ZipReader(new BlobReader(blob));
  const entries = await reader.getEntries();
  const total = entries.length || 1;

  const followerFiles: { path: string; entry: FileEntry }[] = [];
  let followingEntry: FileEntry | null = null;
  let combinedEntry: FileEntry | null = null;
  const zipModifiedDates: number[] = [];

  const rememberModified = (entry: FileEntry) => {
    const modified = entry.lastModDate;
    if (modified instanceof Date && !Number.isNaN(modified.getTime())) {
      zipModifiedDates.push(modified.getTime());
    }
  };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry || !isFileEntry(entry) || !entry.filename) continue;
    const path = entry.filename.replace(/\\/g, "/");

    // Explicitly skip blocked_and_unfollowed — those are accounts YOU blocked/unfollowed.
    if (isBlockedAndUnfollowedPath(path)) continue;

    if (isThreadsCombinedFollowersFollowingPath(path)) {
      combinedEntry = entry;
      rememberModified(entry);
    } else if (isThreadsFollowersPath(path)) {
      followerFiles.push({ path, entry });
      rememberModified(entry);
    } else if (isThreadsFollowingPath(path)) {
      followingEntry = entry;
      rememberModified(entry);
    }

    if (i % 50 === 0) {
      report("reading", 5 + Math.round((i / total) * 25), "Scanning Threads archive…");
    }
  }

  followerFiles.sort((a, b) => threadsFollowerFileSortKey(a.path) - threadsFollowerFileSortKey(b.path));

  let followersAccum: UserEntry[] = [];
  let followingAccum: UserEntry[] = [];

  if (combinedEntry?.filename) {
    report("parsing_followers", 35, "Parsing combined followers/following…");
    const text = await readEntryText(combinedEntry);
    const lower = combinedEntry.filename.toLowerCase();
    if (lower.endsWith(".html")) {
      // Combined HTML is ambiguous — treat as followers-only HTML fallback.
      followersAccum = parseThreadsFollowersHtml(text);
    } else {
      const combined = parseThreadsCombinedJson(text);
      followersAccum = combined.followers;
      followingAccum = combined.following;
    }
  }

  report("parsing_followers", 45, "Parsing Threads followers…");
  for (let i = 0; i < followerFiles.length; i++) {
    const { path, entry } = followerFiles[i];
    const lower = path.toLowerCase();
    const chunk = lower.endsWith(".html")
      ? parseThreadsFollowersHtml(await readEntryText(entry))
      : parseThreadsFollowersJson(await readEntryText(entry));
    followersAccum.push(...chunk);
    report(
      "parsing_followers",
      45 + Math.round(((i + 1) / Math.max(followerFiles.length, 1)) * 20),
      `Parsing followers (${i + 1}/${followerFiles.length})…`,
    );
  }

  report("parsing_following", 70, "Parsing Threads following…");
  if (followingEntry?.filename) {
    const text = await readEntryText(followingEntry);
    const lower = followingEntry.filename.toLowerCase();
    const chunk = lower.endsWith(".html")
      ? parseThreadsFollowingHtml(text)
      : parseThreadsFollowingJson(text);
    followingAccum.push(...chunk);
  }

  await reader.close();

  if (
    !combinedEntry &&
    followerFiles.length === 0 &&
    !followingEntry
  ) {
    throw new Error(
      "Could not find Threads followers or following files. Look for threads/followers.json and threads/following.json (or a combined followers_and_following.json). blocked_and_unfollowed.json is ignored on purpose.",
    );
  }

  if (followersAccum.length === 0 && followingAccum.length === 0) {
    throw new Error(
      "This export has no Threads followers or following accounts. Check that relationship data was included in the download.",
    );
  }

  report("computing", 90, "Computing insights…");

  const lists: ParsedLists = {
    followers: followersAccum,
    following: followingAccum,
  };

  const insights = computeInsights(lists);
  const followerUsernames = usernamesFromEntries(lists.followers);
  const followingUsernames = usernamesFromEntries(lists.following);
  const followerTimestamps = timestampMapFromEntries(lists.followers);
  const followingTimestamps = timestampMapFromEntries(lists.following);
  const dated = getExportDate({ followerTimestamps, followingTimestamps, zipModifiedDates });

  report("done", 100, "Done");

  return {
    lists,
    insights,
    followerUsernames,
    followingUsernames,
    followerTimestamps,
    followingTimestamps,
    exportDate: dated.exportDate,
    exportDateSource: dated.source as ExportDateSource | null,
  };
}
