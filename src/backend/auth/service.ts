import { query, withTransaction } from "../db";
import type { AuthClaims } from "./firebase";

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
  approved: boolean;
}

export interface AuthUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
}

// Upsert the authenticated user, and ensure a member profile + role exist.
// New users are immediately approved (no admin-approval gating).
export async function upsertUserFromClaims(claims: AuthClaims): Promise<void> {
  const id = claims.sub;
  const email = claims.email ?? null;
  const firstName = claims.first_name ?? null;
  const lastName = claims.last_name ?? null;
  const image = claims.profile_image_url ?? null;

  const fullName =
    [firstName, lastName].filter(Boolean).join(" ").trim() || email || "Batchmate";

  await withTransaction(async (c) => {
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

    await c.query(
      `INSERT INTO profiles (id, full_name, email, photo_url, approved)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (id) DO NOTHING`,
      [id, fullName, email, image],
    );

    await c.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'member')
       ON CONFLICT (user_id, role) DO NOTHING`,
      [id],
    );
  });
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const res = await query<ProfileRow>(
    `SELECT id, full_name, photo_url, phone, whatsapp, email, location, profession, bio, approved
     FROM profiles WHERE id = $1`,
    [userId],
  );
  return res.rows[0] ?? null;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const res = await query(
    `SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin' LIMIT 1`,
    [userId],
  );
  return res.rowCount! > 0;
}
