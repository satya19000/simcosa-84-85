import { createServerFn } from "@tanstack/react-start";
import { requireApproved } from "../backend/auth/middleware";
import { query } from "../backend/db";

const ONLINE_WINDOW = "3 minutes";

export const pingPresence = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { currentPage?: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await query(
      `INSERT INTO member_presence (user_id, last_seen_at, current_page, updated_at)
       VALUES ($1, now(), $2, now())
       ON CONFLICT (user_id) DO UPDATE
         SET last_seen_at = now(), current_page = EXCLUDED.current_page, updated_at = now()`,
      [context.userId, data.currentPage || null],
    );
    return { ok: true };
  });

export interface OnlineMember {
  user_id: string;
  full_name: string;
  photo_url: string | null;
  email: string | null;
  last_seen_at: string;
}

export const getOnlineMembers = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .handler(async ({ context }): Promise<{ count: number; members: OnlineMember[] }> => {
    const res = await query<OnlineMember>(
      `SELECT p.id AS user_id, p.full_name, p.photo_url, p.email, mp.last_seen_at
       FROM member_presence mp
       JOIN profiles p ON p.id = mp.user_id
       WHERE mp.last_seen_at > now() - interval '${ONLINE_WINDOW}'
         AND p.approval_status = 'approved'
       ORDER BY mp.last_seen_at DESC`,
    );
    const members = res.rows.map((m) => ({
      ...m,
      email: context.isAdmin ? m.email : null,
    }));
    return { count: members.length, members };
  });
