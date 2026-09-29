import { describe, expect, it } from "vitest";
import { applyReviewFilter, excludeIgnored, ignoredOverlap } from "../src/lib/userLists";

describe("ignore list helpers", () => {
  it("drops ignored names from the not-back list", () => {
    const visible = excludeIgnored(
      ["test_user_001", "test_user_002", "test_user_003"],
      ["test_user_002"],
    );
    expect(visible).toEqual(["test_user_001", "test_user_003"]);
    expect(ignoredOverlap(["test_user_001", "test_user_002", "test_user_003"], ["test_user_002"])).toBe(
      1,
    );
  });

  it("filters reviewed and unreviewed rows", () => {
    const rows = [{ username: "test_user_001" }, { username: "test_user_002" }];
    const reviewed = new Set(["test_user_001"]);
    expect(applyReviewFilter(rows, reviewed, "reviewed").map((row) => row.username)).toEqual([
      "test_user_001",
    ]);
    expect(applyReviewFilter(rows, reviewed, "unreviewed").map((row) => row.username)).toEqual([
      "test_user_002",
    ]);
    expect(applyReviewFilter(rows, reviewed, "all")).toHaveLength(2);
  });
});
