import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatFollowDate(timestamp?: number): string | null {
  if (timestamp == null || Number.isNaN(timestamp)) return null;
  const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function exportUsernamesCsv(
  users: { username: string; timestamp?: number }[],
  label: string,
) {
  const header = "username,followed_at\n";
  const body = users
    .map((user) => {
      const iso =
        user.timestamp == null
          ? ""
          : new Date(user.timestamp < 1e12 ? user.timestamp * 1000 : user.timestamp).toISOString();
      return `${user.username},${iso}`;
    })
    .join("\n");
  downloadTextFile(`${label.replace(/\s+/g, "-").toLowerCase()}.csv`, header + body);
}
