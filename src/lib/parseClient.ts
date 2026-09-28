import * as Comlink from "comlink";
import type { ParseWorkerApi } from "../worker/parseZip.worker";
import type { ParseProgress, ParseResult } from "./parseZip";
import { diffSnapshots } from "./diff";

let worker: Worker | null = null;
let api: Comlink.Remote<ParseWorkerApi> | null = null;

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("../worker/parseZip.worker.ts", import.meta.url), {
      type: "module",
    });
    api = Comlink.wrap<ParseWorkerApi>(worker);
  }
  return api!;
}

export async function parseZipFile(
  file: File,
  onProgress?: (p: ParseProgress) => void,
): Promise<ParseResult> {
  const remote = getWorker();
  const progressProxy = onProgress
    ? Comlink.proxy(onProgress)
    : undefined;
  return remote.parseFile(file, progressProxy);
}

export async function parseZipWithDiff(
  newFile: File,
  oldFollowerUsernames: string[],
  onProgress?: (p: ParseProgress) => void,
) {
  const remote = getWorker();
  const progressProxy = onProgress ? Comlink.proxy(onProgress) : undefined;
  return remote.parseFileAndDiff(newFile, oldFollowerUsernames, progressProxy);
}

export function computeDiffLocal(oldFollowers: string[], newFollowers: string[]) {
  return diffSnapshots(oldFollowers, newFollowers);
}
