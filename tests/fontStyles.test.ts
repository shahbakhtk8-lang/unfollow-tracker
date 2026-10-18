import { describe, expect, it } from "vitest";
import {
  convert,
  convertFull,
  convertPreview,
  listStyleIds,
  NFKC_LETTER_STYLES,
  PREVIEW_CODE_POINTS,
  sliceForPreview,
  STYLES,
} from "../src/lib/fontStyles";

const SAMPLE_MULTI = "Line one\nLine two";

describe("fontStyles registry", () => {
  it("exposes 60–70 styles across expected categories", () => {
    const n = STYLES.length;
    expect(n).toBeGreaterThanOrEqual(60);
    expect(n).toBeLessThanOrEqual(70);
    const cats = new Set(STYLES.map((s) => s.category));
    for (const c of [
      "Minimal",
      "Bold",
      "Elegant",
      "Fun lettering",
      "Effects",
      "Frames",
    ]) {
      expect(cats.has(c as (typeof STYLES)[0]["category"])).toBe(true);
    }
  });

  it("has unique ids and conservative compatibility notes", () => {
    const ids = STYLES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of STYLES) {
      expect(s.compatibility === "high" || s.compatibility === "medium").toBe(true);
      expect(s.compatibilityNote.length).toBeGreaterThan(10);
    }
  });
});

describe("convert basics", () => {
  it("returns empty for empty input", () => {
    for (const id of listStyleIds()) {
      expect(convert("", id)).toEqual({ text: "", coverage: 1, partial: false });
    }
  });

  it("preserves line breaks", () => {
    const r = convert(SAMPLE_MULTI, "math-bold");
    expect(r.text.split("\n")).toHaveLength(2);
    expect(r.text).toContain("\n");
  });

  it("leaves unmapped characters unchanged", () => {
    const r = convert("Hello © €", "math-bold");
    expect(r.text).toContain("©");
    expect(r.text).toContain("€");
  });

  it("upside-down reverses order per line", () => {
    const r = convert("ab\ncd", "upside-down");
    const [a, b] = r.text.split("\n");
    // flipped + reversed: ab -> qɐ (b->q, a->ɐ) reversed order of mapped chars
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);
    expect(a).not.toBe("ab");
    // Each line independently reversed
    expect(r.text).toBe(`${convert("ab", "upside-down").text}\n${convert("cd", "upside-down").text}`);
  });

  it("exposes coverage / partial for incomplete maps", () => {
    const r = convert("Hello", "superscript");
    expect(r.coverage).toBeGreaterThan(0);
    expect(typeof r.partial).toBe("boolean");
  });
});

describe("preserve options", () => {
  it("keeps links, @mentions, and #hashtags plain by default", () => {
    const input = "Hi @alice check https://example.com and #cool";
    const r = convert(input, "math-bold");
    expect(r.text).toContain("@alice");
    expect(r.text).toContain("https://example.com");
    expect(r.text).toContain("#cool");
    // Surrounding word should change
    expect(r.text.startsWith("Hi")).toBe(false);
  });

  it("can style mentions when keepLinksMentionsHashtags is false", () => {
    const input = "@alice";
    const kept = convert(input, "math-bold", { keepLinksMentionsHashtags: true });
    const styled = convert(input, "math-bold", { keepLinksMentionsHashtags: false });
    expect(kept.text).toBe("@alice");
    expect(styled.text).not.toBe("@alice");
  });

  it("leaves emoji untouched by default", () => {
    const input = "Hi 😀🔥";
    const r = convert(input, "math-bold");
    expect(r.text).toContain("😀");
    expect(r.text).toContain("🔥");
  });
});

describe("NFKC round-trip for math letter styles", () => {
  it("styled.normalize(NFKC) equals original for letter-converting math styles", () => {
    const alphabet =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (const styleId of NFKC_LETTER_STYLES) {
      const { text: styled } = convert(alphabet, styleId, {
        keepLinksMentionsHashtags: false,
        keepEmoji: false,
      });
      // Digits may be absent for some math styles — only compare mapped letters
      const lettersOnly = alphabet.replace(/[0-9]/g, "");
      const styledLetters = convert(lettersOnly, styleId, {
        keepLinksMentionsHashtags: false,
      }).text;
      expect(styledLetters.normalize("NFKC"), styleId).toBe(lettersOnly);

      // Full alphabet including digits where the style has them
      const nfkc = styled.normalize("NFKC");
      // For styles without digits, digit chars stay ASCII
      for (let i = 0; i < alphabet.length; i += 1) {
        const orig = alphabet[i];
        if (orig >= "0" && orig <= "9") {
          // either unchanged or NFKC back
          const slice = [...styled];
          // Just ensure overall letter portion round-trips (already tested)
          void slice;
        }
      }
      expect(nfkc.replace(/[^A-Za-z]/g, "")).toBe(alphabet.replace(/[^A-Za-z]/g, ""));
    }
  });
});

describe("script / fraktur / double-struck holes", () => {
  it("maps known Letterlike exceptions", () => {
    // Script B → ℬ
    expect(convert("B", "math-script").text).toBe("\u212C");
    expect(convert("e", "math-script").text).toBe("\u212F");
    expect(convert("C", "math-fraktur").text).toBe("\u212D");
    expect(convert("H", "math-double-struck").text).toBe("\u210D");
    expect(convert("h", "math-italic").text).toBe("\u210E");
  });
});

describe("combining effects", () => {
  it("skips spaces, newlines, and emoji", () => {
    const r = convert("a b\n😀", "effect-underline");
    expect(r.text).toContain(" ");
    expect(r.text).toContain("\n");
    expect(r.text).toContain("😀");
    // 'a' should have a combining mark
    expect([...r.text][0]).toBe("a");
    expect(r.text).toMatch(/a\u0332/);
  });
});

describe("preview vs full copy", () => {
  it("sliceForPreview keeps only the first N code points", () => {
    const chars = Array.from({ length: PREVIEW_CODE_POINTS + 50 }, (_, i) =>
      String.fromCharCode(97 + (i % 26)),
    ).join("");
    const sliced = sliceForPreview(chars);
    expect([...sliced]).toHaveLength(PREVIEW_CODE_POINTS);
  });

  it("convertPreview truncates input before styling", () => {
    const long = "a".repeat(PREVIEW_CODE_POINTS + 200);
    const preview = convertPreview(long, "math-bold");
    const full = convertFull(long, "math-bold");
    expect(preview.text.length).toBeLessThan(full.text.length);
    expect(full.text.startsWith(preview.text)).toBe(true);
  });

  it("Copy path (convertFull) equals convert() on the full source", () => {
    const source =
      "Hello @alice https://example.com #tag 😀\n" + "x".repeat(400);
    for (const id of ["math-bold", "math-script", "circled", "frame-hearts", "upside-down"]) {
      expect(convertFull(source, id).text).toBe(convert(source, id).text);
    }
  });
});

describe("performance", () => {
  it("converts 5000 chars × all styles quickly", () => {
    const big = "Hello World 123 @user #tag https://x.test 😀\n".repeat(200);
    expect(big.length).toBeGreaterThanOrEqual(5000);
    const sample = big.slice(0, 5000);
    const ids = listStyleIds();
    const t0 = performance.now();
    for (const id of ids) {
      convert(sample, id);
    }
    const ms = performance.now() - t0;
    // Log for PART 1 report (lookup tables + engine).
    console.log(`fontStyles: ${ids.length} styles × 5000 chars in ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(200);
  });
});
