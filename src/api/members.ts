import { createServerFn } from "@tanstack/react-start";
import { requireApproved } from "../backend/auth/middleware";
import { query } from "../backend/db";
import type { ProfileRow } from "../backend/auth/service";

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .handler(async (): Promise<ProfileRow[]> => {
    const res = await query<ProfileRow>(
      `SELECT id, full_name, photo_url, phone, whatsapp, email, location, profession, bio, approved, slug
       FROM profiles WHERE approval_status = 'approved' ORDER BY full_name ASC`,
    );
    return res.rows;
  });
