import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "e2e", ".generated");

const OLD_START = Date.parse("2022-01-01T00:00:00Z") / 1000;
const OLD_END = Date.parse("2026-08-10T00:00:00Z") / 1000;
const NEW_START = Date.parse("2026-08-16T00:00:00Z") / 1000;
const NEW_END = Date.parse("2026-09-27T00:00:00Z") / 1000;
const ZIP_DATE = new Date(2020, 5, 15, 12, 0, 0);

function range(start, end) {
  const out = [];
  for (let id = start; id <= end; id += 1) out.push(id);
  return out;
}

function username(id, width = 3) {
  return `test_user_${String(id).padStart(width, "0")}`;
}

function stamp(start, end, index, count) {
  if (count <= 1) return Math.floor(end);
  return Math.floor(start + ((end - start) * index) / (count - 1));
}

function followerItem(name, timestamp) {
  const entry = {
    href: `https://www.instagram.com/${String(name).toLowerCase()}/`,
    value: name,
  };
  if (timestamp != null) entry.timestamp = timestamp;
  return { string_list_data: [entry] };
}

function followingItem(name, timestamp) {
  const entry = {
    href: `https://www.instagram.com/${String(name).toLowerCase()}/`,
  };
  if (timestamp != null) entry.timestamp = timestamp;
  return { title: name, string_list_data: [entry] };
}

function dated(ids, start, end, width = 3) {
  return ids.map((id, index) => ({
    name: username(id, width),
    timestamp: stamp(start, end, index, ids.length),
  }));
}

function oldIds() {
  return {
    followers: range(0, 299),
    following: [...range(0, 199), ...range(300, 449)],
  };
}

function newIds() {
  const dropFollowers = new Set([...range(10, 29), ...range(200, 209)]);
  const dropFollowing = new Set(range(300, 304));
  const old = oldIds();
  return {
    followers: [...old.followers.filter((id) => !dropFollowers.has(id)), ...range(450, 469)],
    following: [...old.following.filter((id) => !dropFollowing.has(id)), ...range(450, 454)],
  };
}

function normalizeName(raw) {
  const trimmed = String(raw).trim().toLowerCase();
  if (!trimmed || trimmed === "instagram" || trimmed === "instagram user") return null;
  return trimmed;
}

function expectCounts(label, followerNames, followingNames, expected) {
  const followers = new Set(followerNames.map(normalizeName).filter(Boolean));
  const following = new Set(followingNames.map(normalizeName).filter(Boolean));
  let mutuals = 0;
  for (const name of following) if (followers.has(name)) mutuals += 1;
  const notBack = following.size - mutuals;
  const fans = followers.size - mutuals;
  const rate = following.size === 0 ? 0 : Math.round((mutuals / following.size) * 1000) / 10;
  const actual = {
    followers: followers.size,
    following: following.size,
    notBack,
    mutuals,
    fans,
    rate,
  };
  const keys = Object.keys(expected);
  for (const key of keys) {
    if (actual[key] !== expected[key]) {
      throw new Error(`${label} ${key}: expected ${expected[key]}, got ${actual[key]}`);
    }
  }
}

function htmlDoc(names) {
  const links = names
    .map((name) => `<a href="https://www.instagram.com/${name}/">${name}</a>`)
    .join("\n");
  return `<!DOCTYPE html><html><body>\n${links}\n</body></html>`;
}

function addJson(zip, entryPath, value, date) {
  zip.file(entryPath, JSON.stringify(value), date ? { date } : undefined);
}

async function writeZip(name, build) {
  const zip = new JSZip();
  build(zip);
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const filePath = path.join(outDir, name);
  writeFileSync(filePath, buffer);
  console.log(`Wrote ${filePath} (${buffer.length} bytes)`);
}

const old = oldIds();
const fresh = newIds();
const oldFollowers = dated(old.followers, OLD_START, OLD_END);
const oldFollowing = dated(old.following, OLD_START, OLD_END);
const newFollowers = dated(fresh.followers, OLD_START, OLD_END).map((entry) => {
  const id = Number(entry.name.slice("test_user_".length));
  if (id >= 450) {
    const index = id - 450;
    return { ...entry, timestamp: stamp(NEW_START, NEW_END, index, 20) };
  }
  return entry;
});
const newFollowing = dated(fresh.following, OLD_START, OLD_END).map((entry) => {
  const id = Number(entry.name.slice("test_user_".length));
  if (id >= 450) {
    const index = id - 450;
    return { ...entry, timestamp: stamp(NEW_START, NEW_END, index, 5) };
  }
  return entry;
});

const newFollowerNames = [
  ...newFollowers.map((entry) => entry.name),
  "test_user_001",
  "Test_User_007",
  "instagram",
];

