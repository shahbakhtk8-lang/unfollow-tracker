import { describe, expect, it } from "vitest";
import { relatedLiveTools, tools, isToolActive } from "../src/content/tools";

describe("tools registry", () => {
  it("lists Unfollow Tracker as the live tool on /", () => {
    const tracker = tools.find((tool) => tool.slug === "unfollow-tracker");
    expect(tracker).toMatchObject({
      href: "/",
      status: "live",
      name: "Unfollow Tracker",
    });
    expect(relatedLiveTools("unfollow-tracker")).toEqual([]);
  });

  it("treats / and /analyze as the Unfollow Tracker tool", () => {
    const tracker = tools.find((tool) => tool.slug === "unfollow-tracker");
    expect(tracker).toBeDefined();
    expect(isToolActive(tracker!, "/")).toBe(true);
    expect(isToolActive(tracker!, "/analyze")).toBe(true);
    expect(isToolActive(tracker!, "/guide")).toBe(false);
  });
});
