import { useMemo, useState } from "react";
import { Download, ExternalLink, Hourglass } from "lucide-react";
import { ZipDropzone } from "@/components/analyzer/ZipDropzone";
import { ParseProgressBar } from "@/components/analyzer/ParseProgressBar";
import { StatCard } from "@/components/analyzer/StatCard";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { SITE_URL } from "@/content/seo";
import { parsePendingRequestsFile } from "@/lib/parseClient";
import type { ParseProgress } from "@/lib/parseZip";
import {
  exportPendingRequestsCsv,
  filterPendingRows,
  formatDaysPending,
  sortPendingRows,
  toPendingRows,
  type PendingRow,
  type PendingSortMode,
} from "@/lib/pendingRequests";
import { cn } from "@/lib/utils";

const META_TITLE = "Instagram Pending Follow Requests Checker";
const META_DESCRIPTION =
  "See which Instagram follow requests you sent are still waiting — even from years ago. Upload your official export ZIP. Private, in-browser analysis, no login.";

export default function PendingRequestsPage() {
  useDocumentMeta({
    title: META_TITLE,
    description: META_DESCRIPTION,
    canonical: `${SITE_URL}/pending-requests`,
  });

  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<PendingRow[] | null>(null);
  const [hasAnyTimestamp, setHasAnyTimestamp] = useState(false);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<PendingSortMode>("oldest");

  const visibleRows = useMemo(() => {
    if (!rows) return [];
    return sortPendingRows(filterPendingRows(rows, search), sortMode);
  }, [rows, search, sortMode]);

  const runParse = async (file: File) => {
    setParsing(true);
    setError(null);
    setProgress({ stage: "reading", percent: 0, message: "Starting…" });
    setFileName(file.name);
    setRows(null);
    try {
      const result = await parsePendingRequestsFile(file, (p) => setProgress(p));
      setRows(toPendingRows(result.requests));
      setHasAnyTimestamp(result.hasAnyTimestamp);
      setSortMode(result.hasAnyTimestamp ? "oldest" : "username");
      setProgress(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parse failed");
      setRows(null);
      setProgress(null);
    } finally {
      setParsing(false);
    }
  };

  const tryDemo = async () => {
    const res = await fetch("/demo/pending-requests-demo.zip");
    if (!res.ok) {
      setError("Demo file is missing. Upload your own Instagram ZIP instead.");
      return;
    }
    const blob = await res.blob();
    const file = new File([blob], "pending-requests-demo.zip", { type: "application/zip" });
    await runParse(file);
  };

  return (
    <ToolPageLayout articleSlug="pending-requests" toolSlug="pending-requests">
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
                Instagram Pending Follow Requests{" "}
                <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                  Checker
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted">
                Upload your official Instagram data export to see which follow requests you sent are
                still waiting — including ones from years ago. Everything runs on your device.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button type="button" size="lg" variant="secondary" onClick={() => void tryDemo()}>
                  Try demo
                </Button>
              </div>
            </div>
            <div>
              <ZipDropzone
                onFile={(f) => void runParse(f)}
                disabled={parsing}
                label="Drop ZIP to check pending requests"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
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

          {rows ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold">Your pending requests</h2>
                  {fileName ? <p className="mt-1 text-sm text-muted">From {fileName}</p> : null}
                </div>
                <div className="grid w-full max-w-xs gap-3 sm:w-auto">
                  <StatCard
                    label="Pending requests"
                    value={rows.length}
                    accent={rows.length > 0 ? "warning" : "success"}
                    sub={
                      rows.length === 0
                        ? "Nothing waiting right now"
                        : hasAnyTimestamp
                          ? "Sorted by how long they’ve been waiting"
                          : "No send dates in this export"
                    }
                  />
                </div>
              </div>

              {rows.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
                  <Hourglass className="mb-3 h-8 w-8 text-muted" aria-hidden />
                  <p className="font-display text-lg font-bold">No pending requests found</p>
                  <p className="mt-2 max-w-md text-sm text-muted">
                    This export’s pending_follow_requests file is empty. Either you have no waiting
                    requests, or that section wasn’t included in the download.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      placeholder="Search username…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="sm:max-w-xs"
                      aria-label="Search pending usernames"
                    />
                    <div className="flex flex-wrap gap-2">
                      {hasAnyTimestamp ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant={sortMode === "oldest" ? "default" : "outline"}
                            aria-pressed={sortMode === "oldest"}
                            onClick={() => setSortMode("oldest")}
                          >
                            Oldest first
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={sortMode === "newest" ? "default" : "outline"}
                            aria-pressed={sortMode === "newest"}
                            onClick={() => setSortMode("newest")}
                          >
                            Newest first
                          </Button>
                        </>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant={sortMode === "username" ? "default" : "outline"}
                        aria-pressed={sortMode === "username"}
                        onClick={() => setSortMode("username")}
                      >
                        A–Z
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => exportPendingRequestsCsv(visibleRows)}
                      >
                        <Download className="h-4 w-4" />
                        CSV
                      </Button>
                    </div>
                  </div>

                  <ul className="list-none overflow-hidden rounded-xl border border-border bg-card p-0">
                    {visibleRows.length === 0 ? (
                      <li className="flex h-48 items-center justify-center text-sm text-muted">
                        No usernames match your search.
                      </li>
                    ) : (
                      visibleRows.map((row, index) => (
                        <li
                          key={row.username}
                          className={cn(
                            "flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 last:border-b-0",
                            index % 2 === 0 && "bg-border/10",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">@{row.username}</p>
                            {hasAnyTimestamp && row.daysPending != null ? (
                              <p className="text-xs text-muted">
                                {formatDaysPending(row.daysPending)}
                              </p>
                            ) : null}
                          </div>
                          <Button type="button" variant="outline" size="sm" asChild>
                            <a
                              href={`https://www.instagram.com/${row.username}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Cancel request with ${row.username} on Instagram`}
                            >
                              Cancel on Instagram
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                            </a>
                          </Button>
                        </li>
                      ))
                    )}
                  </ul>
                  <p className="text-xs text-muted">
                    Links only open the profile. Cancel any request yourself in the Instagram app —
                    this tool never logs in or acts on your account.
                  </p>
                </>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </ToolPageLayout>
  );
}
