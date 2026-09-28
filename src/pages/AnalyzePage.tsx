import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { Download, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ZipDropzone } from "@/components/analyzer/ZipDropzone";
import { StatCard } from "@/components/analyzer/StatCard";
import { VirtualUserList } from "@/components/analyzer/VirtualUserList";
import { ParseProgressBar } from "@/components/analyzer/ParseProgressBar";
import { SnapshotPanel } from "@/components/analyzer/SnapshotPanel";
import { computeDiffLocal, parseZipFile, parseZipWithDiff } from "@/lib/parseClient";
import { exportUsernamesCsv } from "@/lib/utils";
import {
  saveSnapshot,
  getSnapshot,
  snapshotThatWouldBeReplaced,
  type StoredSnapshot,
} from "@/db/snapshots";
import {
  useAnalyzerStore,
  getActiveList,
  type ResultTab,
} from "@/store/analyzerStore";

type SortMode = "az" | "za" | "recent";

function sortList(
  list: { username: string; timestamp?: number }[],
  mode: SortMode,
) {
  const copy = [...list];
  if (mode === "recent") {
    copy.sort((a, b) => {
      const left = a.timestamp ?? -1;
      const right = b.timestamp ?? -1;
      if (left !== right) return right - left;
      return a.username.localeCompare(b.username);
    });
    return copy;
  }
  copy.sort((a, b) =>
    mode === "az" ? a.username.localeCompare(b.username) : b.username.localeCompare(a.username),
  );
  return copy;
}

