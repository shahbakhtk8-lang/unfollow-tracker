import type { GridImageSource } from "./types";

export async function decodeGridImage(file: File): Promise<GridImageSource> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      return await createImageBitmap(file);
    }
  }

  return loadHtmlImage(file);
}

function loadHtmlImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn’t read that image. Try a different JPG, PNG, or WebP."));
    };
    image.src = url;
  });
}

export function releaseGridImage(image: GridImageSource | null): void {
  if (image && "close" in image && typeof image.close === "function") {
    image.close();
  }
}

export function createSampleGridFile(): Promise<File> {
  const size = 1800;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas is not available in this browser."));

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#4f46e5");
  gradient.addColorStop(0.45, "#7c3aed");
  gradient.addColorStop(1, "#ec4899");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 8;
  for (let i = 1; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo((size / 3) * i, 0);
    ctx.lineTo((size / 3) * i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, (size / 3) * i);
    ctx.lineTo(size, (size / 3) * i);
    ctx.stroke();
  }

  const circles: Array<[number, number, string]> = [
    [300, 320, "#fde68a"],
    [900, 500, "#a7f3d0"],
    [1450, 280, "#fda4af"],
    [400, 1100, "#93c5fd"],
    [980, 1280, "#f9a8d4"],
    [1500, 1180, "#c4b5fd"],
  ];
  for (const [x, y, color] of circles) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 140, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(15,23,42,0.55)";
  ctx.fillRect(size * 0.18, size * 0.4, size * 0.64, 220);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 92px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Sample grid", size / 2, size * 0.5 + 20);
  ctx.font = "500 36px Inter, system-ui, sans-serif";
  ctx.fillText("Keep faces off the seams", size / 2, size * 0.5 + 80);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Couldn’t create a sample image."));
          return;
        }
        resolve(new File([blob], "sample-grid.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  });
}
