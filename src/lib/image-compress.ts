// Client-side image optimisation before Firebase upload.
//
// Strategy: convert every compressible image to WebP at 80% quality and
// max 1920 px on the longer edge. WebP typically cuts JPEG/PNG sizes by
// 50-80%. The result is only used when it is strictly smaller than the
// original; otherwise the original is returned unchanged. Never throws —
// any failure returns the original file untouched.

const COMPRESSIBLE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
  /** Force output MIME type. Defaults to "image/webp" when browser supports it. */
  outputType?: string;
}

/** Returns a human-readable size string, e.g. "1.2 MB" or "340 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

/** Compresses and converts to WebP when beneficial. Returns original if result is not smaller. */
export async function compressImage(
  file: File,
  opts?: CompressImageOptions,
): Promise<File> {
  const maxDimension = opts?.maxDimension ?? 1920;
  const quality = opts?.quality ?? 0.82;
  const preferredOutputType = opts?.outputType ?? "image/webp";

  if (!file.type.startsWith("image/") || !COMPRESSIBLE_TYPES.has(file.type)) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const longerEdge = Math.max(width, height);

    const needsResize = longerEdge > maxDimension;
    const scale = needsResize ? maxDimension / longerEdge : 1;
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    // Try preferred output type (WebP) first; fall back to original type.
    const tryEncode = (mimeType: string): Promise<Blob | null> =>
      new Promise((resolve) => canvas.toBlob((b) => resolve(b), mimeType, quality));

    let blob = await tryEncode(preferredOutputType);
    let outputType = preferredOutputType;

    // If preferred type unsupported or somehow larger, try original type (only when resizing).
    if (!blob || blob.size === 0 || (blob.size >= file.size && !needsResize)) {
      if (preferredOutputType !== file.type) {
        const fallback = await tryEncode(file.type);
        if (fallback && fallback.size > 0 && fallback.size < file.size) {
          blob = fallback;
          outputType = file.type;
        } else {
          return file;
        }
      } else {
        return file;
      }
    }

    // When we resized, any blob that fits is worth keeping even if slightly larger
    // (the dimension reduction is the win). When we didn't resize, only keep if smaller.
    if (!needsResize && blob.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const ext = outputType === "image/webp" ? ".webp"
      : outputType === "image/jpeg" ? ".jpg"
      : outputType === "image/png" ? ".png"
      : file.name.match(/\.[^.]+$/)?.[0] ?? "";
    const outputName = baseName + ext;

    return new File([blob], outputName, { type: outputType });
  } catch {
    return file;
  }
}
