import { BlobReader, BlobWriter, ZipWriter, configure } from "@zip.js/zip.js";
import { gridFrame, sourceRectForTile, tileFilename, tilesInPostingOrder } from "./geometry";
import { JPEG_QUALITY, type CoverTransform, type GridImageSource, type GridMode, type ProfileLayout, type TileShape } from "./types";

configure({ useWebWorkers: false });

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function fillWhite(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
}

export async function renderTileJpeg(
  image: GridImageSource,
  imageW: number,
  imageH: number,
  frame: ReturnType<typeof gridFrame>,
  transform: CoverTransform,
  col: number,
  row: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = frame.tileW;
  canvas.height = frame.tileH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  fillWhite(ctx, frame.tileW, frame.tileH);
  const src = sourceRectForTile(imageW, imageH, frame, transform, col, row);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, src.x, src.y, src.w, src.h, 0, 0, frame.tileW, frame.tileH);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });
  if (!blob) throw new Error("Couldn’t encode a tile. Try a smaller image.");
  return blob;
}

export async function buildTilesZip(
  image: GridImageSource,
  imageW: number,
  imageH: number,
  mode: GridMode,
  layout: ProfileLayout,
  slides: number,
  shape: TileShape,
  transform: CoverTransform,
): Promise<{ zip: Blob; count: number }> {
  const frame = gridFrame(mode, layout, slides, shape);
  const tiles = tilesInPostingOrder(mode, frame.cols, frame.rows);
  const zipWriter = new ZipWriter(new BlobWriter("application/zip"));

  for (const tile of tiles) {
    const jpeg = await renderTileJpeg(image, imageW, imageH, frame, transform, tile.col, tile.row);
    await zipWriter.add(tileFilename(tile.fileIndex), new BlobReader(jpeg));
  }

  const zip = await zipWriter.close();
  return { zip, count: tiles.length };
}

export async function renderAllTileBlobs(
  image: GridImageSource,
  imageW: number,
  imageH: number,
  mode: GridMode,
  layout: ProfileLayout,
  slides: number,
  shape: TileShape,
  transform: CoverTransform,
): Promise<Array<{ name: string; blob: Blob }>> {
  const frame = gridFrame(mode, layout, slides, shape);
  const tiles = tilesInPostingOrder(mode, frame.cols, frame.rows);
  const out: Array<{ name: string; blob: Blob }> = [];
  for (const tile of tiles) {
    const jpeg = await renderTileJpeg(image, imageW, imageH, frame, transform, tile.col, tile.row);
    out.push({ name: tileFilename(tile.fileIndex), blob: jpeg });
  }
  return out;
}
