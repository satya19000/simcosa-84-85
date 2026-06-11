import { c as createServerRpc } from "./createServerRpc-BDy9UL80.js";
import { r as requireAdmin } from "./middleware-CoxskvJW.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-DZvL4NrQ.js";
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
  const res = await query(`SELECT id, full_name, photo_url, phone, whatsapp, email, location, profession, bio, approved
       FROM profiles ORDER BY created_at DESC`);
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
  await query(`UPDATE profiles SET approved = $2, updated_at = now() WHERE id = $1`, [data.id, data.approved]);
  return {
    ok: true
  };
});
const adminListEvents_createServerFn_handler = createServerRpc({
  id: "7a3225d66cddcae21d467888a23a4528fa85dd5a98749511d8c12ba896128b24",
  name: "adminListEvents",
  filename: "src/api/admin.ts"
}, (opts) => adminListEvents.__executeServer(opts));
const adminListEvents = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListEvents_createServerFn_handler, async () => {
  const res = await query(`SELECT * FROM events ORDER BY event_date DESC`);
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
  await query(`INSERT INTO events (title, description, location, event_date, created_by)
       VALUES ($1, $2, $3, $4, $5)`, [data.title, data.description || null, data.location || null, data.event_date, context.userId]);
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
  await query(`DELETE FROM events WHERE id = $1`, [data.id]);
  return {
    ok: true
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
export {
  adminCreateAnnouncement_createServerFn_handler,
  adminCreateDonation_createServerFn_handler,
  adminCreateEvent_createServerFn_handler,
  adminCreateExpense_createServerFn_handler,
  adminDeleteAnnouncement_createServerFn_handler,
  adminDeleteEvent_createServerFn_handler,
  adminListAnnouncements_createServerFn_handler,
  adminListDonations_createServerFn_handler,
  adminListEvents_createServerFn_handler,
  adminListExpenses_createServerFn_handler,
  adminListMembers_createServerFn_handler,
  adminListSupport_createServerFn_handler,
  adminResolveSupport_createServerFn_handler,
  adminSetApproved_createServerFn_handler
};
