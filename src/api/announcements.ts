import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "../backend/auth/middleware";
import { query } from "../backend/db";

export interface AnnouncementRow {
  id: string;
  kind: "birthday" | "achievement" | "condolence" | "notice";
  title: string;
  body: string | null;
  created_by: string | null;
  created_at: string;
}

export const listAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async (): Promise<AnnouncementRow[]> => {
    const res = await query<AnnouncementRow>(
      `SELECT * FROM announcements ORDER BY created_at DESC`,
    );
    return res.rows;
  });
