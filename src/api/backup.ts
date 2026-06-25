import { createServerFn } from "@tanstack/react-start";
import { requireOwner } from "../backend/auth/middleware";
import { query } from "../backend/db";

/** Export all member profiles as a JSON array — owner only. */
export const ownerExportMembers = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(async () => {
    const res = await query<{
      id: string; full_name: string; email: string | null; phone: string | null;
      whatsapp: string | null; location: string | null; profession: string | null;
      bio: string | null; approval_status: string; batch_confirmed: boolean;
      created_at: string;
    }>(`
      SELECT p.id, p.full_name, p.email, p.phone, p.whatsapp,
             p.location, p.profession, p.bio, p.approval_status,
             p.batch_confirmed, p.created_at
      FROM profiles p
      ORDER BY p.created_at ASC
    `);
    return res.rows;
  });

/** Export media file list as a JSON array — owner only. */
export const ownerExportMediaList = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(async () => {
    const [gallery, memories, blogs, events] = await Promise.all([
      query<{ id: string; source: string; file_name: string | null; file_size: number | null; mime: string | null; file_url: string | null; fb_storage_path: string | null; created_at: string }>(`
        SELECT id, 'gallery' AS source, file_name, file_size, mime, file_url, fb_storage_path, created_at
        FROM gallery_items WHERE deleted_at IS NULL ORDER BY created_at ASC
      `),
      query<{ id: string; source: string; file_name: string | null; file_size: number | null; mime: string | null; file_url: string | null; fb_storage_path: string | null; created_at: string }>(`
        SELECT id, 'memory_image' AS source, file_name, file_size, mime_type AS mime,
               image_url AS file_url, fb_storage_path, created_at
        FROM memory_images ORDER BY created_at ASC
      `),
      query<{ id: string; source: string; file_name: string | null; file_size: number | null; mime: string | null; file_url: string | null; fb_storage_path: string | null; created_at: string }>(`
        SELECT id, 'blog' AS source, file_name, file_size, NULL AS mime,
               image_url AS file_url, fb_storage_path, created_at
        FROM blogs WHERE image_url IS NOT NULL OR fb_storage_path IS NOT NULL
        ORDER BY created_at ASC
      `),
      query<{ id: string; source: string; file_name: string | null; file_size: number | null; mime: string | null; file_url: string | null; fb_storage_path: string | null; created_at: string }>(`
        SELECT id, 'event' AS source, file_name, file_size, NULL AS mime,
               cover_url AS file_url, fb_storage_path, created_at
        FROM events WHERE cover_url IS NOT NULL OR fb_storage_path IS NOT NULL
        ORDER BY created_at ASC
      `),
    ]);
    return [...gallery.rows, ...memories.rows, ...blogs.rows, ...events.rows];
  });

export interface FullBackup {
  exported_at: string;
  members: Record<string, string | number | boolean | null>[];
  memories: Record<string, string | number | boolean | null>[];
  gallery: Record<string, string | number | boolean | null>[];
  blogs: Record<string, string | number | boolean | null>[];
  events: Record<string, string | number | boolean | null>[];
  announcements: Record<string, string | number | boolean | null>[];
  donations: Record<string, string | number | boolean | null>[];
  expenses: Record<string, string | number | boolean | null>[];
}

/** Full website data export as a single JSON object — owner only. */
export const ownerExportFullBackup = createServerFn({ method: "GET" })
  .middleware([requireOwner])
  .handler(async (): Promise<FullBackup> => {
    const [members, memories, gallery, blogs, events, announcements, donations, expenses] =
      await Promise.all([
        query(`SELECT p.*, u.email AS auth_email FROM profiles p LEFT JOIN users u ON u.id = p.id ORDER BY p.created_at ASC`),
        query(`
          SELECT m.*, json_agg(json_build_object('id', mi.id, 'image_url', mi.image_url, 'file_name', mi.file_name, 'file_size', mi.file_size, 'sort_order', mi.sort_order) ORDER BY mi.sort_order ASC, mi.created_at ASC) FILTER (WHERE mi.id IS NOT NULL) AS images
          FROM memories m LEFT JOIN memory_images mi ON mi.memory_id = m.id
          GROUP BY m.id ORDER BY m.created_at ASC
        `),
        query(`SELECT * FROM gallery_items WHERE deleted_at IS NULL ORDER BY sort_order ASC, created_at ASC`),
        query(`SELECT * FROM blogs ORDER BY created_at ASC`),
        query(`SELECT * FROM events ORDER BY event_date ASC`),
        query(`SELECT * FROM announcements ORDER BY created_at ASC`),
        query(`SELECT * FROM donations ORDER BY created_at ASC`),
        query(`SELECT * FROM expenses ORDER BY created_at ASC`),
      ]);

    return {
      exported_at: new Date().toISOString(),
      members: members.rows,
      memories: memories.rows,
      gallery: gallery.rows,
      blogs: blogs.rows,
      events: events.rows,
      announcements: announcements.rows,
      donations: donations.rows,
      expenses: expenses.rows,
    };
  });
