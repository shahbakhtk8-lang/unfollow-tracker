import {
  INSTAGRAM_PROFILE_CROP,
  MAX_CAROUSEL_SLIDES,
  MAX_ZOOM,
  MIN_CAROUSEL_SLIDES,
  MIN_ZOOM,
  PROFILE_LAYOUTS,
  TILE_SIZES,
  type CoverTransform,
  type GridFrame,
  type GridMode,
  type GridTile,
  type ImagePlacement,
  type ProfileLayout,
  type Rect,
  type TileShape,
} from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampZoom(zoom: number): number {
  return clamp(zoom, MIN_ZOOM, MAX_ZOOM);
}

export function clampPan(value: number): number {
  return clamp(value, -1, 1);
}

export function clampCarouselSlides(slides: number): number {
  return Math.round(clamp(slides, MIN_CAROUSEL_SLIDES, MAX_CAROUSEL_SLIDES));
}

export function gridFrame(
  mode: GridMode,
  layout: ProfileLayout,
  slides: number,
  shape: TileShape,
): GridFrame {
  const { width: tileW, height: tileH } = TILE_SIZES[shape];
  if (mode === "carousel") {
    const cols = clampCarouselSlides(slides);
    return {
      cols,
      rows: 1,
      tileW,
      tileH,
      frameW: tileW * cols,
      frameH: tileH,
    };
  }
  const { cols, rows } = PROFILE_LAYOUTS[layout];
  return {
    cols,
    rows,
    tileW,
    tileH,
    frameW: tileW * cols,
    frameH: tileH * rows,
  };
}

export function imagePlacement(
  imageW: number,
  imageH: number,
  frame: GridFrame,
  transform: CoverTransform,
): ImagePlacement {
  const zoom = clampZoom(transform.zoom);
  const panX = clampPan(transform.panX);
  const panY = clampPan(transform.panY);
  const cover = Math.max(frame.frameW / imageW, frame.frameH / imageH);
  const scale = cover * zoom;
  const w = imageW * scale;
  const h = imageH * scale;
  const extraX = Math.max(0, w - frame.frameW);
  const extraY = Math.max(0, h - frame.frameH);
  const x = (frame.frameW - w) / 2 + panX * (extraX / 2);
  const y = (frame.frameH - h) / 2 + panY * (extraY / 2);
  return { x, y, w, h, scale };
}

/** Source rectangle on the original image that maps to a destination tile. */
export function sourceRectForTile(
  imageW: number,
  imageH: number,
  frame: GridFrame,
  transform: CoverTransform,
  col: number,
  row: number,
): Rect {
  const place = imagePlacement(imageW, imageH, frame, transform);
  return {
    x: (col * frame.tileW - place.x) / place.scale,
    y: (row * frame.tileH - place.y) / place.scale,
    w: frame.tileW / place.scale,
    h: frame.tileH / place.scale,
  };
}

/**
 * Instagram profile thumbnails are 3:4. Square and 4:5 posts are center-cropped
 * (sides trimmed) so the grid no longer matches a 1:1 preview.
 */
export function instagramProfileCrop(tileW: number, tileH: number): Rect {
  const current = tileW / tileH;
  const target = INSTAGRAM_PROFILE_CROP;
  if (current > target) {
    const w = tileH * target;
    return { x: (tileW - w) / 2, y: 0, w, h: tileH };
  }
  if (current < target) {
    const h = tileW / target;
    return { x: 0, y: (tileH - h) / 2, w: tileW, h };
  }
  return { x: 0, y: 0, w: tileW, h: tileH };
}

export function sourceRectForProfileCrop(
  imageW: number,
  imageH: number,
  frame: GridFrame,
  transform: CoverTransform,
  col: number,
  row: number,
): Rect {
  const tile = sourceRectForTile(imageW, imageH, frame, transform, col, row);
  const crop = instagramProfileCrop(frame.tileW, frame.tileH);
  const scaleX = tile.w / frame.tileW;
  const scaleY = tile.h / frame.tileH;
  return {
    x: tile.x + crop.x * scaleX,
    y: tile.y + crop.y * scaleY,
    w: crop.w * scaleX,
    h: crop.h * scaleY,
  };
}

export function tilesInVisualOrder(cols: number, rows: number): GridTile[] {
  const tiles: GridTile[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const visualIndex = row * cols + col;
      tiles.push({ col, row, visualIndex, fileIndex: visualIndex + 1 });
    }
  }
  return tiles;
}

/**
 * Profile grids must be posted newest-first (top-left is the last post).
 * File index 1 = bottom-right tile = post first.
 */
export function tilesInPostingOrder(mode: GridMode, cols: number, rows: number): GridTile[] {
  const visual = tilesInVisualOrder(cols, rows);
  if (mode === "carousel") return visual;
  const reversed = [...visual].reverse();
  return reversed.map((tile, index) => ({ ...tile, fileIndex: index + 1 }));
}

export function tileFilename(fileIndex: number): string {
  return `tile_${String(fileIndex).padStart(2, "0")}.jpg`;
}

export function exportZipName(mode: GridMode, layout: ProfileLayout, slides: number): string {
  if (mode === "carousel") return `instagram-carousel-${String(clampCarouselSlides(slides))}.zip`;
  return `instagram-grid-${layout}.zip`;
}

export function postingLabel(fileIndex: number, total: number): string {
  if (fileIndex === 1) return "Post first";
  if (fileIndex === total) return "Post last";
  return `Post ${String(fileIndex)}`;
}
