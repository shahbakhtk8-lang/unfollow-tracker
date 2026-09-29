import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { compareTwoExports } from "../src/lib/compareTwoExports";
import { diffSnapshots } from "../src/lib/diff";
import { timestampMapFromEntries, usernamesFromEntries } from "../src/lib/normalize";
import { getExportDate } from "../src/lib/exportDate";
import { parseZipBlob } from "../src/lib/parseZip";
import { buildNewExport, buildOldExport, type FakeExport } from "./fixtures/compare/buildLists";
import type { UserEntry } from "../src/lib/normalize";

function sideFromLists(fileName: string, lists: FakeExport) {
  const dated = getExportDate({
    followerTimestamps: timestampMapFromEntries(lists.followers),
    followingTimestamps: timestampMapFromEntries(lists.following),
  });
  return {
    fileName,
    followerUsernames: usernamesFromEntries(lists.followers),
    followerTimestamps: timestampMapFromEntries(lists.followers),
    exportDate: dated.exportDate,
    exportDateSource: dated.source,
  };
}

function followerJson(users: UserEntry[]): string {
  return JSON.stringify(
    users.map((user) => ({
      string_list_data: [
        {
          href: `https://www.instagram.com/${user.username}/`,
          value: user.username,
          timestamp: user.timestamp,
        },
      ],
    })),
  );
}

function followingJson(users: UserEntry[]): string {
  return JSON.stringify({
    relationships_following: users.map((user) => ({
      title: user.username,
      string_list_data: [
        {
          href: `https://www.instagram.com/${user.username}/`,
          timestamp: user.timestamp,
        },
      ],
    })),
  });
}

async function zipExport(lists: FakeExport): Promise<Blob> {
  const zip = new JSZip();
  zip.file("connections/followers_and_following/followers_1.json", followerJson(lists.followers));
  zip.file("connections/followers_and_following/following.json", followingJson(lists.following));
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return new Blob([buffer]);
}

describe("compareTwoExports", () => {
  const older = buildOldExport();
  const newer = buildNewExport();

  it("finds 30 unfollowed and 20 new followers when the older ZIP is dropped first", () => {
    const decision = compareTwoExports(sideFromLists("old.zip", older), sideFromLists("new.zip", newer));
    expect(decision.status).toBe("ready");
    if (decision.status !== "ready") return;
    expect(decision.ordered.swapped).toBe(false);
    const diff = diffSnapshots(decision.ordered.oldFollowers, decision.ordered.newFollowers);
    expect(diff.unfollowed).toHaveLength(30);
    expect(diff.newFollowers).toHaveLength(20);
  });

  it("finds the same 30 and 20 when the newer ZIP is dropped first", () => {
    const decision = compareTwoExports(sideFromLists("new.zip", newer), sideFromLists("old.zip", older));
    expect(decision.status).toBe("ready");
    if (decision.status !== "ready") return;
    expect(decision.ordered.swapped).toBe(true);
    const diff = diffSnapshots(decision.ordered.oldFollowers, decision.ordered.newFollowers);
    expect(diff.unfollowed).toHaveLength(30);
    expect(diff.newFollowers).toHaveLength(20);
  });

  it("parses both ZIP drop orders through parseZipBlob with the same lists", async () => {
    const oldBlob = await zipExport(older);
    const newBlob = await zipExport(newer);
    const parsedOld = await parseZipBlob(oldBlob);
    const parsedNew = await parseZipBlob(newBlob);

    const oldFirst = compareTwoExports(
      {
        fileName: "old.zip",
        followerUsernames: parsedOld.followerUsernames,
        followerTimestamps: parsedOld.followerTimestamps,
        exportDate: parsedOld.exportDate,
        exportDateSource: parsedOld.exportDateSource,
      },
      {
        fileName: "new.zip",
        followerUsernames: parsedNew.followerUsernames,
        followerTimestamps: parsedNew.followerTimestamps,
        exportDate: parsedNew.exportDate,
        exportDateSource: parsedNew.exportDateSource,
      },
    );
    const newFirst = compareTwoExports(
      {
        fileName: "new.zip",
        followerUsernames: parsedNew.followerUsernames,
        followerTimestamps: parsedNew.followerTimestamps,
        exportDate: parsedNew.exportDate,
        exportDateSource: parsedNew.exportDateSource,
      },
      {
        fileName: "old.zip",
        followerUsernames: parsedOld.followerUsernames,
        followerTimestamps: parsedOld.followerTimestamps,
        exportDate: parsedOld.exportDate,
        exportDateSource: parsedOld.exportDateSource,
      },
    );

    expect(oldFirst.status).toBe("ready");
    expect(newFirst.status).toBe("ready");
    if (oldFirst.status !== "ready" || newFirst.status !== "ready") return;
    const a = diffSnapshots(oldFirst.ordered.oldFollowers, oldFirst.ordered.newFollowers);
    const b = diffSnapshots(newFirst.ordered.oldFollowers, newFirst.ordered.newFollowers);
    expect(a.unfollowed).toEqual(b.unfollowed);
    expect(a.newFollowers).toEqual(b.newFollowers);
    expect(a.unfollowed).toHaveLength(30);
    expect(a.newFollowers).toHaveLength(20);
  });
});
