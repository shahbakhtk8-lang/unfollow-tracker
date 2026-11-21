/**
 * Builds Threads demo ZIPs for local/testing (same JSZip approach as build-demo-zip.mjs).
 * Paths use threads/… so parseThreadsZip detection matches.
 *
 * Outputs:
 *   public/demo/threads-demo.zip
 *   public/demo/threads-demo-later.zip  (5 fewer followers → unfollow diff)
 */
import { createWriteStream, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "demo");
const fixtureDir = join(root, "public", "demo", "threads");

const BASE_TS = 1_700_000_000;

function entry(username, i) {
  return {
    title: username,
    media_list_data: [],
    string_list_data: [
      {
        href: `https://www.threads.net/@${username}`,
        value: username,
        timestamp: BASE_TS + i * 3600,
      },
    ],
  };
}

function wrapFollowers(usernames) {
  return {
    text_post_app_text_post_app_followers: usernames.map((u, i) => entry(u, i)),
  };
}

function wrapFollowing(usernames) {
  return {
    text_post_app_text_post_app_following: usernames.map((u, i) => entry(u, i + 100)),
  };
}

function wrapBlocked(usernames) {
  // Excluded by parser — accounts YOU blocked/unfollowed, not people who left you.
  return {
    text_post_app_text_post_app_blocked_and_unfollowed: usernames.map((u, i) =>
      entry(u, i + 200),
    ),
  };
}

/** Following: demo_follow_01 … demo_follow_40 */
const following = Array.from({ length: 40 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return `demo_follow_${n}`;
});

/** Followers (first export): first 30 of following + 5 fans → 35 total */
const fans = ["demo_fan_01", "demo_fan_02", "demo_fan_03", "demo_fan_04", "demo_fan_05"];
const followersFirst = [...following.slice(0, 30), ...fans];

/**
 * Later export: drop 5 followers (3 mutuals + 2 fans) for unfollow testing.
 * Removed: demo_follow_01, demo_follow_02, demo_follow_03, demo_fan_01, demo_fan_02
 */
const removed = [
  "demo_follow_01",
  "demo_follow_02",
  "demo_follow_03",
  "demo_fan_01",
  "demo_fan_02",
];
const followersLater = followersFirst.filter((u) => !removed.includes(u));

const blocked = ["demo_blocked_01", "demo_blocked_02", "demo_blocked_03"];

async function writeZip(filename, followers, followingList) {
  const zip = new JSZip();
  const followersJson = JSON.stringify(wrapFollowers(followers), null, 2);
  const followingJson = JSON.stringify(wrapFollowing(followingList), null, 2);
  const blockedJson = JSON.stringify(wrapBlocked(blocked), null, 2);

  zip.file("threads/followers.json", followersJson);
  zip.file("threads/following.json", followingJson);
  zip.file("threads/blocked_and_unfollowed.json", blockedJson);

  mkdirSync(outDir, { recursive: true });
  mkdirSync(fixtureDir, { recursive: true });

  // Keep loose JSON copies for inspection (same as Instagram demo folder pattern).
  if (filename === "threads-demo.zip") {
    writeFileSync(join(fixtureDir, "followers.json"), followersJson);
    writeFileSync(join(fixtureDir, "following.json"), followingJson);
    writeFileSync(join(fixtureDir, "blocked_and_unfollowed.json"), blockedJson);
  }

  const out = join(outDir, filename);
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await new Promise((resolve, reject) => {
    const stream = createWriteStream(out);
    stream.on("finish", resolve);
    stream.on("error", reject);
    stream.end(buffer);
  });
  console.log("Wrote", out);
  return out;
}

await writeZip("threads-demo.zip", followersFirst, following);
await writeZip("threads-demo-later.zip", followersLater, following);

console.log(
  JSON.stringify(
    {
      first: {
        followers: followersFirst.length,
        following: following.length,
        mutuals: 30,
        notFollowingBack: 10,
        fans: 5,
        blockedPresentButExcluded: blocked,
      },
      later: {
        followers: followersLater.length,
        following: following.length,
        removedFollowers: removed,
        expectedUnfollowed: removed,
      },
    },
    null,
    2,
  ),
);
