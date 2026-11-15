import { useCallback, useRef, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_IMAGE_BYTES, validateGridImage } from "@/lib/instagramGrid";

interface ImageDropzoneProps {
  onFile: (file: File) => void;
  onSample?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ImageDropzone({ onFile, onSample, disabled, className }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || disabled) return;
      const error = validateGridImage(file);
      if (error) {
        setMessage(error);
        return;
      }
      setMessage(null);
      onFile(file);
    },
    [disabled, onFile],
  );

  return (
    <div
      data-testid="grid-image-dropzone"
      className={cn(
        "relative rounded-2xl border-2 border-dashed transition-colors p-8 sm:p-10",
        dragOver ? "border-primary bg-primary/5" : "border-border bg-card/80",
        disabled && "pointer-events-none opacity-60",
        className,
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
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        data-testid="grid-image-input"
        aria-label="Upload image to split into Instagram tiles"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          {dragOver ? <ImagePlus className="h-7 w-7" aria-hidden /> : <Upload className="h-7 w-7" aria-hidden />}
        </div>
        <p className="font-display text-base font-bold sm:text-lg">Drop one photo to split</p>
        <p className="mt-1 max-w-md text-sm text-muted">
          JPG, PNG, or WebP · up to {Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB · Never uploaded
          to our servers
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-indigo-500/20 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Choose image
          </button>
          {onSample ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onSample}
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-border/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Try sample
            </button>
          ) : null}
        </div>
        {message ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
