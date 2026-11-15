import { describe, expect, it } from "vitest";
import { gridMakerJsonLd } from "../src/components/gridmaker/jsonLd";
import {
  INSTAGRAM_PROFILE_CROP,
  TILE_SIZES,
  clampCarouselSlides,
  exportZipName,
  gridFrame,
  imagePlacement,
  instagramProfileCrop,
  sourceRectForTile,
  tileFilename,
  tilesInPostingOrder,
  validateGridImage,
} from "../src/lib/instagramGrid";
import { isDraftArticle, loadArticle, splitArticleFaq } from "../src/lib/content";

function fakeFile(name: string, type: string, size = 1024): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe("instagram grid geometry", () => {
  it("sizes profile layouts to 3 columns at Instagram export pixels", () => {
    const square = gridFrame("profile", "3x3", 3, "1:1");
    expect(square).toMatchObject({
      cols: 3,
      rows: 3,
      tileW: 1080,
      tileH: 1080,
      frameW: 3240,
      frameH: 3240,
    });

    const portrait = gridFrame("profile", "3x2", 3, "3:4");
    expect(portrait).toMatchObject({
      cols: 3,
      rows: 2,
      tileW: 1080,
      tileH: 1440,
      frameW: 3240,
      frameH: 2880,
    });
  });

  it("sizes carousel slides in a single row", () => {
    const frame = gridFrame("carousel", "3x3", 7, "4:5");
    expect(frame).toMatchObject({
      cols: 7,
      rows: 1,
      tileW: 1080,
      tileH: 1350,
      frameW: 7560,
      frameH: 1350,
    });
    expect(clampCarouselSlides(1)).toBe(2);
    expect(clampCarouselSlides(99)).toBe(10);
  });

  it("posts profile tiles bottom-right first so Instagram shows top-left last", () => {
    const order = tilesInPostingOrder("profile", 3, 3);
    expect(order.map((t) => [t.col, t.row, t.fileIndex])).toEqual([
      [2, 2, 1],
      [1, 2, 2],
      [0, 2, 3],
      [2, 1, 4],
      [1, 1, 5],
      [0, 1, 6],
      [2, 0, 7],
      [1, 0, 8],
      [0, 0, 9],
    ]);
    expect(tileFilename(1)).toBe("tile_01.jpg");
    expect(tileFilename(9)).toBe("tile_09.jpg");
    expect(exportZipName("profile", "3x3", 5)).toBe("instagram-grid-3x3.zip");
  });

  it("numbers carousel slides left to right", () => {
    const order = tilesInPostingOrder("carousel", 4, 1);
    expect(order.map((t) => [t.col, t.fileIndex])).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ]);
    expect(exportZipName("carousel", "3x3", 4)).toBe("instagram-carousel-4.zip");
  });

  it("center-crops 1:1 and 4:5 tiles to Instagram’s 3:4 profile thumbnail", () => {
    const square = TILE_SIZES["1:1"];
    const crop1 = instagramProfileCrop(square.width, square.height);
    expect(crop1.h).toBe(1080);
    expect(crop1.w / crop1.h).toBeCloseTo(INSTAGRAM_PROFILE_CROP, 5);
    expect(crop1.x).toBeCloseTo((1080 - crop1.w) / 2, 5);
    expect(crop1.y).toBe(0);

    const portrait = TILE_SIZES["4:5"];
    const crop45 = instagramProfileCrop(portrait.width, portrait.height);
    expect(crop45.w / crop45.h).toBeCloseTo(INSTAGRAM_PROFILE_CROP, 5);
    expect(crop45.x).toBeGreaterThan(0);

    const native = TILE_SIZES["3:4"];
    expect(instagramProfileCrop(native.width, native.height)).toEqual({
      x: 0,
      y: 0,
      w: 1080,
      h: 1440,
    });
  });

  it("covers the frame at zoom 1 and zooms from center", () => {
    const frame = gridFrame("profile", "3x3", 3, "1:1");
    const cover = imagePlacement(2000, 1000, frame, { zoom: 1, panX: 0, panY: 0 });
    expect(cover.h).toBeCloseTo(frame.frameH, 5);
    expect(cover.w).toBeGreaterThan(frame.frameW);
    expect(cover.y).toBeCloseTo(0, 5);

    const zoomed = imagePlacement(2000, 1000, frame, { zoom: 2, panX: 0, panY: 0 });
    expect(zoomed.scale).toBeCloseTo(cover.scale * 2, 5);

    const panned = imagePlacement(2000, 1000, frame, { zoom: 2, panX: 1, panY: 0 });
    expect(panned.x).toBeCloseTo(0, 5);
  });

  it("maps tile 0,0 to the top-left of the covered image", () => {
    const frame = gridFrame("profile", "3x1", 3, "1:1");
    const src = sourceRectForTile(3240, 1080, frame, { zoom: 1, panX: 0, panY: 0 }, 0, 0);
    expect(src.x).toBeCloseTo(0, 5);
    expect(src.y).toBeCloseTo(0, 5);
    expect(src.w).toBeCloseTo(1080, 5);
    expect(src.h).toBeCloseTo(1080, 5);
  });
});

