import { describe, expect, it } from "vitest";
import { diffSnapshots, orderComparison } from "../src/lib/diff";
import { getExportDate, snapshotExportDate, toEpochMillis } from "../src/lib/exportDate";
import { timestampMapFromEntries, usernamesFromEntries } from "../src/lib/normalize";
import { computeInsights } from "../src/lib/sets";
import { buildNewExport, buildOldExport } from "./fixtures/compare/buildLists";
import type { UserEntry } from "../src/lib/normalize";

function dated(exportLists: { followers: UserEntry[]; following: UserEntry[] }) {
  return getExportDate({
    followerTimestamps: timestampMapFromEntries(exportLists.followers),
    followingTimestamps: timestampMapFromEntries(exportLists.following),
  });
}

function compared(
  snapshotLists: { followers: UserEntry[]; following: UserEntry[] },
  currentLists: { followers: UserEntry[]; following: UserEntry[] },
) {
  const snapshotDate = dated(snapshotLists);
  const currentDate = dated(currentLists);
  return orderComparison({
    snapshotDate: snapshotDate.exportDate,
    currentDate: currentDate.exportDate,
    snapshotSource: snapshotDate.source,
    currentSource: currentDate.source,
    snapshotFollowers: usernamesFromEntries(snapshotLists.followers),
    currentFollowers: usernamesFromEntries(currentLists.followers),
  });
}

describe("fake old and new exports", () => {
  const older = buildOldExport();
  const newer = buildNewExport();

  it("counts the newer export after dropping the instagram placeholder", () => {
    expect(newer.followers.some((user) => user.username === "instagram")).toBe(true);
    const insights = computeInsights({ followers: newer.followers, following: newer.following });
    expect(insights.followerCount).toBe(290);
    expect(insights.followingCount).toBe(350);
    expect(insights.notFollowingBack).toHaveLength(165);
    expect(insights.mutuals).toHaveLength(185);
    expect(insights.fans).toHaveLength(105);
    expect(insights.followBackRate).toBe(52.9);
    expect(usernamesFromEntries(newer.followers)).not.toContain("instagram");
  });

  it("old snapshot plus new upload finds 30 unfollowed and 20 new followers", () => {
    const decision = compared(older, newer);
    expect(decision.status).toBe("ready");
    if (decision.status !== "ready") return;
    expect(decision.ordered.swapped).toBe(false);
    expect(decision.ordered.oldSource).toBe("follow-activity");
    const diff = diffSnapshots(decision.ordered.oldFollowers, decision.ordered.newFollowers);
    expect(diff.unfollowed).toHaveLength(30);
    expect(diff.newFollowers).toHaveLength(20);
  });

  it("new snapshot plus old upload gives the same unfollowed and new lists", () => {
    const forward = compared(older, newer);
    const backward = compared(newer, older);
    expect(forward.status).toBe("ready");
    expect(backward.status).toBe("ready");
    if (forward.status !== "ready" || backward.status !== "ready") return;
    expect(backward.ordered.swapped).toBe(true);
    const first = diffSnapshots(forward.ordered.oldFollowers, forward.ordered.newFollowers);
    const second = diffSnapshots(backward.ordered.oldFollowers, backward.ordered.newFollowers);
    expect(second.unfollowed).toEqual(first.unfollowed);
    expect(second.newFollowers).toEqual(first.newFollowers);
    expect(second.unfollowed).toHaveLength(30);
    expect(second.newFollowers).toHaveLength(20);
  });
});

describe("export date ordering", () => {
  it("asks for a choice when both export dates are equal", () => {
    const day = Date.parse("2026-09-01T00:00:00Z");
    expect(
      orderComparison({
        snapshotDate: day,
        currentDate: day,
        snapshotFollowers: ["test_user_001"],
        currentFollowers: ["test_user_002"],
      }).status,
    ).toBe("needs-choice");
  });

  it("asks for a choice when either export date is null", () => {
    expect(
      orderComparison({
        snapshotDate: null,
        currentDate: Date.parse("2026-09-01T00:00:00Z"),
        snapshotFollowers: ["test_user_001"],
        currentFollowers: ["test_user_002"],
      }).status,
    ).toBe("needs-choice");
    expect(
      orderComparison({
        snapshotDate: null,
        currentDate: null,
        snapshotFollowers: ["test_user_001"],
        currentFollowers: ["test_user_002"],
      }).status,
    ).toBe("needs-choice");
  });

  it("treats a legacy snapshot without exportDate as unknown", () => {
    const legacy: { exportDate?: number | null; createdAt: number } = {
      createdAt: Date.parse("2026-09-28T00:00:00Z"),
    };
    expect(snapshotExportDate(legacy)).toBeNull();
    expect(
      orderComparison({
        snapshotDate: snapshotExportDate(legacy),
        currentDate: Date.parse("2026-08-01T00:00:00Z"),
        snapshotFollowers: ["test_user_001"],
        currentFollowers: ["test_user_002"],
      }).status,
    ).toBe("needs-choice");
  });

  it("reads follow timestamps stored as seconds or milliseconds", () => {
    const seconds = Math.floor(Date.parse("2026-08-10T00:00:00Z") / 1000);
    const milliseconds = Date.parse("2026-09-27T00:00:00Z");
    const dated = getExportDate({
      followerTimestamps: { test_user_001: seconds },
      followingTimestamps: { test_user_002: milliseconds },
    });
    expect(dated.source).toBe("follow-activity");
    expect(dated.exportDate).toBe(milliseconds);
    expect(toEpochMillis(seconds)).toBe(seconds * 1000);
    expect(dated.exportDate).toBeGreaterThan(toEpochMillis(seconds));

    const zipOnly = getExportDate({
      followerTimestamps: {},
      followingTimestamps: {},
      zipModifiedDates: [new Date("2024-01-01T00:00:00Z"), new Date("2024-06-01T00:00:00Z")],
    });
    expect(zipOnly.source).toBe("zip-modified");
    expect(zipOnly.exportDate).toBe(Date.parse("2024-06-01T00:00:00Z"));
    expect(getExportDate({}).exportDate).toBeNull();
  });
});
