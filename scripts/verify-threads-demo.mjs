/**
 * Regenerates Threads demo ZIPs then runs the Vitest suite that asserts
 * detector + insights + unfollow diff numbers.
 *
 *   node scripts/build-threads-demo-zip.mjs
 *   npx vitest run tests/threadsDemoZip.test.ts
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const build = spawnSync(process.execPath, [join(root, "scripts", "build-threads-demo-zip.mjs")], {
  cwd: root,
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status ?? 1);

const test = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["vitest", "run", "tests/threadsDemoZip.test.ts"],
  { cwd: root, stdio: "inherit", shell: true },
);
process.exit(test.status ?? 1);