describe("instagram grid image validation", () => {
  it("accepts jpg/png/webp under 25MB and rejects HEIC or huge files", () => {
    expect(validateGridImage(fakeFile("shot.jpg", "image/jpeg"))).toBeNull();
    expect(validateGridImage(fakeFile("shot.png", "image/png"))).toBeNull();
    expect(validateGridImage(fakeFile("shot.webp", "image/webp"))).toBeNull();
    expect(validateGridImage(fakeFile("shot.heic", "image/heic"))).toMatch(/HEIC/i);
    expect(validateGridImage(fakeFile("notes.pdf", "application/pdf"))).toMatch(/JPG/i);
    expect(validateGridImage(fakeFile("huge.jpg", "image/jpeg", 26 * 1024 * 1024))).toMatch(/25 MB/);
  });
});

describe("instagram-grid-maker article", () => {
  const expectedFaqs = [
    "Is Instagram grid maker free?",
    "How do I split a photo into 9 for Instagram?",
    "Do you upload or store my photos?",
    "Which file types can I use?",
    "Will the grid line up on Instagram?",
    "Why does my photo look cropped or soft?",
    "How do I download the tiles on my phone?",
    "Can I split one image into a seamless Instagram carousel?",
    "Does posting a grid affect my reach or the algorithm?",
    "Can I use this tool for Highlight covers or Reels cover images too?",
    "What happens to my grid if Instagram changes the crop ratio again?",
  ];

  it("is published with FAQ, posting-order guidance, and tool cross-links", () => {
    const source = loadArticle("instagram-grid-maker");
    expect(source).toBeTruthy();
    expect(isDraftArticle(source!)).toBe(false);
    expect(source).toContain("](/)");
    expect(source).not.toContain("](/pending-requests)");
    expect(source).toContain("](/instagram-font-generator)");
    expect(source).toContain("](/instagram-highlights-viewer)");
    expect(source).toMatch(/3:4|3 × 4|3×4/);
    expect(source.toLowerCase()).toContain("bottom right");
    const { faqItems } = splitArticleFaq(source!);
    expect(faqItems.map((item) => item.question)).toEqual(expectedFaqs);
    expect(faqItems[0]?.answer).toMatch(/fully free/i);
  });

  it("feeds those exact FAQ Q&As into JSON-LD FAQPage", () => {
    const graph = gridMakerJsonLd()["@graph"] as Array<Record<string, unknown>>;
    const faq = graph.find((node) => node["@type"] === "FAQPage");
    const entities = faq?.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>;
    expect(entities.map((item) => item.name)).toEqual(expectedFaqs);
    expect(entities[2]?.acceptedAnswer.text).toMatch(/nothing is sent to a server/i);
    const app = graph.find((node) => node["@type"] === "SoftwareApplication");
    expect(app?.image).toBe("https://igunfollowed.com/images/instagram-grid-maker-featured.jpg");
  });
});
