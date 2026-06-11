import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "../backend/auth/middleware";
import { query } from "../backend/db";

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
  .middleware([requireAuth])
  .handler(async (): Promise<GalleryRow[]> => {
    const res = await query<GalleryRow>(
      `SELECT id, title, caption, media_type, storage_path, uploaded_by, created_at
       FROM gallery_items ORDER BY created_at DESC`,
    );
    return res.rows;
  });

export const uploadGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: FormData) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const file = data.get("file") as File | null;
    const caption = String(data.get("caption") ?? "");
    if (!file || typeof file === "string") {
      throw new Error("No file provided");
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const mediaType = file.type.startsWith("video") ? "video" : "image";
    await query(
      `INSERT INTO gallery_items (storage_path, caption, media_type, mime, data, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [file.name, caption || null, mediaType, file.type || "application/octet-stream", bytes, context.userId],
    );
    return { ok: true };
  });
