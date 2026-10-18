import { describe, expect, it } from "vitest";
import {
  hasContactLikeDetails,
  shouldShowReadabilityHint,
  styledLetterShare,
} from "../src/components/fontgen/readability";

describe("readabilityHint", () => {
  it("detects URL, email, and phone-like strings", () => {
    expect(hasContactLikeDetails("see https://example.com")).toBe(true);
    expect(hasContactLikeDetails("mail me at hi@example.com")).toBe(true);
    expect(hasContactLikeDetails("call +1 (555) 123-4567")).toBe(true);
    expect(hasContactLikeDetails("just vibes")).toBe(false);
  });

  it("computes stylable letter share excluding preserved spans", () => {
    expect(styledLetterShare("Hello", true)).toBe(1);
    // All letters inside a mention stay plain
    expect(styledLetterShare("@alice", true)).toBe(0);
    // Mixed: Hello stylable, alice plain
    const share = styledLetterShare("Hello @alice", true);
    expect(share).toBeGreaterThan(0.4);
    expect(share).toBeLessThan(1);
  });

  it("shows for bio/name when contact-like or mostly stylable", () => {
    expect(shouldShowReadabilityHint("Hello world", "bio")).toBe(true);
    expect(shouldShowReadabilityHint("https://x.test", "name")).toBe(true);
    expect(shouldShowReadabilityHint("Hello world", "caption")).toBe(false);
    expect(shouldShowReadabilityHint("", "bio")).toBe(false);
  });
});