export default function AnalyzePage() {
  const isParsing = useAnalyzerStore((s) => s.isParsing);
  const progress = useAnalyzerStore((s) => s.progress);
  const error = useAnalyzerStore((s) => s.error);
  const fileName = useAnalyzerStore((s) => s.fileName);
  const insights = useAnalyzerStore((s) => s.insights);
  const followerUsernames = useAnalyzerStore((s) => s.followerUsernames);
  const followingUsernames = useAnalyzerStore((s) => s.followingUsernames);
  const followerTimestamps = useAnalyzerStore((s) => s.followerTimestamps);
  const followingTimestamps = useAnalyzerStore((s) => s.followingTimestamps);
  const baselineFollowerTimestamps = useAnalyzerStore((s) => s.baselineFollowerTimestamps);
  const diff = useAnalyzerStore((s) => s.diff);
  const activeTab = useAnalyzerStore((s) => s.activeTab);
  const compareSnapshotId = useAnalyzerStore((s) => s.compareSnapshotId);
  const setTab = useAnalyzerStore((s) => s.setTab);
  const setCompareSnapshotId = useAnalyzerStore((s) => s.setCompareSnapshotId);
  const setParsing = useAnalyzerStore((s) => s.setParsing);
  const setProgress = useAnalyzerStore((s) => s.setProgress);
  const setError = useAnalyzerStore((s) => s.setError);
  const setResults = useAnalyzerStore((s) => s.setResults);
  const setDiff = useAnalyzerStore((s) => s.setDiff);
  const reset = useAnalyzerStore((s) => s.reset);

  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("az");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [replaceOldest, setReplaceOldest] = useState<StoredSnapshot | null>(null);

  const debounceSearch = useDebouncedCallback((v: string) => setDebouncedSearch(v), 200);

  const activeList = useMemo(() => {
    const base = getActiveList({
      isParsing,
      progress,
      error,
      fileName,
      insights,
      followerUsernames,
      followingUsernames,
      followerTimestamps,
      followingTimestamps,
      baselineFollowerTimestamps,
      diff,
      activeTab,
      compareSnapshotId,
      setTab,
      setCompareSnapshotId,
      setParsing,
      setProgress,
      setError,
      setResults,
      setDiff,
      reset,
    });
    const q = debouncedSearch.trim().toLowerCase();
    const filtered = q ? base.filter((u) => u.username.includes(q)) : base;
    return sortList(filtered, sortMode);
  }, [
    isParsing,
    progress,
    error,
    fileName,
    insights,
    followerUsernames,
    followingUsernames,
    followerTimestamps,
    followingTimestamps,
    baselineFollowerTimestamps,
    diff,
    activeTab,
    compareSnapshotId,
    debouncedSearch,
    sortMode,
  ]);

  const handleFile = async (file: File, compareSnapshot?: StoredSnapshot | null) => {
    setParsing(true);
    setError(null);
    setProgress({ stage: "reading", percent: 0, message: "Starting…" });

    try {
      if (compareSnapshot) {
        const result = await parseZipWithDiff(
          file,
          compareSnapshot.followerUsernames,
          (p) => setProgress(p),
        );
        setResults({
          fileName: file.name,
          insights: result.insights,
          followerUsernames: result.followerUsernames,
          followingUsernames: result.followingUsernames,
          followerTimestamps: result.followerTimestamps,
          followingTimestamps: result.followingTimestamps,
          baselineFollowerTimestamps: compareSnapshot.followerTimestamps ?? {},
          diff: result.diff,
        });
        setTab("unfollowed");
      } else {
        const result = await parseZipFile(file, (p) => setProgress(p));
        setResults({
          fileName: file.name,
          insights: result.insights,
          followerUsernames: result.followerUsernames,
          followingUsernames: result.followingUsernames,
          followerTimestamps: result.followerTimestamps,
          followingTimestamps: result.followingTimestamps,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse ZIP");
      setParsing(false);
      setProgress(null);
    }
  };

  const persistSnapshot = async (replace: boolean) => {
    if (!insights) return;
    const label =
      fileName?.replace(/\.zip$/i, "") ?? `Snapshot ${new Date().toLocaleDateString()}`;
    await saveSnapshot(
      {
        label,
        followerUsernames,
        followingUsernames,
        followerTimestamps,
        followingTimestamps,
        followerCount: insights.followerCount,
        followingCount: insights.followingCount,
      },
      { replaceOldest: replace },
    );
    setReplaceOldest(null);
    setSnapshotVersion((v) => v + 1);
    setNotice("Snapshot saved on this device. Select Compare, then upload a newer export.");
  };

  const handleSaveSnapshot = async () => {
    if (!insights) return;
    const oldest = await snapshotThatWouldBeReplaced();
    if (oldest) {
      setReplaceOldest(oldest);
      return;
    }
    await persistSnapshot(false);
  };

  const applyCompare = (snapshot: StoredSnapshot | null) => {
    if (!snapshot || followerUsernames.length === 0) {
      setDiff(null);
      return;
    }
    setDiff(
      computeDiffLocal(snapshot.followerUsernames, followerUsernames),
      snapshot.followerTimestamps ?? {},
    );
    setTab("unfollowed");
    setNotice(
      `Comparing ${fileName ?? "this export"} against “${snapshot.label}”. Unfollowed means they were in the older snapshot and are missing now.`,
    );
  };

  const tabItems: { id: ResultTab; label: string; count: number; needsDiff?: boolean }[] =
    insights
      ? [
          {
            id: "notFollowingBack",
            label: "Not back",
            count: insights.notFollowingBack.length,
          },
          { id: "mutuals", label: "Mutuals", count: insights.mutuals.length },
          { id: "fans", label: "Fans", count: insights.fans.length },
          {
            id: "unfollowed",
            label: "Unfollowed",
            count: diff?.unfollowed.length ?? 0,
            needsDiff: true,
          },
          {
            id: "newFollowers",
            label: "New",
            count: diff?.newFollowers.length ?? 0,
            needsDiff: true,
          },
          {
            id: "allFollowers",
            label: "Followers",
            count: followerUsernames.length,
          },
          {
            id: "allFollowing",
            label: "Following",
            count: followingUsernames.length,
          },
        ]
      : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Analyze your export
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Upload your official Instagram ZIP. Processing runs in a background worker on your device.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr]">
        <aside className="space-y-6">
          <ZipDropzone
            disabled={isParsing}
            compact
            onFile={(file) => {
              void (async () => {
                let snap: StoredSnapshot | null = null;
                if (compareSnapshotId != null) {
                  snap = (await getSnapshot(compareSnapshotId)) ?? null;
                }
                await handleFile(file, snap);
              })();
            }}
          />
          {isParsing ? <ParseProgressBar progress={progress} /> : null}
          {error ? (
            <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              <p>{error}</p>
              <Link to="/guide" className="mt-2 inline-block font-semibold underline">
                See the export guide
              </Link>
            </div>
          ) : null}
          {notice ? (
            <p className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
              {notice}
            </p>
          ) : null}
          {replaceOldest ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <p>
                Saving will remove the oldest snapshot, “{replaceOldest.label}”. This device keeps
                10 snapshots.
              </p>
              <div className="mt-3 flex gap-2">
                <Button type="button" size="sm" onClick={() => void persistSnapshot(true)}>
                  Replace and save
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setReplaceOldest(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          <SnapshotPanel
            compareId={compareSnapshotId}
            refreshKey={snapshotVersion}
            onCompareChange={setCompareSnapshotId}
            onApplyCompare={applyCompare}
            canSave={!!insights}
            onSaveCurrent={() => void handleSaveSnapshot()}
          />

          <Button type="button" variant="ghost" className="w-full" onClick={() => reset()}>
            <RotateCcw className="h-4 w-4" />
            Start over
          </Button>
        </aside>

        <section>
          {!insights ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>Results appear here</CardTitle>
                <CardDescription>
                  Upload a ZIP or try the demo from the home page. To track unfollows over time,
                  save a snapshot, then upload a newer export with Compare selected.{" "}
                  <Link to="/guide" className="font-semibold text-primary hover:underline">
                    Export guide
                  </Link>
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                  suffix="%"
                  decimals={1}
                  sub={`${insights.followBackRate}% of people you follow`}
                  accent="success"
                />
              </div>

              {fileName ? (
                <p className="mb-4 text-sm text-muted">
                  Analyzed: <span className="font-medium text-foreground">{fileName}</span>
                </p>
              ) : null}

              {diff ? (
                <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted">
                  Unfollowed / new lists compare your upload against an older saved snapshot.
                  Username changes and incomplete exports can affect results — review manually in
                  Instagram.
                </p>
              ) : null}

              <Tabs value={activeTab} onValueChange={(v) => setTab(v as ResultTab)}>
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
                        variant={sortMode === "recent" ? "default" : "outline"}
                        onClick={() => setSortMode("recent")}
                      >
                        Recent
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          exportUsernamesCsv(activeList, activeTab)
                        }
                      >
                        <Download className="h-4 w-4" />
                        CSV
                      </Button>
                    </div>
                  </div>
                  <VirtualUserList users={activeList} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
