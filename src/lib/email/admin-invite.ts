import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder_key");

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  CFO: "CFO",
  CUSTOMER_CARE: "Customer Care",
  ANALYTICS: "Analytics",
};

const ROLE_DESC: Record<string, string> = {
  SUPER_ADMIN: "Full platform access : vendors, finance, team management.",
  CFO: "Finance & revenue metrics : MRR, ARR, subscription analytics.",
  CUSTOMER_CARE: "Vendor support : search, contact, and assist vendors.",
  ANALYTICS: "Platform insights : credit trends, university coverage, scores.",
};

interface InviteEmailParams {
  name: string;
  email: string;
  role: string;
  inviteUrl: string;
}

export async function sendAdminInviteEmail({
  name,
  email,
  role,
  inviteUrl,
}: InviteEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.log(
      `\n[ADMIN INVITE EMAIL → ${email}]\n  Name: ${name}\n  Role: ${role}\n  Link: ${inviteUrl}\n`,
    );
    return;
  }

  const roleLabel = ROLE_LABELS[role] ?? role;
  const roleDesc = ROLE_DESC[role] ?? "";

  await resend.emails.send({
    from: "Vodium Ledger <noreply@vodiumledger.com>",
    to: email,
    subject: `You've been invited to Vodium Ledger Admin Console`,
    html: buildHtml({ name, roleLabel, roleDesc, inviteUrl }),
  });
}

function buildHtml({
  name,
  roleLabel,
  roleDesc,
  inviteUrl,
}: {
  name: string;
  roleLabel: string;
  roleDesc: string;
  inviteUrl: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:48px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#1F1F1F;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:#0A0A0A;padding:28px 40px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#C9A961;letter-spacing:0.15em;">VODIUM LEDGER</p>
            <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:0.2em;text-transform:uppercase;">Admin Console</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:12px;color:#C9A961;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;">Team invitation</p>
            <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#FAFAF7;line-height:1.3;">
              Welcome to the team, ${name}
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:rgba(250,250,247,0.55);line-height:1.6;">
              You've been invited to join the Vodium Ledger Admin Console.
            </p>

            <!-- Role card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(201,169,97,0.06);border:1px solid rgba(201,169,97,0.15);border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:11px;color:#C9A961;letter-spacing:0.2em;text-transform:uppercase;">Your role</p>
                  <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:20px;color:#FAFAF7;">${roleLabel}</p>
                  <p style="margin:0;font-size:13px;color:rgba(250,250,247,0.45);">${roleDesc}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;font-size:14px;color:rgba(250,250,247,0.45);line-height:1.6;">
              Click the button below to set your password and activate your account.
              This link expires in <strong style="color:rgba(250,250,247,0.7);">48 hours</strong>.
            </p>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${inviteUrl}"
                     style="display:inline-block;background:#C9A961;color:#0A0A0A;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.03em;">
                    Activate your account →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:12px;color:rgba(250,250,247,0.25);line-height:1.6;">
              Or copy this link into your browser:<br>
              <span style="color:rgba(201,169,97,0.6);word-break:break-all;">${inviteUrl}</span>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0A0A0A;padding:16px 40px;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="margin:0;font-size:11px;color:rgba(250,250,247,0.2);">
              © ${new Date().getFullYear()} Vodium Ledger · If you did not expect this invitation, ignore this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
