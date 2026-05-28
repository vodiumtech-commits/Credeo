/**
 * OTP email sender via Resend.
 * Falls back to console.log in dev when RESEND_API_KEY is missing.
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type Purpose = "login" | "register";

export async function sendOtpEmail(to: string, otp: string, purpose: Purpose) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[OTP EMAIL → ${to}]  Code: ${otp}  (${purpose})\n`);
    return;
  }

  const subject =
    purpose === "login"
      ? "Your Vodium Ledger login code"
      : "Verify your Vodium Ledger account";

  const action =
    purpose === "login" ? "complete your sign-in to" : "verify your";

  await resend.emails.send({
    from:    "Vodium Ledger <noreply@vodiumledger.com>",   // verify vodiumledger.com in Resend dashboard
    to,
    subject,
    html:    buildHtml(otp, action),
  });
}

function buildHtml(otp: string, action: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:48px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0A0A0A;padding:32px 40px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#C9A961;letter-spacing:0.15em;">VODIUM LEDGER</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:13px;color:#C9A961;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;">Security code</p>
            <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#0A0A0A;line-height:1.3;">
              Your verification code
            </h1>
            <p style="margin:0 0 32px;font-size:15px;color:#6B7280;line-height:1.6;">
              Use the code below to ${action} your Vodium Ledger account.<br>
              It expires in <strong>10 minutes</strong> and can only be used once.
            </p>

            <!-- OTP box -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="background:#0A0A0A;border-radius:12px;padding:28px;">
                  <p style="margin:0;font-family:'Courier New',monospace;font-size:40px;font-weight:700;color:#C9A961;letter-spacing:12px;">${otp}</p>
                </td>
              </tr>
            </table>

            <p style="margin:28px 0 0;font-size:13px;color:#9CA3AF;line-height:1.6;">
              If you didn't request this code, you can safely ignore this email.
              Someone may have typed your email address by mistake.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F9F9F7;padding:20px 40px;border-top:1px solid #F0F0EC;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;">
              © ${new Date().getFullYear()} Vodium Ledger · For campus vendors across Nigeria
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
