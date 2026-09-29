import {
  ZipReader,
  BlobReader,
  TextWriter,
  configure,
  type Entry,
  type FileEntry,
} from "@zip.js/zip.js";
import {
  createFollowersHtmlParser,
  followerFileSortKey,
  isFollowersPath,
  isFollowingPath,
  parseFollowersJson,
  parseFollowingJson,
} from "./extractUsers";
import type { UserEntry } from "./normalize";
import { getExportDate, type ExportDateSource } from "./exportDate";
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
  exportDate: number | null;
  exportDateSource: ExportDateSource | null;
}

function isFileEntry(entry: Entry): entry is FileEntry {
  return entry.directory === false;
}

async function readEntryText(entry: FileEntry): Promise<string> {
  return entry.getData(new TextWriter());
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function parseHtmlEntry(
  entry: FileEntry,
  onBytes?: (done: number, total: number) => void,
): Promise<UserEntry[]> {
  const html = createFollowersHtmlParser();
  const decoder = new TextDecoder("utf-8");
  let lastReported = 0;

  await entry.getData(
    new WritableStream<Uint8Array>({
      write(chunk) {
        html.write(decoder.decode(chunk, { stream: true }));
      },
      close() {
        html.write(decoder.decode());
      },
    }),
    {
      onprogress(done, total) {
        if (total <= 0) return;
        if (done - lastReported < 256 * 1024 && done < total) return;
        lastReported = done;
        onBytes?.(done, total);
      },
    },
  );

  return html.end();
}

function keepParseError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.startsWith("Could not find followers or following files.") ||
    error.message.startsWith("This export has no followers or following accounts.")
  );
}

export async function parseZipBlob(
  blob: Blob,
  onProgress?: (p: ParseProgress) => void,
): Promise<ParseResult> {
  try {
    return await readExportZip(blob, onProgress);
  } catch (error) {
    if (keepParseError(error)) throw error;
    throw new Error(
      "This file could not be read as an Instagram export ZIP. Choose the .zip you downloaded from Meta.",
    );
  }
}

async function readExportZip(
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
    if (isFollowersPath(path)) {
      followerFiles.push({ path, entry });
      rememberModified(entry);
    } else if (isFollowingPath(path)) {
      followingEntry = entry;
      rememberModified(entry);
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
      if (e.filename) {
        followerFiles.push({ path: e.filename, entry: e });
        rememberModified(e);
      }
    }
    followerFiles.sort((a, b) => followerFileSortKey(a.path) - followerFileSortKey(b.path));
    if (fuzzyFollowing) {
      followingEntry = fuzzyFollowing;
      rememberModified(fuzzyFollowing);
    }
  }

  if (followerFiles.length === 0 && !followingEntry) {
    await reader.close();
    throw new Error(
      "Could not find followers or following files. Export with Connections → Followers and following.",
    );
  }

  report("parsing_followers", 35, "Parsing followers…");

  const followersAccum: ReturnType<typeof parseFollowersJson> = [];
  const followerFileCount = Math.max(followerFiles.length, 1);
  for (let i = 0; i < followerFiles.length; i++) {
    const { path, entry } = followerFiles[i];
    const lower = path.toLowerCase();
    const fileStart = 35 + Math.round((i / followerFileCount) * 25);
    const fileEnd = 35 + Math.round(((i + 1) / followerFileCount) * 25);
    const chunk = lower.endsWith(".html")
      ? await parseHtmlEntry(entry, (done, total) => {
          const span = Math.max(fileEnd - fileStart, 1);
          report(
            "parsing_followers",
            fileStart + Math.round((done / total) * span),
            `Parsing followers (${formatMb(done)} of ${formatMb(total)})…`,
          );
        })
      : parseFollowersJson(await readEntryText(entry));
    followersAccum.push(...chunk);
    report(
      "parsing_followers",
      fileEnd,
      `Parsing followers (${i + 1}/${followerFiles.length})…`,
    );
  }

  report("parsing_following", 65, "Parsing following…");

  let followingAccum: ReturnType<typeof parseFollowingJson> = [];
  if (followingEntry?.filename) {
    const lower = followingEntry.filename.toLowerCase();
    followingAccum = lower.endsWith(".html")
      ? await parseHtmlEntry(followingEntry, (done, total) => {
          report(
            "parsing_following",
            65 + Math.round((done / total) * 20),
            `Parsing following (${formatMb(done)} of ${formatMb(total)})…`,
          );
        })
      : parseFollowingJson(await readEntryText(followingEntry));
  }

  await reader.close();

  if (followersAccum.length === 0 && followingAccum.length === 0) {
    throw new Error(
      "This export has no followers or following accounts. Check that you included Followers and following in the Meta download.",
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
    exportDateSource: dated.source,
  };
}
