import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDebouncedCallback } from "use-debounce";
import { Download, FileArchive, GitCompare, ListChecks, Sparkles, Trash2 } from "lucide-react";
import { ZipDropzone } from "@/components/analyzer/ZipDropzone";
import { ParseProgressBar } from "@/components/analyzer/ParseProgressBar";
import { StatCard } from "@/components/analyzer/StatCard";
import { TwoZipPanel } from "@/components/analyzer/TwoZipPanel";
import { VirtualUserList } from "@/components/analyzer/VirtualUserList";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { SITE_URL } from "@/content/seo";
import {
  buildThreadsJsonLd,
  THREADS_FEATURED_IMAGE_ALT,
  THREADS_FEATURED_IMAGE_HEIGHT,
  THREADS_FEATURED_IMAGE_PATH,
  THREADS_FEATURED_IMAGE_URL,
  THREADS_FEATURED_IMAGE_WIDTH,
  THREADS_META_DESCRIPTION,
  THREADS_META_TITLE,
} from "@/content/threadsSeo";
import {
  deleteThreadsSnapshot,
  getThreadsSnapshot,
  listThreadsSnapshots,
  MAX_THREADS_SNAPSHOTS,
  saveThreadsSnapshot,
  updateThreadsSnapshotLabel,
  type ThreadsStoredSnapshot,
} from "@/db/threadsSnapshots";
import { compareTwoExports, type TwoZipExport } from "@/lib/compareTwoExports";
import { diffSnapshots, type SnapshotDiff } from "@/lib/diff";
import { parseThreadsZipFile } from "@/lib/parseClient";
import type { ParseProgress, ParseResult } from "@/lib/parseZip";
import type { Insights } from "@/lib/sets";
import { exportUsernamesCsv, formatNumber, formatSnapshotDate } from "@/lib/utils";

type ResultTab =
  | "notFollowingBack"
  | "mutuals"
  | "fans"
  | "unfollowed"
  | "newFollowers"
  | "allFollowers"
  | "allFollowing";

type SortMode = "az" | "za";

type ParsedExport = TwoZipExport & {
  insights: Insights;
  followingUsernames: string[];
  followingTimestamps: Record<string, number>;
};

function fromResult(fileName: string, result: ParseResult): ParsedExport {
  return {
    fileName,
    insights: result.insights,
    followerUsernames: result.followerUsernames,
    followingUsernames: result.followingUsernames,
    followerTimestamps: result.followerTimestamps,
    followingTimestamps: result.followingTimestamps,
    exportDate: result.exportDate,
    exportDateSource: result.exportDateSource,
  };
}

const threadsProfileUrl = (username: string) => `https://www.threads.net/@${username}`;

