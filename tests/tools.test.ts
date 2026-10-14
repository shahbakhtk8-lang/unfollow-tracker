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
  });

  it("lists Pending Requests Checker and links both tools to each other", () => {
    const pending = tools.find((tool) => tool.slug === "pending-requests");
    expect(pending).toMatchObject({
      href: "/pending-requests",
      status: "live",
      name: "Pending Requests Checker",
    });
    expect(relatedLiveTools("unfollow-tracker").map((t) => t.slug)).toEqual([
      "pending-requests",
    ]);
    expect(relatedLiveTools("pending-requests").map((t) => t.slug)).toEqual([
      "unfollow-tracker",
    ]);
  });

  it("treats / and /analyze as the Unfollow Tracker tool", () => {
    const tracker = tools.find((tool) => tool.slug === "unfollow-tracker");
    expect(tracker).toBeDefined();
    expect(isToolActive(tracker!, "/")).toBe(true);
    expect(isToolActive(tracker!, "/analyze")).toBe(true);
    expect(isToolActive(tracker!, "/guide")).toBe(false);
  });

  it("treats /pending-requests as the Pending Requests tool", () => {
    const pending = tools.find((tool) => tool.slug === "pending-requests");
    expect(pending).toBeDefined();
    expect(isToolActive(pending!, "/pending-requests")).toBe(true);
    expect(isToolActive(pending!, "/")).toBe(false);
  });
});
