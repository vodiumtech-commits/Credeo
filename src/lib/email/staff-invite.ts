/**
 * Staff invitation email via Resend.
 * Falls back to console.log in dev when RESEND_API_KEY is missing.
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  HQ_ADMIN: "HQ Admin",
  BRANCH_MANAGER: "Branch Manager",
  BRANCH_STAFF: "Branch Staff",
  FINANCE: "Finance",
  AUDITOR: "Auditor",
};

interface StaffInviteParams {
  to: string;
  staffName: string;
  organizationName: string;
  branchName: string | null;
  role: string;
  /** Set for a brand-new account that must set a password. Null when an existing account was simply attached. */
  acceptUrl: string | null;
  loginUrl: string;
}

export async function sendStaffInviteEmail(params: StaffInviteParams) {
  const roleLabel = ROLE_LABELS[params.role] ?? params.role;
  const location = params.branchName ? `${params.organizationName} · ${params.branchName}` : params.organizationName;

  if (!process.env.RESEND_API_KEY) {
    console.log(
      `\n[STAFF INVITE EMAIL → ${params.to}] ${location} as ${roleLabel}\n` +
      (params.acceptUrl ? `Accept: ${params.acceptUrl}\n` : `Login: ${params.loginUrl}\n`)
    );
    return;
  }

  await resend.emails.send({
    from: "Vodium Ledger <noreply@vodiumledger.com>",
    to: params.to,
    subject: `You've been added to ${params.organizationName} on Vodium Ledger`,
    html: buildHtml({ ...params, roleLabel, location }),
  });
}

function buildHtml(p: StaffInviteParams & { roleLabel: string; location: string }) {
  const cta = p.acceptUrl
    ? `<a href="${p.acceptUrl}" style="display:inline-block;background:#C9A961;color:#0A0A0A;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:10px;">Set your password</a>`
    : `<a href="${p.loginUrl}" style="display:inline-block;background:#C9A961;color:#0A0A0A;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:10px;">Log in</a>`;
  const note = p.acceptUrl
    ? "Click below to set your password and activate your account."
    : "Your existing Vodium Ledger account now has access. Log in to get started.";

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:16px;padding:40px;">
        <tr><td>
          <p style="font-family:Georgia,serif;letter-spacing:4px;color:#C9A961;font-size:13px;margin:0 0 24px;">VODIUM LEDGER</p>
          <h1 style="font-family:Georgia,serif;color:#0A0A0A;font-size:22px;margin:0 0 12px;">Hi ${escapeHtml(p.staffName)},</h1>
          <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 8px;">
            You've been added to <strong>${escapeHtml(p.location)}</strong> as <strong>${p.roleLabel}</strong>.
          </p>
          <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 28px;">${note}</p>
          <div style="margin:0 0 28px;">${cta}</div>
          <p style="color:#999;font-size:12px;line-height:1.6;margin:0;">
            If you weren't expecting this, you can ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
