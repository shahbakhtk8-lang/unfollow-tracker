import { describe, expect, it } from "vitest";
import { relatedLiveTools, tools } from "../src/content/tools";

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
});