expectCounts("OLD", oldFollowers.map((entry) => entry.name), oldFollowing.map((entry) => entry.name), {
  followers: 300,
  following: 350,
  notBack: 150,
  mutuals: 200,
  fans: 100,
  rate: 57.1,
});
expectCounts("NEW", newFollowerNames, newFollowing.map((entry) => entry.name), {
  followers: 290,
  following: 350,
  notBack: 165,
  mutuals: 185,
  fans: 105,
  rate: 52.9,
});

const oldOnly = new Set(oldFollowers.map((entry) => entry.name));
const newOnly = new Set(newFollowerNames.map(normalizeName).filter(Boolean));
let unfollowed = 0;
let gained = 0;
for (const name of oldOnly) if (!newOnly.has(name)) unfollowed += 1;
for (const name of newOnly) if (!oldOnly.has(name)) gained += 1;
if (unfollowed !== 30 || gained !== 20) {
  throw new Error(`Compare counts unfollowed ${unfollowed}, new ${gained}`);
}

function newFollowerRecords(withTimestamps) {
  const records = newFollowers.map((entry) =>
    followerItem(entry.name, withTimestamps ? entry.timestamp : undefined),
  );
  const sampleStamp = withTimestamps ? newFollowers[0].timestamp : undefined;
  records.push(followerItem("test_user_001", sampleStamp));
  records.push(followerItem("Test_User_007", sampleStamp));
  records.push(followerItem("instagram", sampleStamp));
  return records;
}

function followingRecords(entries, withTimestamps) {
  return {
    relationships_following: entries.map((entry) =>
      followingItem(entry.name, withTimestamps ? entry.timestamp : undefined),
    ),
  };
}

function splitFollowers(records) {
  const mid = Math.ceil(records.length / 2);
  return [records.slice(0, mid), records.slice(mid)];
}

mkdirSync(outDir, { recursive: true });

await writeZip("old.zip", (zip) => {
  addJson(
    zip,
    "connections/followers_and_following/followers_1.json",
    oldFollowers.map((entry) => followerItem(entry.name, entry.timestamp)),
  );
  addJson(
    zip,
    "connections/followers_and_following/following.json",
    followingRecords(oldFollowing, true),
  );
});

await writeZip("new.zip", (zip) => {
  const [first, second] = splitFollowers(newFollowerRecords(true));
  addJson(zip, "connections/followers_and_following/followers_1.json", first);
  addJson(zip, "connections/followers_and_following/followers_2.json", second);
  addJson(
    zip,
    "connections/followers_and_following/following.json",
    followingRecords(newFollowing, true),
  );
  zip.file("personal_information/note.txt", "Fake note. Not a follower list.\n");
});

await writeZip("new-same-date.zip", (zip) => {
  const [first, second] = splitFollowers(newFollowerRecords(true));
  addJson(zip, "connections/followers_and_following/followers_1.json", first);
  addJson(zip, "connections/followers_and_following/followers_2.json", second);
  addJson(
    zip,
    "connections/followers_and_following/following.json",
    followingRecords(newFollowing, true),
  );
  zip.file("personal_information/note.txt", "Fake note. Not a follower list.\n");
});

await writeZip("no-timestamps.zip", (zip) => {
  const [first, second] = splitFollowers(newFollowerRecords(false));
  addJson(zip, "connections/followers_and_following/followers_1.json", first, ZIP_DATE);
  addJson(zip, "connections/followers_and_following/followers_2.json", second, ZIP_DATE);
  addJson(
    zip,
    "connections/followers_and_following/following.json",
    followingRecords(newFollowing, false),
    ZIP_DATE,
  );
  zip.file("personal_information/note.txt", "Fake note. Not a follower list.\n", { date: ZIP_DATE });
});

await writeZip("old-html.zip", (zip) => {
  zip.file(
    "connections/followers_and_following/followers_1.html",
    htmlDoc(oldFollowers.map((entry) => entry.name)),
  );
  zip.file(
    "connections/followers_and_following/following.html",
    htmlDoc(oldFollowing.map((entry) => entry.name)),
  );
});

await writeZip("bad-missing.zip", (zip) => {
  zip.file("personal_information/note.txt", "No follower files here.\n");
});

writeFileSync(path.join(outDir, "bad-not-zip.zip"), "this is plain text, not a zip archive\n", "utf8");
console.log(`Wrote ${path.join(outDir, "bad-not-zip.zip")}`);

await writeZip("empty-lists.zip", (zip) => {
  addJson(zip, "connections/followers_and_following/followers_1.json", []);
  addJson(zip, "connections/followers_and_following/following.json", {
    relationships_following: [],
  });
});

const bigIds = range(0, 19999);
const bigFollowers = dated(bigIds, OLD_START, OLD_END, 5);
const bigFollowing = dated(bigIds, OLD_START, OLD_END, 5);
await writeZip("big.zip", (zip) => {
  addJson(
    zip,
    "connections/followers_and_following/followers_1.json",
    bigFollowers.map((entry) => followerItem(entry.name, entry.timestamp)),
  );
  addJson(
    zip,
    "connections/followers_and_following/following.json",
    followingRecords(bigFollowing, true),
  );
});
