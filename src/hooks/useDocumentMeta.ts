import { useEffect } from "react";

function upsertJsonLd(id: string, data: Record<string, unknown>): () => void {
  const existing = document.getElementById(id);
  const script = existing instanceof HTMLScriptElement ? existing : document.createElement("script");
  const created = !existing;
  const previous = created ? null : script.textContent;
  if (created) {
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
  return () => {
    if (created) {
      script.remove();
      return;
    }
    script.textContent = previous;
  };
}

type DocumentMeta = {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  jsonLd?: Record<string, unknown>;
  jsonLdId?: string;
};

function upsertNamedMeta(name: string, content: string): () => void {
  const existing = document.head.querySelector(`meta[name="${name}"]`);
  const meta = existing ?? document.createElement("meta");
  const created = !existing;
  const previous = existing?.getAttribute("content") ?? null;
  if (created) {
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
  return () => {
    if (created) {
      meta.remove();
      return;
    }
    if (previous === null) meta.removeAttribute("content");
    else meta.setAttribute("content", previous);
  };
}

function upsertPropertyMeta(property: string, content: string): () => void {
  const existing = document.head.querySelector(`meta[property="${property}"]`);
  const meta = existing ?? document.createElement("meta");
  const created = !existing;
  const previous = existing?.getAttribute("content") ?? null;
  if (created) {
    meta.setAttribute("property", property);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
  return () => {
    if (created) {
      meta.remove();
      return;
    }
    if (previous === null) meta.removeAttribute("content");
    else meta.setAttribute("content", previous);
  };
}

function upsertLink(rel: string, href: string): () => void {
  const existing = document.head.querySelector(`link[rel="${rel}"]`);
  const link = existing ?? document.createElement("link");
  const created = !existing;
  const previous = existing?.getAttribute("href") ?? null;
  if (created) {
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
  return () => {
    if (created) {
      link.remove();
      return;
    }
    if (previous === null) link.removeAttribute("href");
    else link.setAttribute("href", previous);
  };
}

/** Sets document title, description, canonical, Open Graph, and Twitter tags. Restores on unmount. */
export function useDocumentMeta({
  title,
  description,
  canonical,
  image,
  imageAlt,
  imageWidth,
  imageHeight,
  jsonLd,
  jsonLdId = "home-jsonld",
}: DocumentMeta): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const restorers = [
      upsertNamedMeta("description", description),
      upsertNamedMeta("twitter:card", image ? "summary_large_image" : "summary"),
      upsertNamedMeta("twitter:title", title),
      upsertNamedMeta("twitter:description", description),
      upsertPropertyMeta("og:type", "website"),
      upsertPropertyMeta("og:site_name", "Unfollow Tracker"),
      upsertPropertyMeta("og:title", title),
      upsertPropertyMeta("og:description", description),
    ];

    if (canonical) restorers.push(upsertLink("canonical", canonical), upsertPropertyMeta("og:url", canonical));
    if (image) {
      restorers.push(
        upsertPropertyMeta("og:image", image),
        upsertNamedMeta("twitter:image", image),
      );
    }
    if (imageAlt) {
      restorers.push(
        upsertPropertyMeta("og:image:alt", imageAlt),
        upsertNamedMeta("twitter:image:alt", imageAlt),
      );
    }
    if (imageWidth) restorers.push(upsertPropertyMeta("og:image:width", String(imageWidth)));
    if (imageHeight) restorers.push(upsertPropertyMeta("og:image:height", String(imageHeight)));
    if (jsonLd) restorers.push(upsertJsonLd(jsonLdId, jsonLd));

    return () => {
      document.title = previousTitle;
      restorers.forEach((restore) => restore());
    };
  }, [title, description, canonical, image, imageAlt, imageWidth, imageHeight, jsonLd, jsonLdId]);
}
