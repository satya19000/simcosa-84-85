import { createServerFn } from "@tanstack/react-start";
import type pg from "pg";
import { requireAdmin } from "../backend/auth/middleware";
import { query, withTransaction } from "../backend/db";
import { PROFILE_COLUMNS, type ProfileRow, type ApprovalStatus } from "../backend/auth/service";
import type { EventRow } from "./events";
import type { AnnouncementRow } from "./announcements";
import type { DonationRow, ExpenseRow } from "./donations";

// ---- Members ----
export const adminListMembers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<ProfileRow[]> => {
    const res = await query<ProfileRow>(
      `SELECT ${PROFILE_COLUMNS} FROM profiles ORDER BY created_at DESC`,
    );
    return res.rows;
  });

export const adminSetApproved = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string; approved: boolean }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await query(
      `UPDATE profiles SET approved = $2, approval_status = $3, updated_at = now() WHERE id = $1`,
      [data.id, data.approved, data.approved ? "approved" : "rejected"],
    );
    return { ok: true };
  });

export const adminApproveMember = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await query(
      `UPDATE profiles SET approved = true, approval_status = 'approved',
         approved_by = $2, approved_at = now(), rejection_reason = null, updated_at = now()
       WHERE id = $1`,
      [data.id, context.userId],
    );
    return { ok: true };
  });

export const adminRejectMember = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await query(
      `UPDATE profiles SET approved = false, approval_status = 'rejected',
         approved_by = $2, approved_at = now(), rejection_reason = $3, updated_at = now()
       WHERE id = $1`,
      [data.id, context.userId, data.reason || null],
    );
    return { ok: true };
  });

export const adminMarkNeedsClarification = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await query(
      `UPDATE profiles SET approved = false, approval_status = 'needs_clarification',
         approved_by = $2, approved_at = now(), rejection_reason = $3, updated_at = now()
       WHERE id = $1`,
      [data.id, context.userId, data.reason || null],
    );
    return { ok: true };
  });

export const adminDeleteMember = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await query(`DELETE FROM profiles WHERE id = $1`, [data.id]);
    return { ok: true };
  });

export interface AdminEditMemberInput {
  id: string;
  full_name?: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
  profession?: string;
  bio?: string;
  spouse_name?: string;
  clinic_or_hospital?: string;
  country_state?: string;
}

export const adminEditMember = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: AdminEditMemberInput) => d)
  .handler(async ({ data }): Promise<ProfileRow> => {
    const res = await query<ProfileRow>(
      `UPDATE profiles SET
         full_name = COALESCE($2, full_name),
         phone = COALESCE($3, phone),
         whatsapp = COALESCE($4, whatsapp),
         location = COALESCE($5, location),
         profession = COALESCE($6, profession),
         bio = COALESCE($7, bio),
         spouse_name = COALESCE($8, spouse_name),
         clinic_or_hospital = COALESCE($9, clinic_or_hospital),
         country_state = COALESCE($10, country_state),
         updated_at = now()
       WHERE id = $1
       RETURNING ${PROFILE_COLUMNS}`,
      [
        data.id,
        data.full_name ?? null,
        data.phone ?? null,
        data.whatsapp ?? null,
        data.location ?? null,
        data.profession ?? null,
        data.bio ?? null,
        data.spouse_name ?? null,
        data.clinic_or_hospital ?? null,
        data.country_state ?? null,
      ],
    );
    return res.rows[0];
  });

export interface AdminAddMemberInput {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  profession?: string;
  approval_status: ApprovalStatus;
}

