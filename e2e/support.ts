import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test as base, expect, type Page, type Request } from "@playwright/test";

export const zipDir = path.join(process.cwd(), "e2e", ".generated");
export const shotDir = path.join(zipDir, "screenshots");

export function zipPath(name: string): string {
  return path.join(zipDir, name);
}

type Guard = {
  leaks: string[];
  crashes: string[];
  consoleErrors: string[];
};

function isAppHost(hostname: string): boolean {
  return hostname === "127.0.0.1" || hostname === "localhost";
}

function inspectRequest(req: Request, leaks: string[]) {
  let url: URL;
  try {
    url = new URL(req.url());
  } catch {
    leaks.push(`bad url ${req.url()}`);
    return;
  }
  const web = url.protocol === "http:" || url.protocol === "https:" || url.protocol === "ws:" || url.protocol === "wss:";
  if (web && !isAppHost(url.hostname)) {
    leaks.push(`external ${req.method()} ${req.url()}`);
  }
  if (req.url().toLowerCase().includes("test_user_")) {
    leaks.push(`username in url ${req.url()}`);
  }
  const body = req.postDataBuffer();
  if (!body || body.length === 0) return;
  if (body[0] === 0x50 && body[1] === 0x4b) {
    leaks.push(`zip body on ${req.method()} ${req.url()}`);
  }
  const text = body.toString("utf8");
  if (text.includes("test_user_") || text.includes("string_list_data") || text.includes("relationships_following")) {
    leaks.push(`export body on ${req.method()} ${req.url()}`);
  }
}

export const test = base.extend<Guard>({
  leaks: [
    async ({ page }, use) => {
      const leaks: string[] = [];
      const onRequest = (req: Request) => inspectRequest(req, leaks);
      const onDialog = (dialog: { type: () => string; message: () => string; dismiss: () => Promise<void> }) => {
        leaks.push(`dialog ${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
      };
      page.on("request", onRequest);
      page.on("dialog", onDialog);
      await use(leaks);
      expect(leaks, leaks.join("\n")).toEqual([]);
    },
    { auto: true },
  ],
  crashes: [
    async ({ page }, use) => {
      const crashes: string[] = [];
      page.on("pageerror", (error) => crashes.push(error.message));
      await use(crashes);
      expect(crashes, crashes.join("\n")).toEqual([]);
    },
    { auto: true },
  ],
  consoleErrors: [
    async ({ page }, use) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      await use(consoleErrors);
      expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function uploadZip(page: Page, name: string) {
  const input = page.locator('input[type="file"]');
  await input.evaluate((el: HTMLInputElement) => {
    el.value = "";
  });
  await input.setInputFiles(zipPath(name));
}

export async function saveSnapshot(page: Page) {
  await page.getByRole("button", { name: "Save current result to this device" }).click();
}

export function writeTiming(name: string, value: number) {
  mkdirSync(shotDir, { recursive: true });
  const file = path.join(zipDir, "timings.json");
  let current: Record<string, number> = {};
  try {
    current = JSON.parse(readFileSync(file, "utf8")) as Record<string, number>;
  } catch {
    current = {};
  }
  current[name] = value;
  writeFileSync(file, JSON.stringify(current, null, 2));
}
