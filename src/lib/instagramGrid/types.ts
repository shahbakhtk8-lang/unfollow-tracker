export type GridMode = "profile" | "carousel";

export type TileShape = "1:1" | "4:5" | "3:4";

export type ProfileLayout = "3x1" | "3x2" | "3x3";

export type GridImageSource = ImageBitmap | HTMLImageElement;

export interface TileSize {
  width: number;
  height: number;
}

export interface GridFrame {
  cols: number;
  rows: number;
  tileW: number;
  tileH: number;
  frameW: number;
  frameH: number;
}

export interface CoverTransform {
  /** 1 = cover the frame; values above 1 zoom in. */
  zoom: number;
  /** -1 (left/top overflow) to 1 (right/bottom overflow). */
  panX: number;
  panY: number;
}

export interface ImagePlacement {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GridTile {
  col: number;
  row: number;
  /** 0-based left-to-right, top-to-bottom. */
  visualIndex: number;
  /** 1-based filename index (tile_01 first). */
  fileIndex: number;
}

export const TILE_SIZES: Record<TileShape, TileSize> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "3:4": { width: 1080, height: 1440 },
};

export const PROFILE_LAYOUTS: Record<ProfileLayout, { cols: 3; rows: 1 | 2 | 3 }> = {
  "3x1": { cols: 3, rows: 1 },
  "3x2": { cols: 3, rows: 2 },
  "3x3": { cols: 3, rows: 3 },
};

/** Instagram profile grid thumbnail ratio (width / height), 2025–2026. */
export const INSTAGRAM_PROFILE_CROP = 3 / 4;

export const DEFAULT_TRANSFORM: CoverTransform = { zoom: 1, panX: 0, panY: 0 };

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const MIN_CAROUSEL_SLIDES = 2;
export const MAX_CAROUSEL_SLIDES = 10;
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const JPEG_QUALITY = 0.92;