async function upsertManualMember(
  c: pg.PoolClient,
  data: AdminAddMemberInput,
): Promise<void> {
  const email = data.email.trim().toLowerCase();
  const existing = await c.query<{ id: string }>(
    `SELECT id FROM profiles WHERE lower(email) = $1`,
    [email],
  );
  const approved = data.approval_status === "approved";

  if (existing.rows[0]) {
    await c.query(
      `UPDATE profiles SET
         full_name = $2, phone = COALESCE($3, phone), location = COALESCE($4, location),
         profession = COALESCE($5, profession), approved = $6, approval_status = $7, updated_at = now()
       WHERE id = $1`,
      [existing.rows[0].id, data.full_name, data.phone || null, data.location || null, data.profession || null, approved, data.approval_status],
    );
    return;
  }

  const id = (await c.query<{ id: string }>(`SELECT gen_random_uuid()::text AS id`)).rows[0].id;
  await c.query(
    `INSERT INTO users (id, email, first_name, last_name) VALUES ($1, $2, $3, '')`,
    [id, email, data.full_name],
  );
  await c.query(
    `INSERT INTO profiles (id, full_name, email, phone, location, profession, approved, approval_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, data.full_name, email, data.phone || null, data.location || null, data.profession || null, approved, data.approval_status],
  );
}

export const adminAddMember = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: AdminAddMemberInput) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    if (!data.email.trim() || !data.full_name.trim()) {
      throw new Error("Name and email are required.");
    }
    await withTransaction((c) => upsertManualMember(c, data));
    return { ok: true };
  });

export interface AdminImportRow {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  profession?: string;
  approval_status?: ApprovalStatus;
}

const VALID_APPROVAL_STATUSES: ApprovalStatus[] = ["pending", "approved", "rejected", "needs_clarification"];

export const adminImportMembers = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { rows: AdminImportRow[]; approval_status: ApprovalStatus }) => d)
  .handler(async ({ data }): Promise<{ imported: number; skipped: number }> => {
    let imported = 0;
    let skipped = 0;
    await withTransaction(async (c) => {
      for (const row of data.rows) {
        if (!row.email?.trim() || !row.full_name?.trim()) {
          skipped++;
          continue;
        }
        const status =
          row.approval_status && VALID_APPROVAL_STATUSES.includes(row.approval_status)
            ? row.approval_status
            : data.approval_status;
        await upsertManualMember(c, {
          full_name: row.full_name,
          email: row.email,
          phone: row.phone,
          location: row.location,
          profession: row.profession,
          approval_status: status,
        });
        imported++;
      }
    });
    return { imported, skipped };
  });

// ---- Admins (multi-admin management) ----
export interface AdminRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

export const adminListAdmins = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<AdminRow[]> => {
    const res = await query<AdminRow>(
      `SELECT p.id, p.full_name, p.email
       FROM profiles p
       JOIN user_roles ur ON ur.user_id = p.id
       WHERE ur.role = 'admin'
       ORDER BY p.full_name ASC`,
    );
    return res.rows;
  });

export const adminPromoteToAdmin = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')
       ON CONFLICT (user_id, role) DO NOTHING`,
      [data.id],
    );
    return { ok: true };
  });

export const adminAddAdminByEmail = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { email: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const res = await query<{ id: string; approval_status: ApprovalStatus }>(
      `SELECT id, approval_status FROM profiles WHERE lower(email) = $1`,
      [data.email.trim().toLowerCase()],
    );
    const member = res.rows[0];
    if (!member) {
      throw new Error("Member not found. Ask them to sign up first.");
    }
    await withTransaction(async (c) => {
      if (member.approval_status !== "approved") {
        await c.query(
          `UPDATE profiles SET approved = true, approval_status = 'approved', updated_at = now() WHERE id = $1`,
          [member.id],
        );
      }
      await c.query(
        `INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')
         ON CONFLICT (user_id, role) DO NOTHING`,
        [member.id],
      );
    });
    return { ok: true };
  });

export const adminDemoteAdmin = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await withTransaction(async (c) => {
      const countRes = await c.query<{ count: string }>(
        `SELECT count(*) FROM user_roles WHERE role = 'admin'`,
      );
      if (Number(countRes.rows[0].count) <= 1) {
        throw new Error("Cannot remove the last admin.");
      }
      await c.query(`DELETE FROM user_roles WHERE user_id = $1 AND role = 'admin'`, [data.id]);
    });
    return { ok: true };
  });

