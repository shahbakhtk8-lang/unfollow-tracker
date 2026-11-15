import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  gridFrame,
  sourceRectForProfileCrop,
  sourceRectForTile,
  tilesInVisualOrder,
  type CoverTransform,
  type GridImageSource,
  type GridMode,
  type ProfileLayout,
  type TileShape,
} from "@/lib/instagramGrid";

interface ProfilePreviewProps {
  image: GridImageSource;
  imageW: number;
  imageH: number;
  mode: GridMode;
  layout: ProfileLayout;
  slides: number;
  shape: TileShape;
  transform: CoverTransform;
  className?: string;
}

export function ProfilePreview({
  image,
  imageW,
  imageH,
  mode,
  layout,
  slides,
  shape,
  transform,
  className,
}: ProfilePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const frame = gridFrame(mode, layout, slides, shape);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cssWidth = wrap.clientWidth;
    if (cssWidth <= 0) return;
    const gap = 3;
    const cols = frame.cols;
    const rows = mode === "profile" ? frame.rows : 1;
    const cellW = (cssWidth - gap * (cols - 1)) / cols;
    const cellRatio = mode === "profile" ? 3 / 4 : frame.tileW / frame.tileH;
    const cellH = cellW / cellRatio;
    const cssHeight = cellH * rows + gap * (rows - 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const tiles = tilesInVisualOrder(frame.cols, frame.rows);
    for (const tile of tiles) {
      const dx = tile.col * (cellW + gap);
      const dy = tile.row * (cellH + gap);
      const src =
        mode === "profile"
          ? sourceRectForProfileCrop(imageW, imageH, frame, transform, tile.col, tile.row)
          : sourceRectForTile(imageW, imageH, frame, transform, tile.col, tile.row);
      ctx.save();
      ctx.beginPath();
      ctx.rect(dx, dy, cellW, cellH);
      ctx.clip();
      ctx.drawImage(image, src.x, src.y, src.w, src.h, dx, dy, cellW, cellH);
      ctx.restore();
    }
  }, [frame, image, imageH, imageW, mode, transform]);

  useEffect(() => {
    draw();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div className={cn(className)}>
      <h2 className="font-display text-lg font-bold">
        {mode === "profile" ? "Profile preview (3:4 crop)" : "Carousel slides"}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {mode === "profile"
          ? "This matches Instagram’s 2025–2026 profile grid, which crops every thumbnail to 3:4 — not the old 1:1 square."
          : "Every slide uses the same shape. Swipe order is left to right: 01 is the first photo in the carousel."}
      </p>
      <div ref={wrapRef} className="mt-3 min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
        <canvas ref={canvasRef} className="block w-full max-w-full" data-testid="grid-profile-preview" />
      </div>
    </div>
  );
}
