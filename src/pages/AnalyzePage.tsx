import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { Download, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ZipDropzone } from "@/components/analyzer/ZipDropzone";
import { StatCard } from "@/components/analyzer/StatCard";
import { CountsNote } from "@/components/analyzer/CountsNote";
import { VirtualUserList } from "@/components/analyzer/VirtualUserList";
import { ParseProgressBar } from "@/components/analyzer/ParseProgressBar";
import { SnapshotPanel } from "@/components/analyzer/SnapshotPanel";
import { TwoZipPanel } from "@/components/analyzer/TwoZipPanel";
import { parseZipFile } from "@/lib/parseClient";
import { compareTwoExports, type TwoZipExport } from "@/lib/compareTwoExports";
import { diffSnapshots, orderComparison, type OlderChoice } from "@/lib/diff";
import { describeExportDate, snapshotExportDate } from "@/lib/exportDate";
import type { ParseResult } from "@/lib/parseZip";
import type { Insights } from "@/lib/sets";
import { exportUsernamesCsv, formatSnapshotDate } from "@/lib/utils";
import {
  saveSnapshot,
  getSnapshot,
  snapshotThatWouldBeReplaced,
  listReviewed,
  listIgnored,
  setReviewed,
  ignoreUsername,
  restoreIgnored,
  type StoredSnapshot,
} from "@/db/snapshots";
import { applyReviewFilter, excludeIgnored, ignoredOverlap, type ReviewFilter } from "@/lib/userLists";
import {
  useAnalyzerStore,
  getActiveList,
  type ResultTab,
} from "@/store/analyzerStore";

type SortMode = "az" | "za" | "recent";

type TwoZipParsed = TwoZipExport & {
  insights: Insights;
  followingUsernames: string[];
  followingTimestamps: Record<string, number>;
};

