import { query, withTransaction } from "../db";
import type { AuthClaims } from "./firebase";
import { sendNewMemberAdminNotification } from "../email";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "needs_clarification";

export interface ProfileRow {
  id: string;
  full_name: string;
  photo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  profession: string | null;
  bio: string | null;
  spouse_name: string | null;
  clinic_or_hospital: string | null;
  country_state: string | null;
  batch_confirmed: boolean;
  approved: boolean;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  slug: string | null;
}

/** Generate a URL-safe slug from a full name (deterministic, no randomness). */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface AuthUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
}

// Upsert the authenticated user, and ensure a member profile + role exist.
// New profiles start out pending — an admin must approve them before they
// can access member-only content. ON CONFLICT DO NOTHING means this never
// resets an existing member's approval state on subsequent logins.
export async function upsertUserFromClaims(claims: AuthClaims): Promise<void> {
  const id = claims.sub;
  const email = claims.email ?? null;
  const firstName = claims.first_name ?? null;
  const lastName = claims.last_name ?? null;
  const image = claims.profile_image_url ?? null;

  const fullName =
    [firstName, lastName].filter(Boolean).join(" ").trim() || email || "Batchmate";

  const isNewSignup = await withTransaction(async (c) => {
    // Reclaim the email from any leftover account (e.g. a pre-Firebase Replit
    // Auth row) that used the same email under a different id, so the unique
    // email constraint doesn't block this Firebase user. The stale row's
    // auto-created profile + role cascade-delete and are recreated below.
    if (email) {
      await c.query(`DELETE FROM users WHERE email = $1 AND id <> $2`, [email, id]);
    }

    await c.query(
      `INSERT INTO users (id, email, first_name, last_name, profile_image_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         profile_image_url = EXCLUDED.profile_image_url,
         updated_at = now()`,
      [id, email, firstName, lastName, image],
    );

    const baseSlug = toSlug(fullName) || "member";
    const profileInsert = await c.query(
      `INSERT INTO profiles (id, full_name, email, photo_url, approved, approval_status, slug)
       VALUES ($1, $2, $3, $4, false, 'pending',
         (SELECT s FROM (
           SELECT $5 AS s WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE slug = $5)
           UNION ALL
           SELECT $5 || '-' || n FROM generate_series(2, 999) n
             WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE slug = $5 || '-' || n)
           LIMIT 1
         ) sub)
       )
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [id, fullName, email, image, baseSlug],
    );

    await c.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'member')
       ON CONFLICT (user_id, role) DO NOTHING`,
      [id],
    );

    return profileInsert.rowCount! > 0;
  });

  // Notify admins outside the transaction so a slow/failed email send can
  // never block or roll back the signup itself.
  if (isNewSignup) {
    const admins = await query<{ email: string | null }>(
      `SELECT u.email FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE ur.role = 'admin'`,
    );
    const adminEmails = admins.rows.map((r) => r.email).filter((e): e is string => !!e);
    void sendNewMemberAdminNotification(adminEmails, {
      name: fullName,
      email,
      mobile: null,
      city: null,
      profession: null,
      signupTime: new Date(),
    });
  }
}

export const PROFILE_COLUMNS = `id, full_name, photo_url, phone, whatsapp, email, location, profession, bio,
  spouse_name, clinic_or_hospital, country_state, batch_confirmed, approved, approval_status,
  approved_by, approved_at, rejection_reason, created_at, slug`;

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const res = await query<ProfileRow>(
    `SELECT ${PROFILE_COLUMNS} FROM profiles WHERE id = $1`,
    [userId],
  );
  return res.rows[0] ?? null;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const res = await query(
    `SELECT 1 FROM user_roles WHERE user_id = $1 AND role IN ('admin', 'owner') LIMIT 1`,
    [userId],
  );
  return res.rowCount! > 0;
}

export async function isOwner(userId: string): Promise<boolean> {
  const res = await query(
    `SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'owner' LIMIT 1`,
    [userId],
  );
  return res.rowCount! > 0;
}
