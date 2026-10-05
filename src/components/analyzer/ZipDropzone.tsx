import { useCallback, useRef, useState } from "react";
import { Upload, FileArchive } from "lucide-react";
import { cn } from "@/lib/utils";

interface ZipDropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  label?: string;
  compact?: boolean;
}

const LARGE_ZIP_BYTES = 500 * 1024 * 1024;

export function ZipDropzone({ onFile, disabled, label, compact }: ZipDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingLarge, setPendingLarge] = useState<File | null>(null);

  const acceptFile = useCallback(
    (file: File) => {
      setMessage(null);
      setPendingLarge(null);
      onFile(file);
    },
    [onFile],
  );

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || disabled) return;
      if (!file.name.toLowerCase().endsWith(".zip")) {
        setPendingLarge(null);
        setMessage("Please upload a .zip file from Instagram's data export.");
        return;
      }
      if (file.size > LARGE_ZIP_BYTES) {
        setMessage(null);
        setPendingLarge(file);
        return;
      }
      acceptFile(file);
    },
    [acceptFile, disabled],
  );

  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-dashed transition-colors",
        dragOver ? "border-primary bg-primary/5" : "border-border bg-card/80",
        compact ? "p-4" : "p-8 sm:p-10",
        disabled && "pointer-events-none opacity-60",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        aria-label="Upload Instagram ZIP export"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="flex flex-col items-center text-center">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary"
        >
          {dragOver ? <FileArchive className="h-7 w-7" /> : <Upload className="h-7 w-7" />}
        </div>
        <p className="font-display text-base font-bold sm:text-lg">
          {label ?? "Drop your Instagram export .zip"}
        </p>
        <p className="mt-1 max-w-md text-sm text-muted">
          Official Meta export · JSON or HTML · Never uploaded to our servers
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/20 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Choose file
        </button>
        {message ? <p className="mt-3 text-sm text-danger">{message}</p> : null}
        {pendingLarge ? (
          <div className="mt-3 max-w-md text-sm text-muted">
            <p>
              This file is over 500 MB. Close other tabs to free memory before continuing.
            </p>
            <div className="mt-2 flex justify-center gap-2">
              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                onClick={() => acceptFile(pendingLarge)}
              >
                Continue anyway
              </button>
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                onClick={() => setPendingLarge(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
