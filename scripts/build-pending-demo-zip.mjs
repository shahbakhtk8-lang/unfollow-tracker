import { createWriteStream, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(
  root,
  "public",
  "demo",
  "connections",
  "followers_and_following",
  "pending_follow_requests.json",
);
const out = join(root, "public", "demo", "pending-requests-demo.zip");

const zip = new JSZip();
zip.file(
  "connections/followers_and_following/pending_follow_requests.json",
  readFileSync(source),
);

mkdirSync(dirname(out), { recursive: true });
const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
await new Promise((resolve, reject) => {
  const stream = createWriteStream(out);
  stream.on("finish", resolve);
  stream.on("error", reject);
  stream.end(buffer);
});

console.log("Wrote", out);
