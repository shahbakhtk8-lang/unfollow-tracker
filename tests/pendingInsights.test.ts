import { describe, expect, it } from "vitest";
import {
  daysPending,
  filterPendingRows,
  formatDaysPending,
  sortPendingRows,
  toPendingRows,
  type PendingRow,
} from "../src/lib/pendingRequests";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 1); // 2026-01-01

describe("daysPending", () => {
  it("counts whole days from a Unix-seconds sent date", () => {
    const threeYearsAgo = Math.floor((NOW - 1204 * DAY) / 1000);
    expect(daysPending(threeYearsAgo, NOW)).toBe(1204);
  });

  it("accepts millisecond timestamps", () => {
    expect(daysPending(NOW - 10 * DAY, NOW)).toBe(10);
  });

  it("never returns a negative count", () => {
    expect(daysPending(Math.floor((NOW + DAY) / 1000), NOW)).toBe(0);
  });
});

describe("formatDaysPending", () => {
  it("formats singular and plural with thousands separators", () => {
    expect(formatDaysPending(1)).toBe("Pending for 1 day");
    expect(formatDaysPending(1204)).toBe("Pending for 1,204 days");
  });
});

describe("sortPendingRows", () => {
  const rows: PendingRow[] = [
    { username: "zeta", timestamp: 1700000000, daysPending: 100 },
    { username: "alpha", timestamp: 1600000000, daysPending: 1200 },
    { username: "no_date", daysPending: null },
    { username: "mid", timestamp: 1650000000, daysPending: 500 },
  ];

  it("defaults to oldest-first and parks undated rows at the end", () => {
    expect(sortPendingRows(rows, "oldest").map((r) => r.username)).toEqual([
      "alpha",
      "mid",
      "zeta",
      "no_date",
    ]);
  });

  it("sorts newest-first", () => {
    expect(sortPendingRows(rows, "newest").map((r) => r.username)).toEqual([
      "zeta",
      "mid",
      "alpha",
      "no_date",
    ]);
  });

  it("sorts by username", () => {
    expect(sortPendingRows(rows, "username").map((r) => r.username)).toEqual([
      "alpha",
      "mid",
      "no_date",
      "zeta",
    ]);
  });
});

describe("toPendingRows + filter", () => {
  it("leaves daysPending null when there is no timestamp", () => {
    const rows = toPendingRows([{ username: "a" }, { username: "b", timestamp: 1600000000 }], NOW);
    expect(rows[0]?.daysPending).toBeNull();
    expect(rows[1]?.daysPending).toBeGreaterThan(0);
  });

  it("filters by username substring", () => {
    const rows = toPendingRows(
      [
        { username: "test_user_pending_001", timestamp: 1 },
        { username: "other_account", timestamp: 2 },
      ],
      NOW,
    );
    expect(filterPendingRows(rows, "pending").map((r) => r.username)).toEqual([
      "test_user_pending_001",
    ]);
  });
});
