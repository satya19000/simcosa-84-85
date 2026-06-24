import { createServerFn } from "@tanstack/react-start";
import { requireApproved } from "../backend/auth/middleware";
import { query } from "../backend/db";

const MAX_MEMORY_IMAGE_BYTES = 15 * 1024 * 1024;
const ALLOWED_MEMORY_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export interface MemoryComment {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

export interface MemoryImage {
  id: string;
  image_url: string;
  fb_storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  sort_order: number;
}

export interface MemoryRow {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  image_url: string | null;
  author_name: string | null;
  display_name: string;
  created_at: string;
  profiles: { full_name: string } | null;
  memory_likes: { user_id: string }[];
  memory_comments: MemoryComment[];
  images: MemoryImage[];
}

export const listMemories = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .handler(async (): Promise<MemoryRow[]> => {
    const res = await query<MemoryRow>(
      `SELECT
         m.id, m.user_id, m.title, m.body,
         CASE WHEN m.image_data IS NOT NULL THEN '/api/memories/image/' || m.id ELSE m.image_url END AS image_url,
         m.author_name,
         COALESCE(NULLIF(m.author_name, ''), p.full_name, 'Member') AS display_name,
         m.created_at,
         json_build_object('full_name', p.full_name) AS profiles,
         COALESCE((
           SELECT json_agg(json_build_object('user_id', ml.user_id))
           FROM memory_likes ml WHERE ml.memory_id = m.id
         ), '[]'::json) AS memory_likes,
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', mc.id, 'body', mc.body, 'user_id', mc.user_id,
             'created_at', mc.created_at,
             'profiles', json_build_object('full_name', cp.full_name)
           ) ORDER BY mc.created_at ASC)
           FROM memory_comments mc
           LEFT JOIN profiles cp ON cp.id = mc.user_id
           WHERE mc.memory_id = m.id
         ), '[]'::json) AS memory_comments,
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', mi.id, 'image_url', mi.image_url, 'fb_storage_path', mi.fb_storage_path,
             'file_name', mi.file_name, 'file_size', mi.file_size, 'sort_order', mi.sort_order
           ) ORDER BY mi.sort_order ASC, mi.created_at ASC)
           FROM memory_images mi WHERE mi.memory_id = m.id
         ), '[]'::json) AS images
       FROM memories m
       LEFT JOIN profiles p ON p.id = m.user_id
       ORDER BY m.created_at DESC`,
    );
    return res.rows.map((row) => {
      if (row.images && row.images.length > 0) return row;
      if (row.image_url) {
        return {
          ...row,
          images: [{ id: row.id, image_url: row.image_url, fb_storage_path: null, file_name: null, file_size: null, sort_order: 0 }],
        };
      }
      return row;
    });
  });

export interface PostMemoryInput {
  title?: string;
  body: string;
  authorName?: string;
}

export const postMemory = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: PostMemoryInput) => d)
  .handler(async ({ data, context }): Promise<{ ok: true; id: string }> => {
    const title = data.title ?? "";
    const body = data.body ?? "";
    if (!body.trim()) throw new Error("Memory body is required");
    // Only admins may post on behalf of someone else; members always show their own name.
    const authorName = context.isAdmin ? (data.authorName?.trim() || null) : null;

    const res = await query<{ id: string }>(
      `INSERT INTO memories (user_id, title, body, author_name) VALUES ($1, $2, $3, $4) RETURNING id`,
      [context.userId, title || null, body, authorName],
    );
    return { ok: true, id: res.rows[0].id };
  });

