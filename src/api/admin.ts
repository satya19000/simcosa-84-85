import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "../backend/auth/middleware";
import { query } from "../backend/db";
import type { ProfileRow } from "../backend/auth/service";
import type { EventRow } from "./events";
import type { AnnouncementRow } from "./announcements";
import type { DonationRow, ExpenseRow } from "./donations";

// ---- Members ----
export const adminListMembers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<ProfileRow[]> => {
    const res = await query<ProfileRow>(
      `SELECT id, full_name, photo_url, phone, whatsapp, email, location, profession, bio, approved
       FROM profiles ORDER BY created_at DESC`,
    );
    return res.rows;
  });

export const adminSetApproved = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string; approved: boolean }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await query(`UPDATE profiles SET approved = $2, updated_at = now() WHERE id = $1`, [
      data.id,
      data.approved,
    ]);
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
