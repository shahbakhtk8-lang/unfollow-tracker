const USERNAME_RE = /^[a-zA-Z0-9._]{1,30}$/;

/**
 * Accepts a bare username, @username, or an Instagram profile URL.
 * Returns the normalized username or null if the input cannot be parsed.
 */
export function parseInstagramUsername(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let candidate = trimmed;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "instagram.com" || host === "instagr.am") {
      const parts = url.pathname.split("/").filter(Boolean);
      candidate = parts[0] ?? "";
    }
  } catch {
    // Not a URL — treat as username / @username.
  }

  candidate = candidate.replace(/^@+/, "").replace(/\/+$/, "");
  if (!USERNAME_RE.test(candidate)) return null;
  return candidate.toLowerCase();
}
