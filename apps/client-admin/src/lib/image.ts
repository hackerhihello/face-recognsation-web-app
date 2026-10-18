// Browser-only helpers that check and normalise a face photo before upload.
// The Face API docs don't publish image requirements, so the hard limits here
// are conservative; lighting checks are advisory warnings, not rejections.

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MIN_IMAGE_SIDE = 320;
const MAX_OUTPUT_SIDE = 1280;
const JPEG_QUALITY = 0.9;

export interface PreparedImage {
  /** JPEG data URL, at most 1280 px on the long side. */
  dataUrl: string;
  width: number;
  height: number;
  /** Approximate decoded size of the JPEG. */
  bytes: number;
  source: "camera" | "upload";
  warnings: string[];
}

/** A photo that can't be used; the message is shown to the user as-is. */
export class ImageCheckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageCheckError";
  }
}

export async function imageFromFile(file: File): Promise<PreparedImage> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new ImageCheckError("Use a JPEG, PNG or WebP photo.");
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageCheckError("This photo is larger than 10 MB. Use a smaller one.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageCheckError("This file couldn't be read as an image.");
  }
  try {
    return prepare(bitmap, bitmap.width, bitmap.height, "upload");
  } finally {
    bitmap.close();
  }
}

/** Captures the current frame, unmirrored, so the stored photo matches reality. */
export function imageFromVideo(video: HTMLVideoElement): PreparedImage {
  return prepare(video, video.videoWidth, video.videoHeight, "camera");
}

function prepare(source: CanvasImageSource, width: number, height: number, origin: PreparedImage["source"]): PreparedImage {
  if (!width || !height) throw new ImageCheckError("The image is empty. Try again.");
  if (Math.min(width, height) < MIN_IMAGE_SIDE) {
    throw new ImageCheckError(
      `This photo is too small (${width}×${height}). Use one that is at least ${MIN_IMAGE_SIDE} pixels on its shorter side.`,
    );
  }
  const scale = Math.min(1, MAX_OUTPUT_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageCheckError("Your browser couldn't process the image.");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  return {
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    bytes: Math.round(((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4),
    source: origin,
    warnings: lightingWarnings(canvas),
  };
}

function lightingWarnings(image: HTMLCanvasElement): string[] {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(image, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  let sum = 0;
  let sumSq = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    sum += luma;
    sumSq += luma * luma;
  }
  const mean = sum / n;
  const spread = Math.sqrt(Math.max(sumSq / n - mean * mean, 0));

  const warnings: string[] = [];
  if (mean < 60) warnings.push("The photo looks dark. Face the light or turn on more lights.");
  else if (mean > 200) warnings.push("The photo looks overexposed. Move away from direct light.");
  if (spread < 15) warnings.push("The photo has very little detail. Check that the camera isn't covered or out of focus.");
  return warnings;
}

export function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
