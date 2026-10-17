#!/usr/bin/env node
/**
 * Run mobile Lighthouse against a preview path.
 * Usage: node scripts/lighthouse-path.mjs /instagram-font-generator
 * Env: LH_BASE (default http://127.0.0.1:4173), LH_OUT (default slug under lighthouse-reports/)
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const routePath = process.argv[2] || "/";
const base = (process.env.LH_BASE || "http://127.0.0.1:4173").replace(/\/$/, "");
const url = `${base}${routePath.startsWith("/") ? routePath : `/${routePath}`}`;
const slug =
  process.env.LH_OUT ||
  (routePath === "/" ? "home" : routePath.replace(/^\/+|\/+$/g, "").replaceAll("/", "-") || "page");
const outDir = path.join("lighthouse-reports", slug);
mkdirSync(outDir, { recursive: true });

const args = [
  url,
  "--only-categories=performance,accessibility,best-practices,seo",
  "--form-factor=mobile",
  "--screenEmulation.mobile",
  "--output=json",
  "--output=html",
  `--output-path=${path.join(outDir, "report")}`,
  '--chrome-flags=--headless=new --no-sandbox',
];

const result = spawnSync("npx", ["lighthouse", ...args], {
  stdio: "inherit",
  shell: true,
});
process.exit(result.status ?? 1);
