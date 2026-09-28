import { useEffect, useState } from "react";
import { Trash2, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listSnapshots,
  deleteSnapshot,
  updateSnapshotLabel,
  MAX_SNAPSHOTS,
  type StoredSnapshot,
} from "@/db/snapshots";
import { snapshotExportDate } from "@/lib/exportDate";
import { formatNumber, formatSnapshotDate } from "@/lib/utils";

interface SnapshotPanelProps {
  compareId: number | null;
  refreshKey?: number;
  onCompareChange: (id: number | null) => void;
  onApplyCompare: (snapshot: StoredSnapshot | null) => void;
  currentFollowers?: string[];
  onSaveCurrent?: () => void;
  canSave?: boolean;
}

export function SnapshotPanel({
  compareId,
  refreshKey = 0,
  onCompareChange,
  onApplyCompare,
  onSaveCurrent,
  canSave,
}: SnapshotPanelProps) {
  const [snapshots, setSnapshots] = useState<StoredSnapshot[]>([]);

  const refresh = () => {
    void listSnapshots().then(setSnapshots);
  };

  useEffect(() => {
    refresh();
  }, [refreshKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Saved snapshots</CardTitle>
        <CardDescription>
          Stored on this device only (max {MAX_SNAPSHOTS}). Compare an older export to see unfollows.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {canSave && onSaveCurrent ? (
          <Button type="button" variant="secondary" className="w-full" onClick={onSaveCurrent}>
            Save current result to this device
          </Button>
        ) : null}

        {snapshots.length === 0 ? (
          <p className="text-sm text-muted">No snapshots yet. Analyze a ZIP and save it for later comparison.</p>
        ) : (
          <ul className="space-y-2">
            {snapshots.map((s) => {
              const exportMs = snapshotExportDate(s);
              return (
              <li key={s.id} className="@container rounded-xl border border-border p-3">
                <div className="flex flex-col gap-3 @[28rem]:flex-row @[28rem]:items-start">
                <div className="min-w-0 flex-1">
                  <textarea
                    title={s.label}
                    rows={2}
                    aria-label="Snapshot name"
                    className="w-full resize-none break-words bg-transparent text-sm font-medium leading-5 outline-none focus:underline"
                    defaultValue={s.label}
                    onBlur={(e) => {
                      if (s.id != null && e.target.value.trim()) {
                        void updateSnapshotLabel(s.id, e.target.value.trim()).then(refresh);
                      }
                    }}
                  />
                  <p className="mt-1 text-xs leading-relaxed text-pretty text-muted">
                    {formatNumber(s.followerCount)} followers
                    <span className="mt-0.5 block">
                      {exportMs != null
                        ? `Export ${formatSnapshotDate(exportMs)}`
                        : "Export date unknown"}
                    </span>
                    <span className="mt-0.5 block">
                      Saved {formatSnapshotDate(s.savedAt ?? s.createdAt)}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={compareId === s.id ? "default" : "outline"}
                    onClick={() => {
                      if (s.id == null) return;
                      const next = compareId === s.id ? null : s.id;
                      onCompareChange(next);
                      onApplyCompare(next == null ? null : s);
                    }}
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
                      if (s.id != null) void deleteSnapshot(s.id).then(refresh);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
