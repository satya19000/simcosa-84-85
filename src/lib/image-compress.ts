// Client-side image downscale/recompress before upload, to keep Firebase
// Storage uploads small and fast. Only operates on jpg/jpeg/png/webp —
// gif/svg and non-image files are passed through unchanged. Never throws;
// on any failure it falls back to returning the original file untouched.

const COMPRESSIBLE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
}

export async function compressImage(
  file: File,
  opts?: CompressImageOptions,
): Promise<File> {
  const maxDimension = opts?.maxDimension ?? 1800;
  const quality = opts?.quality ?? 0.9;

  if (!file.type.startsWith("image/") || !COMPRESSIBLE_TYPES.has(file.type)) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const longerEdge = Math.max(width, height);

    if (longerEdge <= maxDimension) {
      // Already within bounds; only worth re-encoding if it would shrink the
      // file, which we can't know without doing the work — and the spec says
      // to keep the original when dimensions are already in bounds and the
      // result isn't smaller, so just return as-is for simplicity/safety.
      bitmap.close?.();
      return file;
    }

    const scale = maxDimension / longerEdge;
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
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), file.type, quality);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    return new File([blob], file.name, { type: file.type });
  } catch {
    return file;
  }
}
