import { createServerFn } from "@tanstack/react-start";
import { requireApproved } from "../backend/auth/middleware";
import { query } from "../backend/db";

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  cover_url: string | null;
  created_by: string | null;
  created_at: string;
}

export interface RsvpRow {
  id: string;
  event_id: string;
  user_id: string;
  status: "attending" | "maybe" | "not_attending";
}

export const listEvents = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .handler(async (): Promise<EventRow[]> => {
    const res = await query<EventRow>(
      `SELECT id, title, description, location, event_date,
         CASE WHEN cover_data IS NOT NULL THEN '/api/events/cover/' || id ELSE cover_url END AS cover_url,
         created_by, created_at
       FROM events ORDER BY event_date ASC`,
    );
    return res.rows;
  });

export const listMyRsvps = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .handler(async ({ context }): Promise<RsvpRow[]> => {
    const res = await query<RsvpRow>(
      `SELECT id, event_id, user_id, status FROM event_rsvps WHERE user_id = $1`,
      [context.userId],
    );
    return res.rows;
  });

export const listRsvpCounts = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .handler(async (): Promise<{ event_id: string; status: string }[]> => {
    const res = await query<{ event_id: string; status: string }>(
      `SELECT event_id, status FROM event_rsvps`,
    );
    return res.rows;
  });

export const setRsvp = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator(
    (d: { eventId: string; status: "attending" | "maybe" | "not_attending" }) => d,
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await query(
      `INSERT INTO event_rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET status = EXCLUDED.status`,
      [data.eventId, context.userId, data.status],
    );
    return { ok: true };
  });