function parsedFromResult(fileName: string, result: ParseResult): TwoZipParsed {
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
  const newerFollowerTimestamps = useAnalyzerStore((s) => s.newerFollowerTimestamps);
  const exportDate = useAnalyzerStore((s) => s.exportDate);
  const exportDateSource = useAnalyzerStore((s) => s.exportDateSource);
  const comparisonFrom = useAnalyzerStore((s) => s.comparisonFrom);
  const comparisonTo = useAnalyzerStore((s) => s.comparisonTo);
  const comparisonOldSource = useAnalyzerStore((s) => s.comparisonOldSource);
  const comparisonNewSource = useAnalyzerStore((s) => s.comparisonNewSource);
  const comparisonManual = useAnalyzerStore((s) => s.comparisonManual);
  const needsOlderChoice = useAnalyzerStore((s) => s.needsOlderChoice);
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
  const [choiceSnapshot, setChoiceSnapshot] = useState<StoredSnapshot | null>(null);
  const [compareTwoMode, setCompareTwoMode] = useState(false);
  const [twoZipFirst, setTwoZipFirst] = useState<TwoZipParsed | null>(null);
  const [twoZipSecond, setTwoZipSecond] = useState<TwoZipParsed | null>(null);
  const [reviewed, setReviewedMarks] = useState<Set<string>>(() => new Set());
  const [ignored, setIgnoredMarks] = useState<Set<string>>(() => new Set());
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");

  const debounceSearch = useDebouncedCallback((v: string) => setDebouncedSearch(v), 200);

  useEffect(() => {
    void Promise.all([listReviewed(), listIgnored()]).then(([savedReviewed, savedIgnored]) => {
      setReviewedMarks(new Set(savedReviewed));
      setIgnoredMarks(new Set(savedIgnored));
    });
  }, []);

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
      newerFollowerTimestamps,
      exportDate,
      exportDateSource,
      comparisonFrom,
      comparisonTo,
      comparisonOldSource,
      comparisonNewSource,
      comparisonManual,
      needsOlderChoice,
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
    let rows = q ? base.filter((u) => u.username.includes(q)) : base;
    if (activeTab === "notFollowingBack") {
      rows = rows.filter((u) => !ignored.has(u.username));
      rows = applyReviewFilter(rows, reviewed, reviewFilter);
    } else if (activeTab === "ignored") {
      rows = [...ignored]
        .sort((a, b) => a.localeCompare(b))
        .filter((name) => (q ? name.includes(q) : true))
        .map((username) => ({ username }));
    }
    return sortList(rows, sortMode);
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
    newerFollowerTimestamps,
    exportDate,
    exportDateSource,
    comparisonFrom,
    comparisonTo,
    comparisonOldSource,
    comparisonNewSource,
    comparisonManual,
    needsOlderChoice,
    diff,
    activeTab,
    compareSnapshotId,
    debouncedSearch,
    sortMode,
    ignored,
    reviewed,
    reviewFilter,
  ]);

  const handleFile = async (file: File, compareSnapshot?: StoredSnapshot | null) => {
    setParsing(true);
    setError(null);
    setProgress({ stage: "reading", percent: 0, message: "Starting…" });

    try {
      const result = await parseZipFile(file, (p) => setProgress(p));
      if (compareSnapshot) {
        const decision = orderComparison({
          snapshotDate: snapshotExportDate(compareSnapshot),
          currentDate: result.exportDate,
          snapshotSource: compareSnapshot.exportDateSource ?? null,
          currentSource: result.exportDateSource,
          snapshotFollowers: compareSnapshot.followerUsernames,
          currentFollowers: result.followerUsernames,
          snapshotTimestamps: compareSnapshot.followerTimestamps,
          currentTimestamps: result.followerTimestamps,
        });
        if (decision.status === "needs-choice") {
          setChoiceSnapshot(compareSnapshot);
          setResults({
            fileName: file.name,
            insights: result.insights,
            followerUsernames: result.followerUsernames,
            followingUsernames: result.followingUsernames,
            followerTimestamps: result.followerTimestamps,
            followingTimestamps: result.followingTimestamps,
            exportDate: result.exportDate,
            exportDateSource: result.exportDateSource,
            needsOlderChoice: true,
          });
          return;
        }
        const ordered = decision.ordered;
        setChoiceSnapshot(null);
        setResults({
          fileName: file.name,
          insights: result.insights,
          followerUsernames: result.followerUsernames,
          followingUsernames: result.followingUsernames,
          followerTimestamps: result.followerTimestamps,
          followingTimestamps: result.followingTimestamps,
          baselineFollowerTimestamps: ordered.oldTimestamps,
          newerFollowerTimestamps: ordered.newTimestamps,
          exportDate: result.exportDate,
          exportDateSource: result.exportDateSource,
          comparisonFrom: ordered.oldAt,
          comparisonTo: ordered.newAt,
          comparisonOldSource: ordered.oldSource,
          comparisonNewSource: ordered.newSource,
          comparisonManual: ordered.chosenManually,
          diff: diffSnapshots(ordered.oldFollowers, ordered.newFollowers),
        });
        setTab("unfollowed");
      } else {
        setChoiceSnapshot(null);
        setResults({
          fileName: file.name,
          insights: result.insights,
          followerUsernames: result.followerUsernames,
          followingUsernames: result.followingUsernames,
          followerTimestamps: result.followerTimestamps,
          followingTimestamps: result.followingTimestamps,
          exportDate: result.exportDate,
          exportDateSource: result.exportDateSource,
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
        exportDate,
        exportDateSource,
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

  const applyCompare = (snapshot: StoredSnapshot | null, olderChoice: OlderChoice | null = null) => {
    if (!snapshot || followerUsernames.length === 0) {
      setChoiceSnapshot(null);
      setDiff(null);
      return;
    }
    const decision = orderComparison({
      snapshotDate: snapshotExportDate(snapshot),
      currentDate: exportDate,
      snapshotSource: snapshot.exportDateSource ?? null,
      currentSource: exportDateSource,
      snapshotFollowers: snapshot.followerUsernames,
      currentFollowers: followerUsernames,
      snapshotTimestamps: snapshot.followerTimestamps,
      currentTimestamps: followerTimestamps,
      olderChoice,
    });
    if (decision.status === "needs-choice") {
      setChoiceSnapshot(snapshot);
      setDiff(null, { needsOlderChoice: true });
      setNotice(null);
      return;
    }
    const ordered = decision.ordered;
    setChoiceSnapshot(null);
    setDiff(diffSnapshots(ordered.oldFollowers, ordered.newFollowers), {
      baselineFollowerTimestamps: ordered.oldTimestamps,
      newerFollowerTimestamps: ordered.newTimestamps,
      from: ordered.oldAt,
      to: ordered.newAt,
      oldSource: ordered.oldSource,
      newSource: ordered.newSource,
      manual: ordered.chosenManually,
      needsOlderChoice: false,
    });
    setTab("unfollowed");
    setNotice(null);
  };

  const showParsed = (parsed: TwoZipParsed, extra?: { diff?: ReturnType<typeof diffSnapshots> | null } & Parameters<typeof setDiff>[1]) => {
    setChoiceSnapshot(null);
    setResults({
      fileName: parsed.fileName,
      insights: parsed.insights,
      followerUsernames: parsed.followerUsernames,
      followingUsernames: parsed.followingUsernames,
      followerTimestamps: parsed.followerTimestamps,
      followingTimestamps: parsed.followingTimestamps,
      exportDate: parsed.exportDate,
      exportDateSource: parsed.exportDateSource,
      ...(extra?.diff
        ? {
            baselineFollowerTimestamps: extra.baselineFollowerTimestamps,
            newerFollowerTimestamps: extra.newerFollowerTimestamps,
            comparisonFrom: extra.from,
            comparisonTo: extra.to,
            comparisonOldSource: extra.oldSource,
            comparisonNewSource: extra.newSource,
            comparisonManual: extra.manual,
            needsOlderChoice: extra.needsOlderChoice,
            diff: extra.diff,
          }
        : { needsOlderChoice: extra?.needsOlderChoice ?? false, diff: extra?.diff ?? null }),
    });
  };

  const applyTwoZip = (
    first: TwoZipParsed,
    second: TwoZipParsed,
    olderChoice: OlderChoice | null = null,
  ) => {
    const decision = compareTwoExports(first, second, olderChoice);
    if (decision.status === "needs-choice") {
      showParsed(second, { diff: null, needsOlderChoice: true });
      setNotice(null);
      return;
    }
    const ordered = decision.ordered;
    showParsed(second, {
      diff: diffSnapshots(ordered.oldFollowers, ordered.newFollowers),
      baselineFollowerTimestamps: ordered.oldTimestamps,
      newerFollowerTimestamps: ordered.newTimestamps,
      from: ordered.oldAt,
      to: ordered.newAt,
      oldSource: ordered.oldSource,
      newSource: ordered.newSource,
      manual: ordered.chosenManually,
      needsOlderChoice: false,
    });
    setTab("unfollowed");
    setNotice(null);
  };

  const handleTwoZipFile = async (slot: "first" | "second", file: File) => {
    setParsing(true);
    setError(null);
    setProgress({ stage: "reading", percent: 0, message: "Starting…" });
    const label = slot === "first" ? "First export" : "Second export";
    try {
      const result = await parseZipFile(file, (p) =>
        setProgress({ ...p, message: `${label} — ${p.message}` }),
      );
      const parsed = parsedFromResult(file.name, result);
      const first = slot === "first" ? parsed : twoZipFirst;
      const second = slot === "second" ? parsed : twoZipSecond;
      if (slot === "first") setTwoZipFirst(parsed);
      else setTwoZipSecond(parsed);
      if (first && second) {
        applyTwoZip(first, second);
      } else {
        showParsed(parsed);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to parse ZIP";
      setError(`${label} (${file.name}): ${message}`);
      setParsing(false);
      setProgress(null);
    }
  };

  const handleStartOver = () => {
    reset();
    setCompareTwoMode(false);
    setTwoZipFirst(null);
    setTwoZipSecond(null);
    setChoiceSnapshot(null);
    setNotice(null);
    setReplaceOldest(null);
    setSearch("");
    setDebouncedSearch("");
  };

  const notBackVisibleCount = insights
    ? excludeIgnored(insights.notFollowingBack, ignored).length
    : 0;
  const ignoredHiddenCount = insights ? ignoredOverlap(insights.notFollowingBack, ignored) : 0;

  const tabItems: { id: ResultTab; label: string; count: number; needsDiff?: boolean }[] =
    insights
      ? [
          {
            id: "notFollowingBack",
            label: "Not back",
            count: notBackVisibleCount,
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
          {
            id: "ignored",
            label: "Ignored",
            count: ignored.size,
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
          <TwoZipPanel
            enabled={compareTwoMode}
            firstName={twoZipFirst?.fileName ?? null}
            secondName={twoZipSecond?.fileName ?? null}
            disabled={isParsing}
            onEnabledChange={(on) => {
              setCompareTwoMode(on);
              if (on) {
                setCompareSnapshotId(null);
                setChoiceSnapshot(null);
              } else {
                setTwoZipFirst(null);
                setTwoZipSecond(null);
              }
            }}
            onFirstFile={(file) => void handleTwoZipFile("first", file)}
            onSecondFile={(file) => void handleTwoZipFile("second", file)}
          />
          {compareTwoMode ? null : (
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
          )}
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

          <Button type="button" variant="ghost" className="w-full" onClick={handleStartOver}>
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
                  Upload a ZIP, compare two exports without saving, or try the demo from the home
                  page. To track unfollows over time, save a snapshot, then upload a newer export
                  with Compare selected.{" "}
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
                  value={notBackVisibleCount}
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

              <CountsNote />

              {fileName ? (
                <p className="mb-4 text-sm text-muted">
                  Analyzed:{" "}
                  <span className="font-medium text-foreground">
                    {twoZipFirst && twoZipSecond
                      ? `${twoZipFirst.fileName} and ${twoZipSecond.fileName}`
                      : fileName}
                  </span>
                </p>
              ) : null}

              {needsOlderChoice ? (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                  <p>
                    These exports do not have dates far enough apart to tell which is older. Pick
                    the older file. Nothing is guessed.
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    Which export is older?
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {twoZipFirst && twoZipSecond ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          aria-pressed={false}
                          onClick={() => applyTwoZip(twoZipFirst, twoZipSecond, "snapshot")}
                        >
                          {twoZipFirst.fileName}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          aria-pressed={false}
                          onClick={() => applyTwoZip(twoZipFirst, twoZipSecond, "current")}
                        >
                          {twoZipSecond.fileName}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          aria-pressed={false}
                          onClick={() => choiceSnapshot && applyCompare(choiceSnapshot, "snapshot")}
                        >
                          Saved snapshot
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          aria-pressed={false}
                          onClick={() => choiceSnapshot && applyCompare(choiceSnapshot, "current")}
                        >
                          Current upload
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : null}

              {diff ? (
                <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted">
                  {comparisonFrom != null && comparisonTo != null ? (
                    <>
                      {twoZipFirst && twoZipSecond
                        ? `${twoZipFirst.fileName} and ${twoZipSecond.fileName}. `
                        : null}
                      Comparing {formatSnapshotDate(comparisonFrom)} -&gt;{" "}
                      {formatSnapshotDate(comparisonTo)}. Older export{" "}
                      {describeExportDate(comparisonOldSource)}. Newer export{" "}
                      {describeExportDate(comparisonNewSource)}.
                      {comparisonManual
                        ? " The dates were too close or missing, so this order uses your choice."
                        : null}{" "}
                    </>
                  ) : (
                    <>
                      Order set by your choice. Export dates were not available, so this was not
                      estimated from follow activity.{" "}
                    </>
                  )}
                  Unfollowed means they were in the older list and are missing from the newer one.
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
                  {activeTab === "notFollowingBack" ? (
                    <div className="mb-3 flex flex-col gap-2">
                      {ignoredHiddenCount > 0 ? (
                        <p className="text-xs text-muted">
                          {ignoredHiddenCount} hidden by your ignore list
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            ["all", "All"],
                            ["unreviewed", "Not reviewed"],
                            ["reviewed", "Reviewed"],
                          ] as const
                        ).map(([id, label]) => (
                          <Button
                            key={id}
                            type="button"
                            size="sm"
                            variant={reviewFilter === id ? "default" : "outline"}
                            aria-pressed={reviewFilter === id}
                            onClick={() => setReviewFilter(id)}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {activeTab === "ignored" ? (
                    <p className="mb-3 text-xs text-muted">
                      Ignored accounts stay on this device and are left out of the Not back count.
                    </p>
                  ) : null}
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
                  <VirtualUserList
                    users={activeList}
                    reviewed={reviewed}
                    onReviewedChange={
                      activeTab === "notFollowingBack"
                        ? (username, next) => {
                            setReviewedMarks((prev) => {
                              const copy = new Set(prev);
                              if (next) copy.add(username);
                              else copy.delete(username);
                              return copy;
                            });
                            void setReviewed(username, next);
                          }
                        : undefined
                    }
                    onIgnore={
                      activeTab === "notFollowingBack"
                        ? (username) => {
                            setIgnoredMarks((prev) => new Set(prev).add(username));
                            void ignoreUsername(username);
                          }
                        : undefined
                    }
                    onRestore={
                      activeTab === "ignored"
                        ? (username) => {
                            setIgnoredMarks((prev) => {
                              const copy = new Set(prev);
                              copy.delete(username);
                              return copy;
                            });
                            void restoreIgnored(username);
                          }
                        : undefined
                    }
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
