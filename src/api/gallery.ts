import { createServerFn } from "@tanstack/react-start";
import { requireApproved } from "../backend/auth/middleware";
import { query } from "../backend/db";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const ALLOWED_DOC_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export interface GalleryRow {
  id: string;
  title: string | null;
  caption: string | null;
  media_type: string;
  storage_path: string;
  file_url: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export const listGallery = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .handler(async (): Promise<GalleryRow[]> => {
    const res = await query<GalleryRow>(
      `SELECT id, title, caption, media_type, storage_path,
         COALESCE(file_url, CASE WHEN data IS NOT NULL THEN '/api/gallery/'||id ELSE NULL END) AS file_url,
         uploaded_by, created_at
       FROM gallery_items WHERE deleted_at IS NULL ORDER BY created_at DESC`,
    );
    return res.rows;
  });

export interface UploadGalleryItemInput {
  url: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  caption?: string;
}

export const uploadGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: UploadGalleryItemInput) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { url, storagePath, fileName, mimeType, fileSize, caption } = data;
    if (!url || !storagePath || !fileName) {
      throw new Error("No file provided");
    }
    const mediaType = mimeType.startsWith("video")
      ? "video"
      : mimeType.startsWith("image")
        ? "image"
        : "document";
    if (mediaType === "image" && !ALLOWED_IMAGE_TYPES.has(mimeType)) {
      throw new Error("Unsupported image format. Please use JPG, PNG, or WEBP.");
    }
    if (mediaType === "document" && !ALLOWED_DOC_TYPES.has(mimeType)) {
      throw new Error("Unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX.");
    }
    if (fileSize > MAX_UPLOAD_BYTES) {
      throw new Error("This file is too large. Please upload a smaller image or compressed version.");
    }
    await query(
      `INSERT INTO gallery_items
         (storage_path, caption, media_type, mime, file_url, fb_storage_path, file_name, mime_type, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        fileName,
        caption || null,
        mediaType,
        mimeType || "application/octet-stream",
        url,
        storagePath,
        fileName,
        mimeType || "application/octet-stream",
        fileSize,
        context.userId,
      ],
    );
    return { ok: true };
  });

export const deleteGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true; fbStoragePath: string | null }> => {
    const owned = await query<{ uploaded_by: string | null; fb_storage_path: string | null }>(
      `SELECT uploaded_by, fb_storage_path FROM gallery_items WHERE id = $1`,
      [data.id],
    );
    const row = owned.rows[0];
    if (!row) throw new Error("Item not found");
    if (row.uploaded_by !== context.userId && !context.isAdmin) throw new Error("Forbidden");

    await query(`DELETE FROM gallery_items WHERE id = $1`, [data.id]);
    return { ok: true, fbStoragePath: row.fb_storage_path };
  });
