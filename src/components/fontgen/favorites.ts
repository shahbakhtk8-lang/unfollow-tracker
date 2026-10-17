import { FAVORITES_STORAGE_KEY } from "./constants";

export function loadFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function saveFavoriteIds(ids: string[]): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Quota / private mode — ignore.
  }
}

export function toggleFavoriteId(ids: string[], styleId: string): string[] {
  if (ids.includes(styleId)) return ids.filter((id) => id !== styleId);
  return [...ids, styleId];
}
