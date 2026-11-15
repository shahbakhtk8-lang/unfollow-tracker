import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  clampPan,
  clampZoom,
  gridFrame,
  imagePlacement,
  instagramProfileCrop,
  postingLabel,
  tilesInPostingOrder,
  type CoverTransform,
  type GridImageSource,
  type GridMode,
  type ProfileLayout,
  type TileShape,
} from "@/lib/instagramGrid";

interface CropStageProps {
  image: GridImageSource;
  imageW: number;
  imageH: number;
  mode: GridMode;
  layout: ProfileLayout;
  slides: number;
  shape: TileShape;
  transform: CoverTransform;
  showProfileCrop: boolean;
  onChange: (next: CoverTransform) => void;
  className?: string;
}

export function CropStage({
  image,
  imageW,
  imageH,
  mode,
  layout,
  slides,
  shape,
  transform,
  showProfileCrop,
  onChange,
  className,
}: CropStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const frame = gridFrame(mode, layout, slides, shape);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const maxW = wrap.clientWidth;
    if (maxW <= 0) return;
    const aspect = frame.frameW / frame.frameH;
    const maxH = Math.min(window.innerHeight * 0.52, 560);
    let cssWidth = maxW;
    let cssHeight = cssWidth / aspect;
    if (cssHeight > maxH) {
      cssHeight = Math.max(180, maxH);
      cssWidth = cssHeight * aspect;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sx = cssWidth / frame.frameW;
    const sy = cssHeight / frame.frameH;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    ctx.save();
    ctx.scale(sx, sy);
    const place = imagePlacement(imageW, imageH, frame, transform);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, place.x, place.y, place.w, place.h);

    const tiles = tilesInPostingOrder(mode, frame.cols, frame.rows);
    const total = tiles.length;

    if (showProfileCrop && mode === "profile") {
      const crop = instagramProfileCrop(frame.tileW, frame.tileH);
      ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
      for (const tile of tiles) {
        const x0 = tile.col * frame.tileW;
        const y0 = tile.row * frame.tileH;
        ctx.fillRect(x0, y0, crop.x, frame.tileH);
        ctx.fillRect(x0 + crop.x + crop.w, y0, frame.tileW - crop.x - crop.w, frame.tileH);
        ctx.fillRect(x0 + crop.x, y0, crop.w, crop.y);
        ctx.fillRect(
          x0 + crop.x,
          y0 + crop.y + crop.h,
          crop.w,
          frame.tileH - crop.y - crop.h,
        );
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = 4 / sx;
    for (let c = 1; c < frame.cols; c += 1) {
      ctx.beginPath();
      ctx.moveTo(c * frame.tileW, 0);
      ctx.lineTo(c * frame.tileW, frame.frameH);
      ctx.stroke();
    }
    for (let r = 1; r < frame.rows; r += 1) {
      ctx.beginPath();
      ctx.moveTo(0, r * frame.tileH);
      ctx.lineTo(frame.frameW, r * frame.tileH);
      ctx.stroke();
    }

    ctx.restore();

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    for (const tile of tiles) {
      const x = (tile.col * frame.tileW) * sx + 8;
      const y = (tile.row * frame.tileH) * sy + 8;
      const indexLabel = String(tile.fileIndex).padStart(2, "0");
      const caption = postingLabel(tile.fileIndex, total);
      ctx.font = "700 16px Inter, system-ui, sans-serif";
      const w = Math.max(ctx.measureText(indexLabel).width, ctx.measureText(caption).width) + 16;
      ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
      ctx.fillRect(x, y, w, 40);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(indexLabel, x + 8, y + 4);
      ctx.font = "600 10px Inter, system-ui, sans-serif";
      ctx.fillText(caption, x + 8, y + 22);
    }
  }, [frame, image, imageH, imageW, mode, showProfileCrop, transform]);

  useEffect(() => {
    draw();
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrap);
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const current = transformRef.current;
      const delta = event.deltaY > 0 ? -0.08 : 0.08;
      onChange({ ...current, zoom: clampZoom(current.zoom + delta) });
    };
    canvas?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      canvas?.removeEventListener("wheel", onWheel);
    };
  }, [draw, onChange]);

  const clientToPan = (dx: number, dy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const current = transformRef.current;
    const place = imagePlacement(imageW, imageH, frame, current);
    const extraX = Math.max(0, place.w - frame.frameW);
    const extraY = Math.max(0, place.h - frame.frameH);
    const displayScale = canvas.clientWidth / frame.frameW;
    const frameDx = dx / displayScale;
    const frameDy = dy / displayScale;
    const next: CoverTransform = {
      ...current,
      panX: extraX > 0 ? clampPan(current.panX + (frameDx * 2) / extraX) : current.panX,
      panY: extraY > 0 ? clampPan(current.panY + (frameDy * 2) / extraY) : current.panY,
    };
    transformRef.current = next;
    onChange(next);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={wrapRef}
        className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <canvas
          ref={canvasRef}
          data-testid="grid-crop-canvas"
          className="mx-auto block max-w-full touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => {
            (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pointers.current.size === 2) {
              const pts = [...pointers.current.values()];
              const a = pts[0]!;
              const b = pts[1]!;
              pinchStart.current = {
                distance: Math.hypot(a.x - b.x, a.y - b.y),
                zoom: transform.zoom,
              };
            }
          }}
          onPointerMove={(e) => {
            const prev = pointers.current.get(e.pointerId);
            if (!prev) return;
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pointers.current.size === 2 && pinchStart.current) {
              const pts = [...pointers.current.values()];
              const a = pts[0]!;
              const b = pts[1]!;
              const distance = Math.hypot(a.x - b.x, a.y - b.y);
              if (pinchStart.current.distance > 0) {
                onChange({
                  ...transform,
                  zoom: clampZoom(
                    pinchStart.current.zoom * (distance / pinchStart.current.distance),
                  ),
                });
              }
              return;
            }
            clientToPan(e.clientX - prev.x, e.clientY - prev.y);
          }}
          onPointerUp={(e) => {
            pointers.current.delete(e.pointerId);
            if (pointers.current.size < 2) pinchStart.current = null;
          }}
          onPointerCancel={(e) => {
            pointers.current.delete(e.pointerId);
            pinchStart.current = null;
          }}
          onDoubleClick={() => onChange({ zoom: 1, panX: 0, panY: 0 })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-3 text-sm">
          <span className="shrink-0 font-semibold">Zoom</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={transform.zoom}
            aria-label="Zoom image"
            className="h-2 w-full accent-primary"
            onChange={(e) => onChange({ ...transform, zoom: Number(e.target.value) })}
          />
          <span className="w-10 shrink-0 text-right text-xs text-muted">
            {transform.zoom.toFixed(1)}×
          </span>
        </label>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onChange({ zoom: 1, panX: 0, panY: 0 })}
        >
          Reset crop
        </Button>
      </div>
      <p className="text-xs text-muted">
        Drag to pan, pinch or scroll to zoom. Keep faces and text away from the white seams — those
        become the gaps between posts.
      </p>
    </div>
  );
}