export interface MemoryImageInput {
  url: string;
  storagePath?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

export const addMemoryImages = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { memoryId: string; images: MemoryImageInput[] }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const owned = await query<{ user_id: string }>(`SELECT user_id FROM memories WHERE id = $1`, [data.memoryId]);
    const row = owned.rows[0];
    if (!row) throw new Error("Memory not found");
    if (row.user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");

    if (!data.images || data.images.length === 0) return { ok: true };

    // Fetch the current max sort_order so new images append after existing ones.
    const maxOrdRes = await query<{ max: number | null }>(
      `SELECT MAX(sort_order) AS max FROM memory_images WHERE memory_id = $1`,
      [data.memoryId],
    );
    let nextOrder = (maxOrdRes.rows[0]?.max ?? -1) + 1;

    for (const img of data.images) {
      if (!img.mimeType || !ALLOWED_MEMORY_IMAGE_TYPES.has(img.mimeType)) {
        throw new Error("Unsupported image format. Please use JPG, PNG, or WEBP.");
      }
      if ((img.fileSize ?? 0) > MAX_MEMORY_IMAGE_BYTES) {
        throw new Error("This file is too large. Please upload a smaller image or compressed version.");
      }
      // Server-side duplicate guard: skip if same memory already has same file_name + file_size.
      if (img.fileName && img.fileSize) {
        const dup = await query<{ id: string }>(
          `SELECT id FROM memory_images WHERE memory_id = $1 AND file_name = $2 AND file_size = $3 LIMIT 1`,
          [data.memoryId, img.fileName, img.fileSize],
        );
        if (dup.rows.length > 0) continue;
      }
      await query(
        `INSERT INTO memory_images (memory_id, image_url, fb_storage_path, file_name, mime_type, file_size, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [data.memoryId, img.url, img.storagePath || null, img.fileName || null, img.mimeType || null, img.fileSize ?? null, nextOrder++],
      );
    }
    return { ok: true };
  });

export const deleteMemoryImage = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true; fbStoragePath: string | null }> => {
    const owned = await query<{ fb_storage_path: string | null; memory_user_id: string }>(
      `SELECT mi.fb_storage_path, m.user_id AS memory_user_id
       FROM memory_images mi JOIN memories m ON m.id = mi.memory_id
       WHERE mi.id = $1`,
      [data.id],
    );
    const row = owned.rows[0];
    if (!row) throw new Error("Image not found");
    if (row.memory_user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");

    await query(`DELETE FROM memory_images WHERE id = $1`, [data.id]);
    return { ok: true, fbStoragePath: row.fb_storage_path };
  });

/** Owner or admin reorders all photos of one memory by supplying the full, newly-ordered list of image ids. */
export const reorderMemoryImages = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { memoryId: string; orderedImageIds: string[] }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const owned = await query<{ user_id: string }>(`SELECT user_id FROM memories WHERE id = $1`, [data.memoryId]);
    const row = owned.rows[0];
    if (!row) throw new Error("Memory not found");
    if (row.user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");

    const existing = await query<{ id: string }>(`SELECT id FROM memory_images WHERE memory_id = $1`, [data.memoryId]);
    const existingIds = new Set(existing.rows.map((r) => r.id));
    if (data.orderedImageIds.length !== existingIds.size || !data.orderedImageIds.every((id) => existingIds.has(id))) {
      throw new Error("Photo list is out of date. Please refresh and try again.");
    }

    await Promise.all(
      data.orderedImageIds.map((id, i) => query(`UPDATE memory_images SET sort_order = $1 WHERE id = $2`, [i, id])),
    );
    return { ok: true };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { memoryId: string; liked: boolean }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    if (data.liked) {
      await query(
        `DELETE FROM memory_likes WHERE memory_id = $1 AND user_id = $2`,
        [data.memoryId, context.userId],
      );
    } else {
      await query(
        `INSERT INTO memory_likes (memory_id, user_id) VALUES ($1, $2)
         ON CONFLICT (memory_id, user_id) DO NOTHING`,
        [data.memoryId, context.userId],
      );
    }
    return { ok: true };
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { memoryId: string; body: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await query(
      `INSERT INTO memory_comments (memory_id, user_id, body) VALUES ($1, $2, $3)`,
      [data.memoryId, context.userId, data.body],
    );
    return { ok: true };
  });

export const editMemory = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { id: string; title?: string; body: string; authorName?: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    if (!data.body.trim()) throw new Error("Memory body is required");
    const owned = await query<{ user_id: string }>(`SELECT user_id FROM memories WHERE id = $1`, [data.id]);
    const row = owned.rows[0];
    if (!row) throw new Error("Memory not found");
    if (row.user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");

    // Owner or admin may set/clear the display author name; clearing falls back to the uploader's profile name.
    const authorName = data.authorName?.trim() || null;

    await query(
      `UPDATE memories SET title = $1, body = $2, author_name = $3 WHERE id = $4`,
      [data.title || null, data.body, authorName, data.id],
    );
    return { ok: true };
  });

export const deleteMemory = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true; fbStoragePaths: string[] }> => {
    const owned = await query<{ user_id: string; fb_storage_path: string | null }>(
      `SELECT user_id, fb_storage_path FROM memories WHERE id = $1`,
      [data.id],
    );
    const row = owned.rows[0];
    if (!row) throw new Error("Memory not found");
    if (row.user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");

    const images = await query<{ fb_storage_path: string | null }>(
      `SELECT fb_storage_path FROM memory_images WHERE memory_id = $1`,
      [data.id],
    );

    await query(`DELETE FROM memories WHERE id = $1`, [data.id]);

    const fbStoragePaths = [row.fb_storage_path, ...images.rows.map((r) => r.fb_storage_path)].filter(
      (p): p is string => !!p,
    );
    return { ok: true, fbStoragePaths };
  });

export const deleteComment = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const owned = await query<{ user_id: string }>(`SELECT user_id FROM memory_comments WHERE id = $1`, [data.id]);
    const row = owned.rows[0];
    if (!row) throw new Error("Comment not found");
    if (row.user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");

    await query(`DELETE FROM memory_comments WHERE id = $1`, [data.id]);
    return { ok: true };
  });
