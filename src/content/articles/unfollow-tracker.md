# How Analyze reads your Instagram export

Igunfollowed Analyze is the upload page for your official Instagram ZIP. It compares the followers list with the following list in that file so you can see who you follow that is not following you back. It does not log into Instagram and it does not read your password.

A **single current export** answers “who doesn’t follow me back right now.” It does **not** prove who recently unfollowed you. Accounts on that list may never have followed you. To see who left between two dates, save a snapshot or upload an older ZIP and a newer ZIP and use Compare.

## What the ZIP must contain

Look for `connections/followers_and_following/`. Analyze reads `following.json` (or `.html`) and `followers_1.json` (plus `followers_2.json` and so on if Instagram split a large list). JSON is easiest. HTML exports from the same Connections category also work.

If those files are missing, request a new export with **Followers and following** selected. The [export guide](/guide) walks through Accounts Center.

## What you can do on this page

| Feature | What it actually does |
|---|---|
| No Instagram password | You upload an official export. The site never asks for your login. |
| In-browser ZIP analysis | Your browser reads the archive in a background worker. The ZIP is not sent to our servers. |
| Not-follow-back list | People you follow who are not on your followers list in this export. |
| Mutuals and fans | Mutuals follow you and you follow them. Fans follow you and you do not follow them. |
| Compare two exports | Differences between an older and a newer followers list: who disappeared and who appeared. |
| Snapshots on this device | Optional copies of username lists in IndexedDB on this browser, so you can compare later. You can delete them here or by clearing site data. |
| CSV download | Saves the visible username list as a file on your device. |

## How comparison works

Use **Compare** with a saved snapshot, or turn on two-ZIP mode and drop an older export and a newer one. The Unfollowed tab is only filled when two lists exist. Username changes, deactivated accounts, and incomplete exports can look like unfollows even when they are not.

## Instagram Follower Health Ranges

These rows are informal examples, not official Instagram statistics and not a growth forecast. Use them only as a rough sense of scale after you have real counts from your own export.

| Account size | Informal daily unfollow example | Informal follow-back example |
|---|---|---|
| Followers under 1k | 1 – 2 per day | 10% – 20% |
| Followers 5k – 10k | 3 – 4 per day | 15% – 25% |
| Followers 10k – 50k | 5 – 10 per day | 20% – 30% |

If your daily unfollows are far above the example for your size, look at who is leaving in a two-export comparison rather than treating the table as a diagnosis.

The same ZIP can also list [pending follow requests](/pending-requests) you sent that were never accepted.

## Frequently Asked Questions

**Does one ZIP show who recently unfollowed me?**
No. One file shows who does not follow you back in that export. Recent unfollows need an older list and a newer list to compare.

**What files does Analyze need?**
`following.json` and `followers_1.json` (and extra follower parts if present) under Connections. JSON or HTML from that category both work.

**Why is the Unfollowed tab empty?**
That tab stays empty until you compare two exports or a snapshot plus a newer ZIP. A single upload fills Not back, Mutuals, and Fans instead.

**Can I upload JSON files instead of a ZIP?**
Yes, if they are the official followers and following files. A full ZIP from Accounts Center is usually simpler.

**What if the ZIP is huge or fails to parse?**
Keep the file zipped, do not rename folders inside it, and confirm Followers and following were included. Invalid or unrelated ZIPs show an error on this page. Step-by-step export help is on the [guide](/guide).
