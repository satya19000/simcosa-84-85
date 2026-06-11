import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "../backend/auth/middleware";
import { query } from "../backend/db";
import type { ProfileRow } from "../backend/auth/service";

export interface ProfileInput {
  full_name: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
  profession?: string;
  bio?: string;
}

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: ProfileInput) => d)
  .handler(async ({ data, context }): Promise<ProfileRow> => {
    const res = await query<ProfileRow>(
      `UPDATE profiles SET
         full_name = $2,
         phone = $3,
         whatsapp = $4,
         location = $5,
         profession = $6,
         bio = $7,
         updated_at = now()
       WHERE id = $1
       RETURNING id, full_name, photo_url, phone, whatsapp, email, location, profession, bio, approved`,
      [
        context.userId,
        data.full_name,
        data.phone ?? null,
        data.whatsapp ?? null,
        data.location ?? null,
        data.profession ?? null,
        data.bio ?? null,
      ],
    );
    return res.rows[0];
  });
