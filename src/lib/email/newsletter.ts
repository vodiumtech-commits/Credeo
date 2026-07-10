import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder_key");

const TEAM_EMAIL = "victorkalejaye1@gmail.com";

export async function sendNewsletterWelcome(subscriberEmail: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[NEWSLETTER SUBSCRIBE → ${subscriberEmail}]\n`);
    return;
  }

  await Promise.all([
    // Welcome email to subscriber
    resend.emails.send({
      from:    "Vodium Ledger <noreply@vodiumledger.com>",
      to:      subscriberEmail,
      subject: "You're on the Vodium Ledger list",
      html:    buildWelcomeHtml(subscriberEmail),
    }),
    // Notification to team
    resend.emails.send({
      from:    "Vodium Ledger <noreply@vodiumledger.com>",
      to:      TEAM_EMAIL,
      subject: `New newsletter subscriber: ${subscriberEmail}`,
      html:    buildNotifyHtml(subscriberEmail),
    }),
  ]);
}

function buildWelcomeHtml(email: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:48px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:#0A0A0A;padding:32px 40px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#C9A961;letter-spacing:0.15em;">VODIUM LEDGER</p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:13px;color:#C9A961;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;">Newsletter</p>
            <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#0A0A0A;line-height:1.3;">
              You're in.
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
              Thanks for subscribing. We write about vendor credit data, Nigerian fintech,
              and what we're learning building Vodium Ledger — the WhatsApp-first credit ledger for
              Nigerian vendors.
            </p>
            <p style="margin:0 0 32px;font-size:15px;color:#6B7280;line-height:1.6;">
              Expect one article every 2–4 weeks. No spam. Unsubscribe any time.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:24px 32px;">
                  <p style="margin:0 0 4px;font-size:11px;color:#C9A961;letter-spacing:0.2em;text-transform:uppercase;">Next up</p>
                  <p style="margin:0;font-family:Georgia,serif;font-size:16px;color:#FAFAF7;line-height:1.5;">
                    Why Nigerian vendors lose billions to informal credit every year
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6;">
              You subscribed with <span style="color:#0A0A0A;font-weight:600;">${email}</span>.
              If this wasn't you, ignore this email.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#F9F9F7;padding:20px 40px;border-top:1px solid #F0F0EC;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;">
              © ${new Date().getFullYear()} Vodium Ledger · For vendors across Nigeria
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildNotifyHtml(email: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#1F1F1F;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
        <tr>
          <td style="background:#0A0A0A;padding:24px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-family:Georgia,serif;font-size:16px;color:#C9A961;letter-spacing:0.12em;">VODIUM LEDGER</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:11px;color:#C9A961;letter-spacing:0.2em;text-transform:uppercase;">New subscriber</p>
            <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;color:#FAFAF7;">Someone just subscribed</h1>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(201,169,97,0.06);border:1px solid rgba(201,169,97,0.15);border-radius:10px;margin-bottom:20px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:15px;color:#C9A961;font-weight:600;">${email}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:rgba(250,250,247,0.35);">Subscribed via the blog page newsletter form.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