export default function ThreadsUnfollowTrackerPage() {
  const jsonLd = useMemo(() => buildThreadsJsonLd(), []);
  useDocumentMeta({
    title: THREADS_META_TITLE,
    description: THREADS_META_DESCRIPTION,
    canonical: `${SITE_URL}/threads-unfollow-tracker`,
    image: THREADS_FEATURED_IMAGE_URL,
    imageAlt: THREADS_FEATURED_IMAGE_ALT,
    imageWidth: THREADS_FEATURED_IMAGE_WIDTH,
    imageHeight: THREADS_FEATURED_IMAGE_HEIGHT,
    jsonLd,
    jsonLdId: "threads-unfollow-jsonld",
  });

  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<ParsedExport | null>(null);
  const [diff, setDiff] = useState<SnapshotDiff | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>("notFollowingBack");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("az");
  const [twoZip, setTwoZip] = useState(false);
  const [zipA, setZipA] = useState<ParsedExport | null>(null);
  const [zipB, setZipB] = useState<ParsedExport | null>(null);
  const [compareId, setCompareId] = useState<number | null>(null);
  const [snapshots, setSnapshots] = useState<ThreadsStoredSnapshot[]>([]);
  const [snapshotKey, setSnapshotKey] = useState(0);

  const debounceSearch = useDebouncedCallback((v: string) => setDebouncedSearch(v), 200);

  const refreshSnapshots = () => {
    void listThreadsSnapshots().then(setSnapshots);
  };

  useEffect(() => {
    refreshSnapshots();
  }, [snapshotKey]);

  const runParse = async (file: File): Promise<ParsedExport> => {
    const result = await parseThreadsZipFile(file, (p) => setProgress(p));
    return fromResult(file.name, result);
  };

  const applySingle = async (file: File) => {
    setParsing(true);
    setError(null);
    setProgress({ stage: "reading", percent: 0, message: "Starting…" });
    setDiff(null);
    try {
      const parsed = await runParse(file);
      setCurrent(parsed);
      setActiveTab("notFollowingBack");

      if (compareId != null) {
        const snap = await getThreadsSnapshot(compareId);
        if (snap) {
          const ordered = compareTwoExports(
            {
              fileName: snap.label,
              followerUsernames: snap.followerUsernames,
              followerTimestamps: snap.followerTimestamps,
              exportDate: snap.exportDate ?? null,
              exportDateSource: snap.exportDateSource ?? null,
            },
            parsed,
          );
          if (ordered.status === "ready") {
            setDiff(
              diffSnapshots(ordered.ordered.oldFollowers, ordered.ordered.newFollowers),
            );
            setActiveTab("unfollowed");
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parse failed");
      setCurrent(null);
    } finally {
      setParsing(false);
      setProgress(null);
    }
  };

  const applyTwoZip = async (side: "a" | "b", file: File) => {
    setParsing(true);
    setError(null);
    setProgress({ stage: "reading", percent: 0, message: "Starting…" });
    try {
      const parsed = await runParse(file);
      const nextA = side === "a" ? parsed : zipA;
      const nextB = side === "b" ? parsed : zipB;
      if (side === "a") setZipA(parsed);
      else setZipB(parsed);

      if (nextA && nextB) {
        const decision = compareTwoExports(nextA, nextB);
        if (decision.status === "ready") {
          setCurrent(nextB);
          setDiff(diffSnapshots(decision.ordered.oldFollowers, decision.ordered.newFollowers));
          setActiveTab("unfollowed");
        } else {
          setCurrent(nextB);
          setDiff(null);
          setError("Could not tell which export is older. Try again with clearer dates, or save a snapshot first.");
        }
      } else {
        setCurrent(parsed);
        setDiff(null);
        setActiveTab("notFollowingBack");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setParsing(false);
      setProgress(null);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!current) return;
    await saveThreadsSnapshot({
      label: current.fileName.replace(/\.zip$/i, "") || `Threads ${new Date().toLocaleDateString()}`,
      followerUsernames: current.followerUsernames,
      followingUsernames: current.followingUsernames,
      followerTimestamps: current.followerTimestamps,
      followingTimestamps: current.followingTimestamps,
      followerCount: current.insights.followerCount,
      followingCount: current.insights.followingCount,
      exportDate: current.exportDate,
      exportDateSource: current.exportDateSource,
    });
    setSnapshotKey((k) => k + 1);
    refreshSnapshots();
  };

  const tryDemo = async () => {
    const res = await fetch("/demo/threads-demo.zip");
    if (!res.ok) {
      setError("Demo file is missing. Upload your own Threads ZIP instead.");
      return;
    }
    const blob = await res.blob();
    const file = new File([blob], "threads-demo.zip", { type: "application/zip" });
    setTwoZip(false);
    setZipA(null);
    setZipB(null);
    setCompareId(null);
    await applySingle(file);
  };

  const insights = current?.insights ?? null;

  const rawList = useMemo(() => {
    if (!insights || !current) return [] as string[];
    switch (activeTab) {
      case "notFollowingBack":
        return insights.notFollowingBack;
      case "mutuals":
        return insights.mutuals;
      case "fans":
        return insights.fans;
      case "unfollowed":
        return diff?.unfollowed ?? [];
      case "newFollowers":
        return diff?.newFollowers ?? [];
      case "allFollowers":
        return current.followerUsernames;
      case "allFollowing":
        return current.followingUsernames;
      default:
        return [];
    }
  }, [insights, current, activeTab, diff]);

  const users = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = q ? rawList.filter((u) => u.includes(q)) : [...rawList];
    list.sort((a, b) => (sortMode === "az" ? a.localeCompare(b) : b.localeCompare(a)));
    const stamps = current?.followerTimestamps ?? {};
    return list.map((username) => ({
      username,
      timestamp: stamps[username],
    }));
  }, [rawList, debouncedSearch, sortMode, current]);

  const tabItems: { id: ResultTab; label: string; count: number; needsDiff?: boolean }[] =
    insights && current
      ? [
          { id: "notFollowingBack", label: "Not back", count: insights.notFollowingBack.length },
          { id: "mutuals", label: "Mutuals", count: insights.mutuals.length },
          { id: "fans", label: "Fans", count: insights.fans.length },
          { id: "unfollowed", label: "Unfollowed", count: diff?.unfollowed.length ?? 0, needsDiff: true },
          { id: "newFollowers", label: "New", count: diff?.newFollowers.length ?? 0, needsDiff: true },
          { id: "allFollowers", label: "Followers", count: current.followerUsernames.length },
          { id: "allFollowing", label: "Following", count: current.followingUsernames.length },
        ]
      : [];

  return (
    <ToolPageLayout
      articleSlug="threads-unfollow-tracker"
      toolSlug="threads-unfollow-tracker"
      articleFeaturedImage={{
        src: THREADS_FEATURED_IMAGE_PATH,
        alt: THREADS_FEATURED_IMAGE_ALT,
        width: THREADS_FEATURED_IMAGE_WIDTH,
        height: THREADS_FEATURED_IMAGE_HEIGHT,
      }}
    >
      <div className="mesh-bg">
        <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          />
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                No password · Local analysis
              </p>
              <h1 className="font-display text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
                Threads Unfollow Tracker{" "}
                <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                  (2026)
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted">
                Upload your official Threads data export. One ZIP shows who doesn&apos;t follow back;
                two exports show who left. Everything runs in your browser — same privacy model as our{" "}
                <Link
                  to="/"
                  className="font-semibold text-primary underline underline-offset-2 hover:text-accent"
                >
                  Instagram Unfollow Tracker
                </Link>
                .
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button type="button" size="lg" variant="secondary" onClick={() => void tryDemo()}>
                  Try demo
                </Button>
              </div>
            </div>
            <div>
              <ZipDropzone
                onFile={(f) => {
                  if (twoZip) void applyTwoZip(zipA ? "b" : "a", f);
                  else void applySingle(f);
                }}
                disabled={parsing}
                label="Drop Threads export .zip"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_1fr]">
            <aside className="space-y-4">
              <TwoZipPanel
                enabled={twoZip}
                onEnabledChange={(v) => {
                  setTwoZip(v);
                  setZipA(null);
                  setZipB(null);
                  setDiff(null);
                }}
                firstName={zipA?.fileName ?? null}
                secondName={zipB?.fileName ?? null}
                disabled={parsing}
                onFirstFile={(f) => void applyTwoZip("a", f)}
                onSecondFile={(f) => void applyTwoZip("b", f)}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Saved Threads snapshots</CardTitle>
                  <CardDescription>
                    Stored on this device only (max {MAX_THREADS_SNAPSHOTS}). Separate from Instagram
                    snapshots.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {current ? (
                    <Button type="button" variant="secondary" className="w-full" onClick={() => void handleSaveSnapshot()}>
                      Save current result
                    </Button>
                  ) : null}
                  {snapshots.length === 0 ? (
                    <p className="text-sm text-muted">No snapshots yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {snapshots.map((s) => (
                        <li key={s.id} className="rounded-xl border border-border p-3">
                          <input
                            className="w-full bg-transparent text-sm font-medium outline-none focus:underline"
                            defaultValue={s.label}
                            onBlur={(e) => {
                              if (s.id != null && e.target.value.trim()) {
                                void updateThreadsSnapshotLabel(s.id, e.target.value.trim()).then(
                                  refreshSnapshots,
                                );
                              }
                            }}
                          />
                          <p className="mt-1 text-xs text-muted">
                            {formatNumber(s.followerCount)} followers ·{" "}
                            {formatSnapshotDate(s.exportDate ?? s.createdAt)}
                          </p>
                          <div className="mt-2 flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant={compareId === s.id ? "default" : "outline"}
                              onClick={() => setCompareId(compareId === s.id ? null : (s.id ?? null))}
                            >
                              <GitCompare className="h-3.5 w-3.5" />
                              Compare
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              aria-label="Delete snapshot"
                              onClick={() => {
                                if (s.id != null) {
                                  void deleteThreadsSnapshot(s.id).then(() => {
                                    if (compareId === s.id) setCompareId(null);
                                    refreshSnapshots();
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-danger" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </aside>

            <div>
              {parsing || progress ? (
                <div className="mb-8 rounded-2xl border border-border bg-card p-4">
                  <ParseProgressBar progress={progress} />
                </div>
              ) : null}

              {error ? (
                <div
                  role="alert"
                  className="mb-8 rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger"
                >
                  {error}
                </div>
              ) : null}

              {!insights || !current ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center shadow-sm"
                >
                  <div
                    aria-hidden
                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-accent/20 text-primary shadow-sm shadow-indigo-500/10 ring-1 ring-primary/15"
                  >
                    <ListChecks className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <p className="font-display text-lg font-bold tracking-tight">Results appear here</p>
                  <p className="mt-1.5 max-w-sm text-sm text-muted">
                    Your lists show up after you analyze an export — nothing leaves this browser.
                  </p>
                  <ul className="mt-4 w-full max-w-sm space-y-2 text-left">
                    <li className="flex items-start gap-3 rounded-xl border border-border/70 bg-border/10 px-3 py-2">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileArchive className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="text-sm leading-snug text-muted">
                        <span className="font-semibold text-foreground">Upload a ZIP</span>
                        {" — "}see who doesn&apos;t follow back
                      </span>
                    </li>
                    <li className="flex items-start gap-3 rounded-xl border border-border/70 bg-border/10 px-3 py-2">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <GitCompare className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="text-sm leading-snug text-muted">
                        <span className="font-semibold text-foreground">Compare two exports</span>
                        {" — "}see who unfollowed
                      </span>
                    </li>
                    <li className="flex items-start gap-3 rounded-xl border border-border/70 bg-border/10 px-3 py-2">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="text-sm leading-snug text-muted">
                        <span className="font-semibold text-foreground">No export yet?</span>
                        {" — "}tap <span className="font-medium text-foreground">Try demo</span> for
                        sample data
                      </span>
                    </li>
                  </ul>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard label="Followers" value={insights.followerCount} />
                    <StatCard label="Following" value={insights.followingCount} />
                    <StatCard
                      label="Not following back"
                      value={insights.notFollowingBack.length}
                      accent="warning"
                    />
                    <StatCard
                      label="Follow-back rate"
                      value={insights.followBackRate}
                      sub={`${insights.followBackRate}% of people you follow`}
                      accent="success"
                    />
                  </div>

                  <p className="text-sm text-muted">
                    Analyzed: <span className="font-medium text-foreground">{current.fileName}</span>
                  </p>

                  {diff ? (
                    <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted">
                      Unfollowed / new lists compare two follower snapshots. Username changes and
                      incomplete exports can affect results — review manually in Threads.
                    </p>
                  ) : null}

                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ResultTab)}>
                    <TabsList className="w-full justify-start">
                      {tabItems.map((t) => (
                        <TabsTrigger key={t.id} value={t.id} disabled={t.needsDiff && !diff}>
                          {t.label} ({t.count})
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <TabsContent value={activeTab} forceMount>
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          placeholder="Search username…"
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            debounceSearch(e.target.value);
                          }}
                          className="sm:max-w-xs"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={sortMode === "az" ? "default" : "outline"}
                            onClick={() => setSortMode("az")}
                          >
                            A–Z
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={sortMode === "za" ? "default" : "outline"}
                            onClick={() => setSortMode("za")}
                          >
                            Z–A
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => exportUsernamesCsv(users, activeTab)}
                          >
                            <Download className="h-4 w-4" />
                            CSV
                          </Button>
                        </div>
                      </div>
                      <VirtualUserList
                        users={users}
                        profileUrl={threadsProfileUrl}
                        profileLabel="Threads"
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </ToolPageLayout>
  );
}
