import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "../backend/auth/middleware";
import { query } from "../backend/db";

export type MediaSource = "gallery" | "memory_image" | "blog" | "event";

export interface MediaStats {
  gallery: { count: number; total_size: number; images: number; videos: number; documents: number; missing: number };
  memory_images: { count: number; total_size: number };
  blogs: { count: number; total_size: number };
  events: { count: number; total_size: number };
  total_files: number;
  total_size: number;
}

export interface MediaItem {
  id: string;
  source: MediaSource;
  media_type: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  file_url: string | null;
  fb_storage_path: string | null;
  file_available: boolean;
  uploaded_by_name: string | null;
  created_at: string;
  title: string | null;
}

export const adminGetMediaStats = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<MediaStats> => {
    const [galleryRes, memoryRes, blogRes, eventRes] = await Promise.all([
      query<{
        count: string; total_size: string;
        images: string; videos: string; documents: string; missing: string;
      }>(`
        SELECT
          COUNT(*)::text AS count,
          COALESCE(SUM(file_size), 0)::text AS total_size,
          COUNT(*) FILTER (WHERE media_type = 'image')::text AS images,
          COUNT(*) FILTER (WHERE media_type = 'video')::text AS videos,
          COUNT(*) FILTER (WHERE media_type = 'document')::text AS documents,
          COUNT(*) FILTER (
            WHERE file_url IS NULL
              AND (storage_path IS NULL OR storage_path !~* '^https?://')
          )::text AS missing
        FROM gallery_items WHERE deleted_at IS NULL
      `),
      query<{ count: string; total_size: string }>(`
        SELECT COUNT(*)::text AS count, COALESCE(SUM(file_size), 0)::text AS total_size
        FROM memory_images
      `),
      query<{ count: string; total_size: string }>(`
        SELECT COUNT(*)::text AS count, COALESCE(SUM(file_size), 0)::text AS total_size
        FROM blogs WHERE image_url IS NOT NULL OR fb_storage_path IS NOT NULL
      `),
      query<{ count: string; total_size: string }>(`
        SELECT COUNT(*)::text AS count, COALESCE(SUM(file_size), 0)::text AS total_size
        FROM events WHERE cover_url IS NOT NULL OR fb_storage_path IS NOT NULL
      `),
    ]);

    const g = galleryRes.rows[0];
    const mi = memoryRes.rows[0];
    const bl = blogRes.rows[0];
    const ev = eventRes.rows[0];

    const gallery = {
      count: Number(g.count),
      total_size: Number(g.total_size),
      images: Number(g.images),
      videos: Number(g.videos),
      documents: Number(g.documents),
      missing: Number(g.missing),
    };
    const memory_images = { count: Number(mi.count), total_size: Number(mi.total_size) };
    const blogs = { count: Number(bl.count), total_size: Number(bl.total_size) };
    const events = { count: Number(ev.count), total_size: Number(ev.total_size) };

    return {
      gallery,
      memory_images,
      blogs,
      events,
      total_files: gallery.count + memory_images.count + blogs.count + events.count,
      total_size: gallery.total_size + memory_images.total_size + blogs.total_size + events.total_size,
    };
  });

export interface AdminListMediaInput {
  source?: MediaSource | "all";
  media_type?: string;
  sort?: "newest" | "oldest" | "largest" | "smallest";
  limit?: number;
  offset?: number;
}

