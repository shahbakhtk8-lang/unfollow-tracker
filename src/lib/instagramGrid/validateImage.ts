import { MAX_IMAGE_BYTES } from "./types";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp"];

function fileExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export function validateGridImage(file: File): string | null {
  if (file.size <= 0) return "That file looks empty. Try another JPG, PNG, or WebP.";
  if (file.size > MAX_IMAGE_BYTES) {
    return "Keep the image under 25 MB so it can be split in your browser.";
  }

  const ext = fileExtension(file.name);
  const type = file.type.toLowerCase();
  const heic =
    ext === ".heic" ||
    ext === ".heif" ||
    type.includes("heic") ||
    type.includes("heif");
  if (heic) {
    return "HEIC photos aren’t supported. Save or export the image as JPG, PNG, or WebP first.";
  }

  const typeOk = type === "" ? ALLOWED_EXT.includes(ext) : ALLOWED_TYPES.has(type);
  const extOk = ext === "" || ALLOWED_EXT.includes(ext);
  if (!typeOk || !extOk) {
    return "Use a JPG, PNG, or WebP image (up to 25 MB).";
  }
  return null;
}
