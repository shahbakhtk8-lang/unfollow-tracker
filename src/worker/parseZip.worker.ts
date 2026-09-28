import * as Comlink from "comlink";
import { parseZipBlob, type ParseProgress, type ParseResult } from "../lib/parseZip";
import { diffSnapshots } from "../lib/diff";

export type { ParseProgress, ParseResult };

const api = {
  async parseFile(
    file: File,
    onProgress?: (p: ParseProgress) => void,
  ): Promise<ParseResult> {
    return parseZipBlob(file, onProgress);
  },
  async parseFileAndDiff(
    newFile: File,
    oldFollowerUsernames: string[],
    onProgress?: (p: ParseProgress) => void,
  ) {
    const result = await parseZipBlob(newFile, onProgress);
    const diff = diffSnapshots(oldFollowerUsernames, result.followerUsernames);
    return { ...result, diff };
  },
};

export type ParseWorkerApi = typeof api;

Comlink.expose(api);
