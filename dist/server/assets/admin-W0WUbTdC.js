import { c as createServerRpc } from "./createServerRpc-CatOEUO_.js";
import { b as requireAdmin } from "./middleware-CDLkGbUt.js";
import { q as query, P as PROFILE_COLUMNS, w as withTransaction } from "../server.js";
import { c as createServerFn } from "./server-DDYe3IJQ.js";
import "./createMiddleware-BvN2ghIY.js";
import "node:crypto";
import "pg";
import "jose";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const adminListMembers_createServerFn_handler = createServerRpc({
  id: "723462ba637fa9a23d146986de338ec29ea06959725eaa4830b633bef075a2c0",
  name: "adminListMembers",
  filename: "src/api/admin.ts"
}, (opts) => adminListMembers.__executeServer(opts));
const adminListMembers = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListMembers_createServerFn_handler, async () => {
  const res = await query(`SELECT ${PROFILE_COLUMNS} FROM profiles ORDER BY created_at DESC`);
  return res.rows;
});
const adminSetApproved_createServerFn_handler = createServerRpc({
  id: "f80659a73751ebe7d04281a87f2f81f2bd5ef623a0fc426d8c876685328309eb",
  name: "adminSetApproved",
  filename: "src/api/admin.ts"
}, (opts) => adminSetApproved.__executeServer(opts));
const adminSetApproved = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminSetApproved_createServerFn_handler, async ({
  data
}) => {
  await query(`UPDATE profiles SET approved = $2, approval_status = $3, updated_at = now() WHERE id = $1`, [data.id, data.approved, data.approved ? "approved" : "rejected"]);
  return {
    ok: true
  };
});
const adminApproveMember_createServerFn_handler = createServerRpc({
  id: "c3bfe3a2c096ba26f815ef6a60a40d11dd40e783f0724c9d46c49d60b5f8c11c",
  name: "adminApproveMember",
  filename: "src/api/admin.ts"
}, (opts) => adminApproveMember.__executeServer(opts));
const adminApproveMember = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminApproveMember_createServerFn_handler, async ({
  data,
  context
}) => {
  await query(`UPDATE profiles SET approved = true, approval_status = 'approved',
         approved_by = $2, approved_at = now(), rejection_reason = null, updated_at = now()
       WHERE id = $1`, [data.id, context.userId]);
  return {
    ok: true
  };
});
const adminRejectMember_createServerFn_handler = createServerRpc({
  id: "082af6fd188e6980fd70c85137ee735c7be7609c7d1ef620ceaf681f60e7e6d7",
  name: "adminRejectMember",
  filename: "src/api/admin.ts"
}, (opts) => adminRejectMember.__executeServer(opts));
const adminRejectMember = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminRejectMember_createServerFn_handler, async ({
  data,
  context
}) => {
  await query(`UPDATE profiles SET approved = false, approval_status = 'rejected',
         approved_by = $2, approved_at = now(), rejection_reason = $3, updated_at = now()
       WHERE id = $1`, [data.id, context.userId, data.reason || null]);
  return {
    ok: true
  };
});
const adminMarkNeedsClarification_createServerFn_handler = createServerRpc({
  id: "80b4e7e75233e7d4dda47d7ca8ddb91e40ba48a371055282e64e9505dffad743",
  name: "adminMarkNeedsClarification",
  filename: "src/api/admin.ts"
}, (opts) => adminMarkNeedsClarification.__executeServer(opts));
const adminMarkNeedsClarification = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminMarkNeedsClarification_createServerFn_handler, async ({
  data,
  context
}) => {
  await query(`UPDATE profiles SET approved = false, approval_status = 'needs_clarification',
         approved_by = $2, approved_at = now(), rejection_reason = $3, updated_at = now()
       WHERE id = $1`, [data.id, context.userId, data.reason || null]);
  return {
    ok: true
  };
});
const adminDeleteMember_createServerFn_handler = createServerRpc({
  id: "91d2db02a8ed0bba0d95f0aeec58a5f16f944e7dc3bec7869e59b8c0a2425a5e",
  name: "adminDeleteMember",
  filename: "src/api/admin.ts"
}, (opts) => adminDeleteMember.__executeServer(opts));
const adminDeleteMember = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminDeleteMember_createServerFn_handler, async ({
  data
}) => {
  await query(`DELETE FROM profiles WHERE id = $1`, [data.id]);
  return {
    ok: true
  };
});
const adminEditMember_createServerFn_handler = createServerRpc({
  id: "63d780fa105295476f24c9c2d3c6854052558ff652953184f0cd511c8a3fd20f",
  name: "adminEditMember",
  filename: "src/api/admin.ts"
}, (opts) => adminEditMember.__executeServer(opts));
const adminEditMember = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminEditMember_createServerFn_handler, async ({
  data
}) => {
  const res = await query(`UPDATE profiles SET
         full_name = COALESCE($2, full_name),
         phone = COALESCE($3, phone),
         whatsapp = COALESCE($4, whatsapp),
         location = COALESCE($5, location),
         profession = COALESCE($6, profession),
         bio = COALESCE($7, bio),
         spouse_name = COALESCE($8, spouse_name),
         clinic_or_hospital = COALESCE($9, clinic_or_hospital),
         country_state = COALESCE($10, country_state),
         updated_at = now()
       WHERE id = $1
       RETURNING ${PROFILE_COLUMNS}`, [data.id, data.full_name ?? null, data.phone ?? null, data.whatsapp ?? null, data.location ?? null, data.profession ?? null, data.bio ?? null, data.spouse_name ?? null, data.clinic_or_hospital ?? null, data.country_state ?? null]);
  return res.rows[0];
});
async function upsertManualMember(c, data) {
  const email = data.email.trim().toLowerCase();
  const existing = await c.query(`SELECT id FROM profiles WHERE lower(email) = $1`, [email]);
  const approved = data.approval_status === "approved";
  if (existing.rows[0]) {
    await c.query(`UPDATE profiles SET
         full_name = $2, phone = COALESCE($3, phone), location = COALESCE($4, location),
         profession = COALESCE($5, profession), approved = $6, approval_status = $7, updated_at = now()
       WHERE id = $1`, [existing.rows[0].id, data.full_name, data.phone || null, data.location || null, data.profession || null, approved, data.approval_status]);
    return;
  }
  const id = (await c.query(`SELECT gen_random_uuid()::text AS id`)).rows[0].id;
  await c.query(`INSERT INTO users (id, email, first_name, last_name) VALUES ($1, $2, $3, '')`, [id, email, data.full_name]);
  await c.query(`INSERT INTO profiles (id, full_name, email, phone, location, profession, approved, approval_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [id, data.full_name, email, data.phone || null, data.location || null, data.profession || null, approved, data.approval_status]);
}
const adminAddMember_createServerFn_handler = createServerRpc({
  id: "355c4dd76ac358bb48a8c6612b77e35c12200da079e0f804bbf0b7aa390db15a",
  name: "adminAddMember",
  filename: "src/api/admin.ts"
}, (opts) => adminAddMember.__executeServer(opts));
const adminAddMember = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminAddMember_createServerFn_handler, async ({
  data
}) => {
  if (!data.email.trim() || !data.full_name.trim()) {
    throw new Error("Name and email are required.");
  }
  await withTransaction((c) => upsertManualMember(c, data));
  return {
    ok: true
  };
});
const VALID_APPROVAL_STATUSES = ["pending", "approved", "rejected", "needs_clarification"];
const adminImportMembers_createServerFn_handler = createServerRpc({
  id: "f2f1d73450c75fe616ce151985c651bf867749190fc8631a984145afda6f2dca",
  name: "adminImportMembers",
  filename: "src/api/admin.ts"
}, (opts) => adminImportMembers.__executeServer(opts));
const adminImportMembers = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminImportMembers_createServerFn_handler, async ({
  data
}) => {
  let imported = 0;
  let skipped = 0;
  await withTransaction(async (c) => {
    for (const row of data.rows) {
      if (!row.email?.trim() || !row.full_name?.trim()) {
        skipped++;
        continue;
      }
      const status = row.approval_status && VALID_APPROVAL_STATUSES.includes(row.approval_status) ? row.approval_status : data.approval_status;
      await upsertManualMember(c, {
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        location: row.location,
        profession: row.profession,
        approval_status: status
      });
      imported++;
    }
  });
  return {
    imported,
    skipped
  };
});
const adminListAdmins_createServerFn_handler = createServerRpc({
  id: "4e5184038c95b9b4be4d8017fa92ccb1a2349a33c1868ee58f0926ec7703fe71",
  name: "adminListAdmins",
  filename: "src/api/admin.ts"
}, (opts) => adminListAdmins.__executeServer(opts));
const adminListAdmins = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListAdmins_createServerFn_handler, async () => {
  const res = await query(`SELECT p.id, p.full_name, p.email
       FROM profiles p
       JOIN user_roles ur ON ur.user_id = p.id
       WHERE ur.role = 'admin'
       ORDER BY p.full_name ASC`);
  return res.rows;
});
const adminPromoteToAdmin_createServerFn_handler = createServerRpc({
  id: "1464523d4f52a12c9ac7f98dd7c201ac82c0cbbf561fcd35919c29ee1ca6e3e1",
  name: "adminPromoteToAdmin",
  filename: "src/api/admin.ts"
}, (opts) => adminPromoteToAdmin.__executeServer(opts));
const adminPromoteToAdmin = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminPromoteToAdmin_createServerFn_handler, async ({
  data
}) => {
  await query(`INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')
       ON CONFLICT (user_id, role) DO NOTHING`, [data.id]);
  return {
    ok: true
  };
});
const adminAddAdminByEmail_createServerFn_handler = createServerRpc({
  id: "92937af1bb33b1ff012316154c953adc2659a5bc7004a69a2e8d3b84b5ef1675",
  name: "adminAddAdminByEmail",
  filename: "src/api/admin.ts"
}, (opts) => adminAddAdminByEmail.__executeServer(opts));
const adminAddAdminByEmail = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminAddAdminByEmail_createServerFn_handler, async ({
  data
}) => {
  const res = await query(`SELECT id, approval_status FROM profiles WHERE lower(email) = $1`, [data.email.trim().toLowerCase()]);
  const member = res.rows[0];
  if (!member) {
    throw new Error("Member not found. Ask them to sign up first.");
  }
  await withTransaction(async (c) => {
    if (member.approval_status !== "approved") {
      await c.query(`UPDATE profiles SET approved = true, approval_status = 'approved', updated_at = now() WHERE id = $1`, [member.id]);
    }
    await c.query(`INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')
         ON CONFLICT (user_id, role) DO NOTHING`, [member.id]);
  });
  return {
    ok: true
  };
});
const adminDemoteAdmin_createServerFn_handler = createServerRpc({
  id: "b532af46b30b817c147fe52eef03bcf074cd63c53edbd132b514d8626fc89a39",
  name: "adminDemoteAdmin",
  filename: "src/api/admin.ts"
}, (opts) => adminDemoteAdmin.__executeServer(opts));
const adminDemoteAdmin = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminDemoteAdmin_createServerFn_handler, async ({
  data
}) => {
  await withTransaction(async (c) => {
    const countRes = await c.query(`SELECT count(*) FROM user_roles WHERE role = 'admin'`);
    if (Number(countRes.rows[0].count) <= 1) {
      throw new Error("Cannot remove the last admin.");
    }
    await c.query(`DELETE FROM user_roles WHERE user_id = $1 AND role = 'admin'`, [data.id]);
  });
  return {
    ok: true
  };
});
const MAX_EVENT_COVER_BYTES = 15 * 1024 * 1024;
const ALLOWED_EVENT_COVER_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const adminListEvents_createServerFn_handler = createServerRpc({
  id: "7a3225d66cddcae21d467888a23a4528fa85dd5a98749511d8c12ba896128b24",
  name: "adminListEvents",
  filename: "src/api/admin.ts"
}, (opts) => adminListEvents.__executeServer(opts));
const adminListEvents = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListEvents_createServerFn_handler, async () => {
  const res = await query(`SELECT id, title, description, location, event_date,
         COALESCE(cover_url, CASE WHEN cover_data IS NOT NULL THEN '/api/events/cover/' || id ELSE NULL END) AS cover_url,
         created_by, created_at
       FROM events ORDER BY event_date DESC`);
  return res.rows;
});
const adminCreateEvent_createServerFn_handler = createServerRpc({
  id: "82f5cb86f35bd9178a9443e3554cebbe7004025c1adfe674ae323573312dd9b0",
  name: "adminCreateEvent",
  filename: "src/api/admin.ts"
}, (opts) => adminCreateEvent.__executeServer(opts));
const adminCreateEvent = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminCreateEvent_createServerFn_handler, async ({
  data,
  context
}) => {
  const title = data.title.trim();
  const description = (data.description ?? "").trim();
  const location = (data.location ?? "").trim();
  const eventDate = data.event_date;
  if (!title || !eventDate) throw new Error("Title and date are required");
  let coverUrl = null;
  let fbStoragePath = null;
  let fileName = null;
  let fileSize = null;
  if (data.url) {
    if (!data.mimeType || !ALLOWED_EVENT_COVER_TYPES.has(data.mimeType)) {
      throw new Error("Unsupported image format. Please use JPG, PNG, or WEBP.");
    }
    if ((data.fileSize ?? 0) > MAX_EVENT_COVER_BYTES) {
      throw new Error("This file is too large. Please upload a smaller image or compressed version.");
    }
    coverUrl = data.url;
    fbStoragePath = data.storagePath || null;
    fileName = data.fileName || null;
    fileSize = data.fileSize ?? null;
  }
  await query(`INSERT INTO events (title, description, location, event_date, cover_url, fb_storage_path, file_name, file_size, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [title, description || null, location || null, eventDate, coverUrl, fbStoragePath, fileName, fileSize, context.userId]);
  return {
    ok: true
  };
});
const adminDeleteEvent_createServerFn_handler = createServerRpc({
  id: "f2caf8b24de957da6e25136743bf9dbde0f9be442974708ae907776e3f70c0b2",
  name: "adminDeleteEvent",
  filename: "src/api/admin.ts"
}, (opts) => adminDeleteEvent.__executeServer(opts));
const adminDeleteEvent = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminDeleteEvent_createServerFn_handler, async ({
  data
}) => {
  const owned = await query(`SELECT fb_storage_path FROM events WHERE id = $1`, [data.id]);
  const row = owned.rows[0];
  await query(`DELETE FROM events WHERE id = $1`, [data.id]);
  return {
    ok: true,
    fbStoragePath: row?.fb_storage_path ?? null
  };
});
const adminListAnnouncements_createServerFn_handler = createServerRpc({
  id: "abbd89f6fc101c9170ede0022a5ab4e6213a064bf7b28b7a70418e2b65dae7dd",
  name: "adminListAnnouncements",
  filename: "src/api/admin.ts"
}, (opts) => adminListAnnouncements.__executeServer(opts));
const adminListAnnouncements = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListAnnouncements_createServerFn_handler, async () => {
  const res = await query(`SELECT * FROM announcements ORDER BY created_at DESC`);
  return res.rows;
});
const adminCreateAnnouncement_createServerFn_handler = createServerRpc({
  id: "142a3fbf7b6f1ed14faef1e10f07896028aff765190abb08643bb78b00bf49a2",
  name: "adminCreateAnnouncement",
  filename: "src/api/admin.ts"
}, (opts) => adminCreateAnnouncement.__executeServer(opts));
const adminCreateAnnouncement = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminCreateAnnouncement_createServerFn_handler, async ({
  data,
  context
}) => {
  await query(`INSERT INTO announcements (kind, title, body, created_by) VALUES ($1, $2, $3, $4)`, [data.kind, data.title, data.body || null, context.userId]);
  return {
    ok: true
  };
});
const adminDeleteAnnouncement_createServerFn_handler = createServerRpc({
  id: "58d13b952375517eb870ded588f0ef84eb561f293212c25c9a2da841e9473471",
  name: "adminDeleteAnnouncement",
  filename: "src/api/admin.ts"
}, (opts) => adminDeleteAnnouncement.__executeServer(opts));
const adminDeleteAnnouncement = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminDeleteAnnouncement_createServerFn_handler, async ({
  data
}) => {
  await query(`DELETE FROM announcements WHERE id = $1`, [data.id]);
  return {
    ok: true
  };
});
const adminListDonations_createServerFn_handler = createServerRpc({
  id: "1a7d7c65412cdca16eb0de2a11e593b822c23a9389d2262d883f4bc87205f8e0",
  name: "adminListDonations",
  filename: "src/api/admin.ts"
}, (opts) => adminListDonations.__executeServer(opts));
const adminListDonations = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListDonations_createServerFn_handler, async () => {
  const res = await query(`SELECT * FROM donations ORDER BY donated_on DESC`);
  return res.rows;
});
const adminCreateDonation_createServerFn_handler = createServerRpc({
  id: "7fca82a78e7d10055176dfaa23ed9cd3772f61e8de62163d7417073db2b883fb",
  name: "adminCreateDonation",
  filename: "src/api/admin.ts"
}, (opts) => adminCreateDonation.__executeServer(opts));
const adminCreateDonation = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminCreateDonation_createServerFn_handler, async ({
  data,
  context
}) => {
  await query(`INSERT INTO donations (donor_name, amount, purpose, created_by) VALUES ($1, $2, $3, $4)`, [data.donor_name, data.amount, data.purpose || null, context.userId]);
  return {
    ok: true
  };
});
const adminListExpenses_createServerFn_handler = createServerRpc({
  id: "9e3244a06d76ac1db210e3898f660fd60c95392e7c26c94bfcf1223eea278ffd",
  name: "adminListExpenses",
  filename: "src/api/admin.ts"
}, (opts) => adminListExpenses.__executeServer(opts));
const adminListExpenses = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListExpenses_createServerFn_handler, async () => {
  const res = await query(`SELECT * FROM expenses ORDER BY spent_on DESC`);
  return res.rows;
});
const adminCreateExpense_createServerFn_handler = createServerRpc({
  id: "5dbd2849812ad432b79463e1b89a40a82d64e1b06c0d2a385851fdc94292d655",
  name: "adminCreateExpense",
  filename: "src/api/admin.ts"
}, (opts) => adminCreateExpense.__executeServer(opts));
const adminCreateExpense = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminCreateExpense_createServerFn_handler, async ({
  data,
  context
}) => {
  await query(`INSERT INTO expenses (description, amount, category, created_by) VALUES ($1, $2, $3, $4)`, [data.description, data.amount, data.category || null, context.userId]);
  return {
    ok: true
  };
});
const adminListSupport_createServerFn_handler = createServerRpc({
  id: "d72c5c06d2bc3f5b12e7b288633d2aa9af2bba3381b5fe173823cad877d7b23b",
  name: "adminListSupport",
  filename: "src/api/admin.ts"
}, (opts) => adminListSupport.__executeServer(opts));
const adminListSupport = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListSupport_createServerFn_handler, async () => {
  const res = await query(`SELECT s.id, s.category, s.subject, s.message, s.status, s.created_at,
         json_build_object('full_name', p.full_name, 'phone', p.phone) AS profiles
       FROM support_requests s
       LEFT JOIN profiles p ON p.id = s.user_id
       ORDER BY s.created_at DESC`);
  return res.rows;
});
const adminResolveSupport_createServerFn_handler = createServerRpc({
  id: "113d6f5745a16c6fb7fbb95bfcfb5f0ad98fbf61ed247242c7e006aad734c2e6",
  name: "adminResolveSupport",
  filename: "src/api/admin.ts"
}, (opts) => adminResolveSupport.__executeServer(opts));
const adminResolveSupport = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminResolveSupport_createServerFn_handler, async ({
  data
}) => {
  await query(`UPDATE support_requests SET status = 'resolved' WHERE id = $1`, [data.id]);
  return {
    ok: true
  };
});
const adminListBlogs_createServerFn_handler = createServerRpc({
  id: "b3475189735a5d0577d4b5cd2a9cdd4c8691cca4bc4dbbff9a1e5a110e87d4c3",
  name: "adminListBlogs",
  filename: "src/api/admin.ts"
}, (opts) => adminListBlogs.__executeServer(opts));
const adminListBlogs = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListBlogs_createServerFn_handler, async () => {
  const res = await query(`SELECT b.id, b.title, b.category, b.is_featured, b.is_published, b.created_at, b.author_id,
         json_build_object('full_name', p.full_name) AS profiles
       FROM blogs b
       LEFT JOIN profiles p ON p.id = b.author_id
       ORDER BY b.created_at DESC`);
  return res.rows;
});
const adminDeleteBlog_createServerFn_handler = createServerRpc({
  id: "7e82e53e8f34aa823898e00db77bd962618e9c2f9c206e5238d43ff48e2fdb62",
  name: "adminDeleteBlog",
  filename: "src/api/admin.ts"
}, (opts) => adminDeleteBlog.__executeServer(opts));
const adminDeleteBlog = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminDeleteBlog_createServerFn_handler, async ({
  data
}) => {
  const owned = await query(`SELECT fb_storage_path FROM blogs WHERE id = $1`, [data.id]);
  const row = owned.rows[0];
  await query(`DELETE FROM blogs WHERE id = $1`, [data.id]);
  return {
    ok: true,
    fbStoragePath: row?.fb_storage_path ?? null
  };
});
const ADMIN_FILE_URL_SQL = `
  CASE
    WHEN g.file_url IS NOT NULL THEN g.file_url
    WHEN g.storage_path ~* '^https?://' THEN g.storage_path
    ELSE NULL
  END`;
