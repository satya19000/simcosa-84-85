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
  uploaded_by: string | null;
  created_at: string;
}

export const listGallery = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .handler(async (): Promise<GalleryRow[]> => {
    const res = await query<GalleryRow>(
      `SELECT id, title, caption, media_type, storage_path, uploaded_by, created_at
       FROM gallery_items ORDER BY created_at DESC`,
    );
    return res.rows;
  });

export const uploadGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: FormData) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const file = data.get("file") as File | null;
    const caption = String(data.get("caption") ?? "");
    if (!file || typeof file === "string") {
      throw new Error("No file provided");
    }
    const mediaType = file.type.startsWith("video")
      ? "video"
      : file.type.startsWith("image")
        ? "image"
        : "document";
    if (mediaType === "image" && !ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw new Error("Unsupported image format. Please use JPG, PNG, or WEBP.");
    }
    if (mediaType === "document" && !ALLOWED_DOC_TYPES.has(file.type)) {
      throw new Error("Unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX.");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error("File is too large. Maximum size is 15MB.");
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    await query(
      `INSERT INTO gallery_items (storage_path, caption, media_type, mime, data, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [file.name, caption || null, mediaType, file.type || "application/octet-stream", bytes, context.userId],
    );
    return { ok: true };
  });

export const deleteGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const owned = await query<{ uploaded_by: string | null }>(
      `SELECT uploaded_by FROM gallery_items WHERE id = $1`,
      [data.id],
    );
    const row = owned.rows[0];
    if (!row) throw new Error("Item not found");
    if (row.uploaded_by !== context.userId && !context.isAdmin) throw new Error("Forbidden");

    await query(`DELETE FROM gallery_items WHERE id = $1`, [data.id]);
    return { ok: true };
  });