// ---- Events ----
const MAX_EVENT_COVER_BYTES = 15 * 1024 * 1024;
const ALLOWED_EVENT_COVER_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export const adminListEvents = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<EventRow[]> => {
    const res = await query<EventRow>(
      `SELECT id, title, description, location, event_date,
         COALESCE(cover_url, CASE WHEN cover_data IS NOT NULL THEN '/api/events/cover/' || id ELSE NULL END) AS cover_url,
         created_by, created_at
       FROM events ORDER BY event_date DESC`,
    );
    return res.rows;
  });

export interface AdminCreateEventInput {
  title: string;
  description?: string;
  location?: string;
  event_date: string;
  url?: string;
  storagePath?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

export const adminCreateEvent = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: AdminCreateEventInput) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const title = data.title.trim();
    const description = (data.description ?? "").trim();
    const location = (data.location ?? "").trim();
    const eventDate = data.event_date;
    if (!title || !eventDate) throw new Error("Title and date are required");

    let coverUrl: string | null = null;
    let fbStoragePath: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    if (data.url) {
      if (!data.mimeType || !ALLOWED_EVENT_COVER_TYPES.has(data.mimeType)) {
        throw new Error("Unsupported image format. Please use JPG, PNG, or WEBP.");
      }
      if ((data.fileSize ?? 0) > MAX_EVENT_COVER_BYTES) {
        throw new Error("This file is too large. Please upload a smaller image or compressed version.");
      }
      coverUrl = data.url;
      fbStoragePath = data.storagePath || null;
      fileName = data.fileName || null;
      fileSize = data.fileSize ?? null;
    }

    await query(
      `INSERT INTO events (title, description, location, event_date, cover_url, fb_storage_path, file_name, file_size, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [title, description || null, location || null, eventDate, coverUrl, fbStoragePath, fileName, fileSize, context.userId],
    );
    return { ok: true };
  });

export const adminDeleteEvent = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true; fbStoragePath: string | null }> => {
    const owned = await query<{ fb_storage_path: string | null }>(
      `SELECT fb_storage_path FROM events WHERE id = $1`,
      [data.id],
    );
    const row = owned.rows[0];
    await query(`DELETE FROM events WHERE id = $1`, [data.id]);
    return { ok: true, fbStoragePath: row?.fb_storage_path ?? null };
  });

// ---- Announcements ----
export const adminListAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<AnnouncementRow[]> => {
    const res = await query<AnnouncementRow>(
      `SELECT * FROM announcements ORDER BY created_at DESC`,
    );
    return res.rows;
  });

export const adminCreateAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (d: {
      kind: "birthday" | "achievement" | "condolence" | "notice";
      title: string;
      body?: string;
    }) => d,
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await query(
      `INSERT INTO announcements (kind, title, body, created_by) VALUES ($1, $2, $3, $4)`,
      [data.kind, data.title, data.body || null, context.userId],
    );
    return { ok: true };
  });

export const adminDeleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await query(`DELETE FROM announcements WHERE id = $1`, [data.id]);
    return { ok: true };
  });

// ---- Donations ----
export const adminListDonations = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<DonationRow[]> => {
    const res = await query<DonationRow>(`SELECT * FROM donations ORDER BY donated_on DESC`);
    return res.rows;
  });

export const adminCreateDonation = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { donor_name: string; amount: number; purpose?: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await query(
      `INSERT INTO donations (donor_name, amount, purpose, created_by) VALUES ($1, $2, $3, $4)`,
      [data.donor_name, data.amount, data.purpose || null, context.userId],
    );
    return { ok: true };
  });

// ---- Expenses ----
export const adminListExpenses = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<ExpenseRow[]> => {
    const res = await query<ExpenseRow>(`SELECT * FROM expenses ORDER BY spent_on DESC`);
    return res.rows;
  });

export const adminCreateExpense = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { description: string; amount: number; category?: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await query(
      `INSERT INTO expenses (description, amount, category, created_by) VALUES ($1, $2, $3, $4)`,
      [data.description, data.amount, data.category || null, context.userId],
    );
    return { ok: true };
  });

// ---- Support ----
export interface AdminSupportRow {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
}

export const adminListSupport = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<AdminSupportRow[]> => {
    const res = await query<AdminSupportRow>(
      `SELECT s.id, s.category, s.subject, s.message, s.status, s.created_at,
         json_build_object('full_name', p.full_name, 'phone', p.phone) AS profiles
       FROM support_requests s
       LEFT JOIN profiles p ON p.id = s.user_id
       ORDER BY s.created_at DESC`,
    );
    return res.rows;
  });

export const adminResolveSupport = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await query(`UPDATE support_requests SET status = 'resolved' WHERE id = $1`, [data.id]);
    return { ok: true };
  });

// ---- Blogs (moderation) ----
export interface AdminBlogRow {
  id: string;
  title: string;
  category: string;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  author_id: string;
  profiles: { full_name: string | null } | null;
}

export const adminListBlogs = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<AdminBlogRow[]> => {
    const res = await query<AdminBlogRow>(
      `SELECT b.id, b.title, b.category, b.is_featured, b.is_published, b.created_at, b.author_id,
         json_build_object('full_name', p.full_name) AS profiles
       FROM blogs b
       LEFT JOIN profiles p ON p.id = b.author_id
       ORDER BY b.created_at DESC`,
    );
    return res.rows;
  });

export const adminDeleteBlog = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true; fbStoragePath: string | null }> => {
    const owned = await query<{ fb_storage_path: string | null }>(
      `SELECT fb_storage_path FROM blogs WHERE id = $1`,
      [data.id],
    );
    const row = owned.rows[0];
    await query(`DELETE FROM blogs WHERE id = $1`, [data.id]);
    return { ok: true, fbStoragePath: row?.fb_storage_path ?? null };
  });

// ---- Gallery (moderation) ----
export interface AdminGalleryRow {
  id: string;
  title: string | null;
  caption: string | null;
  media_type: string;
  storage_path: string;
  file_url: string | null;
  fb_storage_path: string | null;
  file_available: boolean;
  created_at: string;
  uploaded_by: string | null;
  profiles: { full_name: string | null } | null;
}

// Same fallback order as listGallery in api/gallery.ts: file_url, then a
// storage_path that's already a full URL. No legacy bytea route — the
// live gallery_items table has no `data` column.
const ADMIN_FILE_URL_SQL = `
  CASE
    WHEN g.file_url IS NOT NULL THEN g.file_url
    WHEN g.storage_path ~* '^https?://' THEN g.storage_path
    ELSE NULL
  END`;

export const adminListGallery = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<AdminGalleryRow[]> => {
    const res = await query<AdminGalleryRow>(
      `SELECT g.id, g.title, g.caption, g.media_type, g.storage_path,
         ${ADMIN_FILE_URL_SQL} AS file_url,
         g.fb_storage_path,
         (${ADMIN_FILE_URL_SQL}) IS NOT NULL AS file_available,
         g.created_at, g.uploaded_by,
         json_build_object('full_name', p.full_name) AS profiles
       FROM gallery_items g
       LEFT JOIN profiles p ON p.id = g.uploaded_by
       WHERE g.deleted_at IS NULL
       ORDER BY g.created_at DESC`,
    );
    return res.rows;
  });

export const adminDeleteGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true; fbStoragePath: string | null }> => {
    const owned = await query<{ fb_storage_path: string | null }>(
      `SELECT fb_storage_path FROM gallery_items WHERE id = $1`,
      [data.id],
    );
    const row = owned.rows[0];
    await query(`DELETE FROM gallery_items WHERE id = $1`, [data.id]);
    return { ok: true, fbStoragePath: row?.fb_storage_path ?? null };
  });

// ---- Memories (moderation) ----
export interface AdminMemoryRow {
  id: string;
  title: string | null;
  body: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string | null } | null;
}

export const adminListMemories = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<AdminMemoryRow[]> => {
    const res = await query<AdminMemoryRow>(
      `SELECT m.id, m.title, m.body, m.created_at, m.user_id,
         json_build_object('full_name', p.full_name) AS profiles
       FROM memories m
       LEFT JOIN profiles p ON p.id = m.user_id
       ORDER BY m.created_at DESC`,
    );
    return res.rows;
  });

export const adminDeleteMemory = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true; fbStoragePaths: string[] }> => {
    const owned = await query<{ fb_storage_path: string | null }>(
      `SELECT fb_storage_path FROM memories WHERE id = $1`,
      [data.id],
    );
    const images = await query<{ fb_storage_path: string | null }>(
      `SELECT fb_storage_path FROM memory_images WHERE memory_id = $1`,
      [data.id],
    );
    const row = owned.rows[0];
    await query(`DELETE FROM memories WHERE id = $1`, [data.id]);
    const fbStoragePaths = [row?.fb_storage_path, ...images.rows.map((r) => r.fb_storage_path)].filter(
      (p): p is string => !!p,
    );
    return { ok: true, fbStoragePaths };
  });

export interface DuplicateMemoryGroup {
  title: string | null;
  body: string;
  user_id: string;
  full_name: string | null;
  memories: { id: string; created_at: string; image_count: number }[];
}

/** Finds memories from the same author with identical title+body posted within 10 minutes of each other. */
export const adminFindDuplicateMemories = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<DuplicateMemoryGroup[]> => {
    const res = await query<{
      title: string | null;
      body: string;
      user_id: string;
      full_name: string | null;
      id: string;
      created_at: string;
      image_count: number;
    }>(
      `SELECT m.title, m.body, m.user_id, p.full_name, m.id, m.created_at,
         (SELECT COUNT(*)::int FROM memory_images mi WHERE mi.memory_id = m.id) AS image_count
       FROM memories m
       LEFT JOIN profiles p ON p.id = m.user_id
       ORDER BY m.user_id, m.title, m.body, m.created_at ASC`,
    );

    const groups: DuplicateMemoryGroup[] = [];
    let current: DuplicateMemoryGroup | null = null;
    let lastCreatedAt: number | null = null;
    for (const row of res.rows) {
      const sameKey =
        current &&
        current.user_id === row.user_id &&
        current.title === row.title &&
        current.body === row.body;
      const withinWindow = sameKey && lastCreatedAt !== null && new Date(row.created_at).getTime() - lastCreatedAt <= 10 * 60 * 1000;
      if (sameKey && withinWindow) {
        current!.memories.push({ id: row.id, created_at: row.created_at, image_count: row.image_count });
      } else {
        current = {
          title: row.title,
          body: row.body,
          user_id: row.user_id,
          full_name: row.full_name,
          memories: [{ id: row.id, created_at: row.created_at, image_count: row.image_count }],
        };
        groups.push(current);
      }
      lastCreatedAt = new Date(row.created_at).getTime();
    }

    return groups.filter((g) => g.memories.length > 1);
  });

/** Moves all memory_images from the duplicate memory ids into the keepId memory, then deletes the duplicates. */
export const adminMergeMemories = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { keepId: string; duplicateIds: string[] }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    if (!data.duplicateIds.length) return { ok: true };
    await withTransaction(async (tx) => {
      for (const dupId of data.duplicateIds) {
        if (dupId === data.keepId) continue;
        const legacy = await tx.query<{ image_url: string | null; fb_storage_path: string | null; file_name: string | null; file_size: number | null }>(
          `SELECT image_url, fb_storage_path, file_name, file_size FROM memories WHERE id = $1`,
          [dupId],
        );
        const dupRow = legacy.rows[0];
        if (dupRow?.image_url) {
          await tx.query(
            `INSERT INTO memory_images (memory_id, image_url, fb_storage_path, file_name, file_size)
             VALUES ($1, $2, $3, $4, $5)`,
            [data.keepId, dupRow.image_url, dupRow.fb_storage_path, dupRow.file_name, dupRow.file_size],
          );
        }
        await tx.query(`UPDATE memory_images SET memory_id = $1 WHERE memory_id = $2`, [data.keepId, dupId]);
        await tx.query(`DELETE FROM memories WHERE id = $1`, [dupId]);
      }
    });
    return { ok: true };
  });