const adminListGallery_createServerFn_handler = createServerRpc({
  id: "0ce3d98f5711328660c7d28527ee34ab887eea0ab1aa2ed0b6c6c24a156c3051",
  name: "adminListGallery",
  filename: "src/api/admin.ts"
}, (opts) => adminListGallery.__executeServer(opts));
const adminListGallery = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListGallery_createServerFn_handler, async () => {
  const res = await query(`SELECT g.id, g.title, g.caption, g.media_type, g.storage_path,
         ${ADMIN_FILE_URL_SQL} AS file_url,
         (${ADMIN_FILE_URL_SQL}) IS NOT NULL AS file_available,
         g.created_at, g.uploaded_by,
         json_build_object('full_name', p.full_name) AS profiles
       FROM gallery_items g
       LEFT JOIN profiles p ON p.id = g.uploaded_by
       WHERE g.deleted_at IS NULL
       ORDER BY g.created_at DESC`);
  return res.rows;
});
const adminDeleteGalleryItem_createServerFn_handler = createServerRpc({
  id: "8768c7aebfc80c8128938a9e719cf96eef7b3aa3c4b05da5e14bd5fbdc9d29c1",
  name: "adminDeleteGalleryItem",
  filename: "src/api/admin.ts"
}, (opts) => adminDeleteGalleryItem.__executeServer(opts));
const adminDeleteGalleryItem = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminDeleteGalleryItem_createServerFn_handler, async ({
  data
}) => {
  const owned = await query(`SELECT fb_storage_path FROM gallery_items WHERE id = $1`, [data.id]);
  const row = owned.rows[0];
  await query(`DELETE FROM gallery_items WHERE id = $1`, [data.id]);
  return {
    ok: true,
    fbStoragePath: row?.fb_storage_path ?? null
  };
});
const adminListMemories_createServerFn_handler = createServerRpc({
  id: "359b2c1e148fe803d9a93be4df51b0d7de21e435eab157368113289fc72b0f55",
  name: "adminListMemories",
  filename: "src/api/admin.ts"
}, (opts) => adminListMemories.__executeServer(opts));
const adminListMemories = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListMemories_createServerFn_handler, async () => {
  const res = await query(`SELECT m.id, m.title, m.body, m.created_at, m.user_id,
         json_build_object('full_name', p.full_name) AS profiles
       FROM memories m
       LEFT JOIN profiles p ON p.id = m.user_id
       ORDER BY m.created_at DESC`);
  return res.rows;
});
const adminDeleteMemory_createServerFn_handler = createServerRpc({
  id: "15bd09a4335e8cf086e8a324bea31db008b60dee7d4c1522d56fac28c3c1de36",
  name: "adminDeleteMemory",
  filename: "src/api/admin.ts"
}, (opts) => adminDeleteMemory.__executeServer(opts));
const adminDeleteMemory = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => d).handler(adminDeleteMemory_createServerFn_handler, async ({
  data
}) => {
  const owned = await query(`SELECT fb_storage_path FROM memories WHERE id = $1`, [data.id]);
  const row = owned.rows[0];
  await query(`DELETE FROM memories WHERE id = $1`, [data.id]);
  return {
    ok: true,
    fbStoragePath: row?.fb_storage_path ?? null
  };
});
export {
  adminAddAdminByEmail_createServerFn_handler,
  adminAddMember_createServerFn_handler,
  adminApproveMember_createServerFn_handler,
  adminCreateAnnouncement_createServerFn_handler,
  adminCreateDonation_createServerFn_handler,
  adminCreateEvent_createServerFn_handler,
  adminCreateExpense_createServerFn_handler,
  adminDeleteAnnouncement_createServerFn_handler,
  adminDeleteBlog_createServerFn_handler,
  adminDeleteEvent_createServerFn_handler,
  adminDeleteGalleryItem_createServerFn_handler,
  adminDeleteMember_createServerFn_handler,
  adminDeleteMemory_createServerFn_handler,
  adminDemoteAdmin_createServerFn_handler,
  adminEditMember_createServerFn_handler,
  adminImportMembers_createServerFn_handler,
  adminListAdmins_createServerFn_handler,
  adminListAnnouncements_createServerFn_handler,
  adminListBlogs_createServerFn_handler,
  adminListDonations_createServerFn_handler,
  adminListEvents_createServerFn_handler,
  adminListExpenses_createServerFn_handler,
  adminListGallery_createServerFn_handler,
  adminListMembers_createServerFn_handler,
  adminListMemories_createServerFn_handler,
  adminListSupport_createServerFn_handler,
  adminMarkNeedsClarification_createServerFn_handler,
  adminPromoteToAdmin_createServerFn_handler,
  adminRejectMember_createServerFn_handler,
  adminResolveSupport_createServerFn_handler,
  adminSetApproved_createServerFn_handler
};
