import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "../backend/auth/middleware";
import { query } from "../backend/db";

export interface SupportRow {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export const listMySupport = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<SupportRow[]> => {
    const res = await query<SupportRow>(
      `SELECT * FROM support_requests WHERE user_id = $1 ORDER BY created_at DESC`,
      [context.userId],
    );
    return res.rows;
  });

export const createSupport = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (d: {
      category: "medical" | "financial" | "emotional" | "family" | "other";
      subject: string;
      message: string;
    }) => d,
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await query(
      `INSERT INTO support_requests (user_id, category, subject, message)
       VALUES ($1, $2, $3, $4)`,
      [context.userId, data.category, data.subject, data.message],
    );
    return { ok: true };
  });
