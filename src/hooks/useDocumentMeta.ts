import { useEffect } from "react";

/** Sets document.title and upserts <meta name="description">. Restores on unmount. */
export function useDocumentMeta(title: string, description: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const existing = document.head.querySelector('meta[name="description"]');
    const meta = existing ?? document.createElement("meta");
    const created = !existing;
    const previousDescription = existing?.getAttribute("content") ?? null;

    if (created) {
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    return () => {
      document.title = previousTitle;
      if (created) {
        meta.remove();
        return;
      }
      if (previousDescription === null) {
        meta.removeAttribute("content");
      } else {
        meta.setAttribute("content", previousDescription);
      }
    };
  }, [title, description]);
}