export const adminListMedia = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .inputValidator((d: AdminListMediaInput) => d)
  .handler(async ({ data }): Promise<MediaItem[]> => {
    const { source = "all", media_type, sort = "newest", limit = 100, offset = 0 } = data;

    const orderSql =
      sort === "oldest" ? "created_at ASC"
      : sort === "largest" ? "file_size DESC NULLS LAST"
      : sort === "smallest" ? "file_size ASC NULLS LAST"
      : "created_at DESC";

    const mediaTypeFilter = media_type && media_type !== "all" ? media_type : null;

    const rows: MediaItem[] = [];

    if (source === "all" || source === "gallery") {
      const res = await query<MediaItem>(`
        SELECT
          g.id, 'gallery'::text AS source, g.media_type,
          g.file_name, g.file_size, g.mime AS mime_type,
          CASE
            WHEN g.file_url IS NOT NULL THEN g.file_url
            WHEN g.storage_path ~* '^https?://' THEN g.storage_path
            ELSE NULL
          END AS file_url,
          g.fb_storage_path,
          (
            CASE
              WHEN g.file_url IS NOT NULL THEN TRUE
              WHEN g.storage_path ~* '^https?://' THEN TRUE
              ELSE FALSE
            END
          ) AS file_available,
          p.full_name AS uploaded_by_name,
          g.created_at,
          COALESCE(g.title, g.caption, g.file_name) AS title
        FROM gallery_items g
        LEFT JOIN profiles p ON p.id = g.uploaded_by
        WHERE g.deleted_at IS NULL
          ${mediaTypeFilter ? "AND g.media_type = $1" : ""}
        ORDER BY ${orderSql}
        LIMIT $${mediaTypeFilter ? 2 : 1} OFFSET $${mediaTypeFilter ? 3 : 2}
      `, mediaTypeFilter ? [mediaTypeFilter, limit, offset] : [limit, offset]);
      rows.push(...res.rows);
    }

    if ((source === "all" || source === "memory_image") && (!mediaTypeFilter || mediaTypeFilter === "image")) {
      const res = await query<MediaItem>(`
        SELECT
          mi.id, 'memory_image'::text AS source, 'image'::text AS media_type,
          mi.file_name, mi.file_size, mi.mime_type,
          mi.image_url AS file_url,
          mi.fb_storage_path,
          mi.image_url IS NOT NULL AS file_available,
          p.full_name AS uploaded_by_name,
          mi.created_at,
          COALESCE(m.title, 'Memory photo') AS title
        FROM memory_images mi
        JOIN memories m ON m.id = mi.memory_id
        LEFT JOIN profiles p ON p.id = m.user_id
        ORDER BY ${orderSql}
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      rows.push(...res.rows);
    }

    if ((source === "all" || source === "blog") && (!mediaTypeFilter || mediaTypeFilter === "image")) {
      const res = await query<MediaItem>(`
        SELECT
          b.id, 'blog'::text AS source, 'image'::text AS media_type,
          b.file_name, b.file_size, NULL::text AS mime_type,
          b.image_url AS file_url,
          b.fb_storage_path,
          b.image_url IS NOT NULL AS file_available,
          p.full_name AS uploaded_by_name,
          b.created_at,
          b.title
        FROM blogs b
        LEFT JOIN profiles p ON p.id = b.author_id
        WHERE b.image_url IS NOT NULL OR b.fb_storage_path IS NOT NULL
        ORDER BY ${orderSql}
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      rows.push(...res.rows);
    }

    if ((source === "all" || source === "event") && (!mediaTypeFilter || mediaTypeFilter === "image")) {
      const res = await query<MediaItem>(`
        SELECT
          e.id, 'event'::text AS source, 'image'::text AS media_type,
          e.file_name, e.file_size, NULL::text AS mime_type,
          e.cover_url AS file_url,
          e.fb_storage_path,
          e.cover_url IS NOT NULL AS file_available,
          p.full_name AS uploaded_by_name,
          e.created_at,
          e.title
        FROM events e
        LEFT JOIN profiles p ON p.id = e.created_by
        WHERE e.cover_url IS NOT NULL OR e.fb_storage_path IS NOT NULL
        ORDER BY ${orderSql}
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      rows.push(...res.rows);
    }

    // Re-sort merged results when pulling from multiple sources.
    if (source === "all") {
      rows.sort((a, b) => {
        if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sort === "largest") return (b.file_size ?? 0) - (a.file_size ?? 0);
        if (sort === "smallest") return (a.file_size ?? 0) - (b.file_size ?? 0);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    return rows.slice(0, limit);
  });

export const adminDeleteMediaItem = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string; source: MediaSource }) => d)
  .handler(async ({ data }): Promise<{ ok: true; fbStoragePath: string | null }> => {
    const { id, source } = data;

    if (source === "gallery") {
      const res = await query<{ fb_storage_path: string | null }>(
        `SELECT fb_storage_path FROM gallery_items WHERE id = $1`,
        [id],
      );
      if (!res.rows[0]) throw new Error("Item not found");
      await query(`UPDATE gallery_items SET deleted_at = now() WHERE id = $1`, [id]);
      return { ok: true, fbStoragePath: res.rows[0].fb_storage_path };
    }

    if (source === "memory_image") {
      const res = await query<{ fb_storage_path: string | null }>(
        `SELECT fb_storage_path FROM memory_images WHERE id = $1`,
        [id],
      );
      if (!res.rows[0]) throw new Error("Image not found");
      await query(`DELETE FROM memory_images WHERE id = $1`, [id]);
      return { ok: true, fbStoragePath: res.rows[0].fb_storage_path };
    }

    if (source === "blog") {
      const res = await query<{ fb_storage_path: string | null }>(
        `SELECT fb_storage_path FROM blogs WHERE id = $1`,
        [id],
      );
      if (!res.rows[0]) throw new Error("Blog not found");
      // Remove only the image, keep the blog post.
      await query(`UPDATE blogs SET image_url = NULL, fb_storage_path = NULL, file_name = NULL, file_size = NULL WHERE id = $1`, [id]);
      return { ok: true, fbStoragePath: res.rows[0].fb_storage_path };
    }

    if (source === "event") {
      const res = await query<{ fb_storage_path: string | null }>(
        `SELECT fb_storage_path FROM events WHERE id = $1`,
        [id],
      );
      if (!res.rows[0]) throw new Error("Event not found");
      // Remove only the cover image, keep the event.
      await query(`UPDATE events SET cover_url = NULL, fb_storage_path = NULL, file_name = NULL, file_size = NULL WHERE id = $1`, [id]);
      return { ok: true, fbStoragePath: res.rows[0].fb_storage_path };
    }

    throw new Error("Unknown source");
  });
