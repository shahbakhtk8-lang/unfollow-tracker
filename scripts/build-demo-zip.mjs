import { createWriteStream, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = join(root, "public", "demo", "connections", "followers_and_following");
const out = join(root, "public", "demo", "instagram-demo.zip");

const files = ["following.json", "followers_1.json"];
const zip = new JSZip();

for (const name of files) {
  const path = join(base, name);
  zip.file(`connections/followers_and_following/${name}`, readFileSync(path));
}

mkdirSync(dirname(out), { recursive: true });
const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
await new Promise((resolve, reject) => {
  const stream = createWriteStream(out);
  stream.on("finish", resolve);
  stream.on("error", reject);
  stream.end(buffer);
});

console.log("Wrote", out);
