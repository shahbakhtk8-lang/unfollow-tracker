import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyDocumentMeta,
  toCanonicalUrl,
} from "../src/hooks/useDocumentMeta";

type FakeEl = {
  tagName: string;
  id: string;
  type?: string;
  textContent: string | null;
  attrs: Record<string, string>;
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  removeAttribute(name: string): void;
  remove(): void;
};

function createFakeDocument() {
  const children: FakeEl[] = [];

  const makeEl = (tagName: string): FakeEl => {
    const el: FakeEl = {
      tagName: tagName.toUpperCase(),
      id: "",
      textContent: null,
      attrs: {},
      setAttribute(name, value) {
        el.attrs[name] = value;
        if (name === "id") el.id = value;
      },
      getAttribute(name) {
        return Object.prototype.hasOwnProperty.call(el.attrs, name) ? el.attrs[name]! : null;
      },
      removeAttribute(name) {
        delete el.attrs[name];
      },
      remove() {
        const idx = children.indexOf(el);
        if (idx >= 0) children.splice(idx, 1);
      },
    };
    return el;
  };

  const head = {
    children,
    querySelector(selector: string): FakeEl | null {
      const nameMatch = /^meta\[name="([^"]+)"\]$/.exec(selector);
      if (nameMatch) {
        return (
          children.find(
            (c) => c.tagName === "META" && c.getAttribute("name") === nameMatch[1],
          ) ?? null
        );
      }
      const propMatch = /^meta\[property="([^"]+)"\]$/.exec(selector);
      if (propMatch) {
        return (
          children.find(
            (c) => c.tagName === "META" && c.getAttribute("property") === propMatch[1],
          ) ?? null
        );
      }
      const relMatch = /^link\[rel="([^"]+)"\]$/.exec(selector);
      if (relMatch) {
        return (
          children.find(
            (c) => c.tagName === "LINK" && c.getAttribute("rel") === relMatch[1],
          ) ?? null
        );
      }
      return null;
    },
    appendChild(el: FakeEl) {
      children.push(el);
      return el;
    },
  };

  const doc = {
    title: "",
    head,
    createElement(tag: string) {
      return makeEl(tag);
    },
    getElementById(id: string) {
      return children.find((c) => c.id === id) ?? null;
    },
  };

  return { doc, children };
}

describe("toCanonicalUrl", () => {
  it("joins SITE_URL with path, strips trailing slash, query, and hash", () => {
    expect(toCanonicalUrl("/")).toBe("https://igunfollowed.com");
    expect(toCanonicalUrl("/instagram-font-generator")).toBe(
      "https://igunfollowed.com/instagram-font-generator",
    );
    expect(toCanonicalUrl("/guide/")).toBe("https://igunfollowed.com/guide");
    expect(toCanonicalUrl("/about?x=1#top")).toBe("https://igunfollowed.com/about");
    expect(toCanonicalUrl("https://igunfollowed.com/privacy/")).toBe(
      "https://igunfollowed.com/privacy",
    );
  });
});

describe("applyDocumentMeta", () => {
  const originalDocument = globalThis.document;
  let children: FakeEl[];

  beforeEach(() => {
    const { doc, children: kids } = createFakeDocument();
    children = kids;
    // @ts-expect-error test double for document
    globalThis.document = doc;
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  it("upserts canonical and og:url for the route", () => {
    applyDocumentMeta({
      title: "Font Gen",
      description: "Desc",
      canonical: "/instagram-font-generator",
    });

    const canonicals = children.filter(
      (c) => c.tagName === "LINK" && c.getAttribute("rel") === "canonical",
    );
    const ogUrls = children.filter(
      (c) => c.tagName === "META" && c.getAttribute("property") === "og:url",
    );
    expect(canonicals).toHaveLength(1);
    expect(ogUrls).toHaveLength(1);
    expect(canonicals[0]!.getAttribute("href")).toBe(
      "https://igunfollowed.com/instagram-font-generator",
    );
    expect(ogUrls[0]!.getAttribute("content")).toBe(
      "https://igunfollowed.com/instagram-font-generator",
    );
    expect(document.title).toBe("Font Gen");
    expect(
      children.find((c) => c.getAttribute("property") === "og:title")?.getAttribute("content"),
    ).toBe("Font Gen");
    expect(
      children.find((c) => c.getAttribute("name") === "twitter:title")?.getAttribute("content"),
    ).toBe("Font Gen");
  });

  it("does not duplicate tags when meta is reapplied for another route", () => {
    const restoreA = applyDocumentMeta({
      title: "Home",
      description: "Home desc",
      canonical: "/",
    });
    const restoreB = applyDocumentMeta({
      title: "Guide",
      description: "Guide desc",
      canonical: "/guide",
    });

    const canonicals = () =>
      children.filter((c) => c.tagName === "LINK" && c.getAttribute("rel") === "canonical");
    const ogUrls = () =>
      children.filter((c) => c.tagName === "META" && c.getAttribute("property") === "og:url");

    expect(canonicals()).toHaveLength(1);
    expect(ogUrls()).toHaveLength(1);
    expect(canonicals()[0]!.getAttribute("href")).toBe("https://igunfollowed.com/guide");
    expect(ogUrls()[0]!.getAttribute("content")).toBe("https://igunfollowed.com/guide");
    expect(document.title).toBe("Guide");

    restoreB();
    expect(canonicals()).toHaveLength(1);
    expect(canonicals()[0]!.getAttribute("href")).toBe("https://igunfollowed.com");

    restoreA();
    expect(canonicals()).toHaveLength(0);
    expect(ogUrls()).toHaveLength(0);
  });

  it("restores previous title and removes created tags on cleanup", () => {
    document.title = "Before";
    const restore = applyDocumentMeta({
      title: "Temp",
      description: "Temp desc",
      canonical: "/contact",
    });
    expect(document.title).toBe("Temp");
    expect(
      children.some((c) => c.tagName === "LINK" && c.getAttribute("rel") === "canonical"),
    ).toBe(true);

    restore();
    expect(document.title).toBe("Before");
    expect(
      children.some((c) => c.tagName === "LINK" && c.getAttribute("rel") === "canonical"),
    ).toBe(false);
    expect(
      children.some((c) => c.tagName === "META" && c.getAttribute("property") === "og:url"),
    ).toBe(false);
  });
});
