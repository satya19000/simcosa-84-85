import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "../backend/auth/middleware";
import { query, withTransaction } from "../backend/db";
import { PROFILE_COLUMNS, type ProfileRow } from "../backend/auth/service";
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
    const res = await query<{ id: string }>(`SELECT id FROM profiles WHERE email = $1`, [
      data.email.trim().toLowerCase(),
    ]);
    if (!res.rows[0]) {
      throw new Error("No member found with that email. They must sign up first.");
    }
    await query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')
       ON CONFLICT (user_id, role) DO NOTHING`,
      [res.rows[0].id],
    );
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
export const adminListEvents = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<EventRow[]> => {
    const res = await query<EventRow>(`SELECT * FROM events ORDER BY event_date DESC`);
    return res.rows;
  });

export const adminCreateEvent = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (d: { title: string; description?: string; location?: string; event_date: string }) => d,
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await query(
      `INSERT INTO events (title, description, location, event_date, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [data.title, data.description || null, data.location || null, data.event_date, context.userId],
    );
    return { ok: true };
  });

export const adminDeleteEvent = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await query(`DELETE FROM events WHERE id = $1`, [data.id]);
    return { ok: true };
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
