// Minimal Resend wrapper using fetch — no SDK dependency needed.
// Never throws: signup (and any other caller) must succeed even if email
// sending is unconfigured or fails, per product requirement.

const RESEND_API_URL = "https://api.resend.com/emails";

export interface NewMemberNotification {
  name: string;
  email: string | null;
  mobile: string | null;
  city: string | null;
  profession: string | null;
  signupTime: Date;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendNewMemberAdminNotification(
  adminEmails: string[],
  member: NewMemberNotification,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ADMIN_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn(
      "[email] RESEND_API_KEY/ADMIN_FROM_EMAIL not configured — skipping new-member admin notification",
    );
    return;
  }
  if (adminEmails.length === 0) {
    console.warn("[email] no admin emails found — skipping new-member admin notification");
    return;
  }

  const approvalLink = "https://simcosa-84-85.vercel.app/admin";
  const fields: [string, string][] = [
    ["Name", member.name],
    ["Email", member.email ?? "—"],
    ["Mobile", member.mobile ?? "—"],
    ["City", member.city ?? "—"],
    ["Profession", member.profession ?? "—"],
    ["Signup time", member.signupTime.toUTCString()],
  ];

  const html = `
    <h2>New SIMCOSA member awaiting approval</h2>
    <table cellpadding="6" cellspacing="0">
      ${fields.map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`).join("")}
    </table>
    <p><a href="${approvalLink}">Review and approve at ${approvalLink}</a></p>
  `;
  const text = [
    ...fields.map(([label, value]) => `${label}: ${value}`),
    "",
    `Approve at: ${approvalLink}`,
  ].join("\n");

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: adminEmails,
        subject: "New SIMCOSA member awaiting approval",
        html,
        text,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn("[email] Resend request failed:", res.status, detail);
    }
  } catch (err) {
    console.warn("[email] failed to send new-member admin notification:", err);
  }
}
