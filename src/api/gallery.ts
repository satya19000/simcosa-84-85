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

export interface GalleryComment {
  id: string;
  comment: string;
  user_id: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

export interface GalleryRow {
  id: string;
  title: string | null;
  caption: string | null;
  media_type: string;
  storage_path: string;
  file_url: string | null;
  uploaded_by: string | null;
  created_at: string;
  gallery_likes: { user_id: string }[];
  gallery_comments: GalleryComment[];
}

export const listGallery = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .handler(async (): Promise<GalleryRow[]> => {
    const res = await query<GalleryRow>(
      `SELECT g.id, g.title, g.caption, g.media_type, g.storage_path,
         COALESCE(g.file_url, CASE WHEN g.data IS NOT NULL THEN '/api/gallery/'||g.id ELSE NULL END) AS file_url,
         g.uploaded_by, g.created_at,
         COALESCE((
           SELECT json_agg(json_build_object('user_id', gl.user_id))
           FROM gallery_likes gl WHERE gl.gallery_item_id = g.id
         ), '[]'::json) AS gallery_likes,
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', gc.id, 'comment', gc.comment, 'user_id', gc.user_id,
             'created_at', gc.created_at,
             'profiles', json_build_object('full_name', cp.full_name)
           ) ORDER BY gc.created_at ASC)
           FROM gallery_comments gc
           LEFT JOIN profiles cp ON cp.id = gc.user_id
           WHERE gc.gallery_item_id = g.id AND gc.deleted_at IS NULL
         ), '[]'::json) AS gallery_comments
       FROM gallery_items g WHERE g.deleted_at IS NULL ORDER BY g.created_at DESC`,
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

export const toggleGalleryLike = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { galleryItemId: string; liked: boolean }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    if (data.liked) {
      await query(
        `DELETE FROM gallery_likes WHERE gallery_item_id = $1 AND user_id = $2`,
        [data.galleryItemId, context.userId],
      );
    } else {
      await query(
        `INSERT INTO gallery_likes (gallery_item_id, user_id) VALUES ($1, $2)
         ON CONFLICT (gallery_item_id, user_id) DO NOTHING`,
        [data.galleryItemId, context.userId],
      );
    }
    return { ok: true };
  });

export const addGalleryComment = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { galleryItemId: string; comment: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const comment = data.comment.trim();
    if (!comment) throw new Error("Comment is required");
    await query(
      `INSERT INTO gallery_comments (gallery_item_id, user_id, comment) VALUES ($1, $2, $3)`,
      [data.galleryItemId, context.userId, comment],
    );
    return { ok: true };
  });

export const deleteGalleryComment = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const owned = await query<{ user_id: string }>(
      `SELECT user_id FROM gallery_comments WHERE id = $1 AND deleted_at IS NULL`,
      [data.id],
    );
    const row = owned.rows[0];
    if (!row) throw new Error("Comment not found");
    if (row.user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");

    await query(`UPDATE gallery_comments SET deleted_at = now() WHERE id = $1`, [data.id]);
    return { ok: true };
  });
