import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "../backend/auth/middleware";
import { query } from "../backend/db";
import { PROFILE_COLUMNS, type ProfileRow } from "../backend/auth/service";

export interface ProfileInput {
  full_name: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
  profession?: string;
  bio?: string;
  spouse_name?: string;
  clinic_or_hospital?: string;
  country_state?: string;
  batch_confirmed?: boolean;
}

// Members (including pending ones) can edit their own profile. Approval
// fields (approved, approval_status, approved_by, rejection_reason) are
// intentionally never writable here — only admin endpoints can change them.
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
         spouse_name = $8,
         clinic_or_hospital = $9,
         country_state = $10,
         batch_confirmed = COALESCE($11, batch_confirmed),
         updated_at = now()
       WHERE id = $1
       RETURNING ${PROFILE_COLUMNS}`,
      [
        context.userId,
        data.full_name,
        data.phone ?? null,
        data.whatsapp ?? null,
        data.location ?? null,
        data.profession ?? null,
        data.bio ?? null,
        data.spouse_name ?? null,
        data.clinic_or_hospital ?? null,
        data.country_state ?? null,
        data.batch_confirmed ?? null,
      ],
    );
    return res.rows[0];
  });

export const uploadProfilePhoto = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: FormData) => d)
  .handler(async ({ data, context }): Promise<{ ok: true; photo_url: string }> => {
    const file = data.get("file") as File | null;
    if (!file || typeof file === "string") {
      throw new Error("No file provided");
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    await query(
      `INSERT INTO profile_photos (user_id, mime, data) VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, created_at = now()`,
      [context.userId, file.type || "application/octet-stream", bytes],
    );
    const photoUrl = `/api/profile-photo/${context.userId}`;
    await query(`UPDATE profiles SET photo_url = $2, updated_at = now() WHERE id = $1`, [
      context.userId,
      photoUrl,
    ]);
    return { ok: true, photo_url: photoUrl };
  });
