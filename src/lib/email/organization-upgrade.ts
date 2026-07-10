import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder_key");

type UpgradeEmailParams = {
  to: string;
  ownerName: string;
  organizationName: string;
  organizationType: string;
  trialDays: number;
  dashboardUrl: string;
};

export async function sendOrganizationUpgradeEmail({
  to,
  ownerName,
  organizationName,
  organizationType,
  trialDays,
  dashboardUrl,
}: UpgradeEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.log(
      `\n[ORGANIZATION UPGRADE EMAIL -> ${to}]\n` +
      `  Owner: ${ownerName}\n` +
      `  Organization: ${organizationName}\n` +
      `  Type: ${organizationType}\n` +
      `  Trial: ${trialDays} days\n` +
      `  Dashboard: ${dashboardUrl}\n`
    );
    return;
  }

  await resend.emails.send({
    from: "Vodium Ledger <noreply@vodiumledger.com>",
    to,
    subject: `${organizationName} is now enabled for supermarket branches on Vodium Ledger`,
    html: buildHtml({ ownerName, organizationName, organizationType, trialDays, dashboardUrl }),
  });
}

function buildHtml({
  ownerName,
  organizationName,
  organizationType,
  trialDays,
  dashboardUrl,
}: Omit<UpgradeEmailParams, "to">) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:48px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #EFEDE5;">
        <tr>
          <td style="background:#0A0A0A;padding:30px 40px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:20px;color:#C9A961;letter-spacing:0.15em;">VODIUM LEDGER</p>
            <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:0.18em;text-transform:uppercase;">Enterprise Access</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:12px;color:#C9A961;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;">Account upgraded</p>
            <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:25px;color:#0A0A0A;line-height:1.25;">
              ${organizationName} is ready for branches
            </h1>
            <p style="margin:0 0 22px;font-size:15px;color:#5F615D;line-height:1.65;">
              Hello ${ownerName}, your Vodium Ledger account has been upgraded to a ${organizationType.toLowerCase()} organization.
              You can now manage branches, BNPL orders, coupons, ledger reports, and organization WhatsApp channels.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7ED;border:1px solid #EFE2BF;border-radius:12px;margin-bottom:26px;">
              <tr><td style="padding:18px 22px;">
                <p style="margin:0 0 4px;font-size:11px;color:#8A6A1F;letter-spacing:0.14em;text-transform:uppercase;">Trial period</p>
                <p style="margin:0;font-size:18px;color:#0A0A0A;font-weight:700;">${trialDays} days free access</p>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="${dashboardUrl}" style="display:inline-block;background:#C9A961;color:#0A0A0A;font-weight:800;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;">
                  Open enterprise dashboard
                </a>
              </td></tr>
            </table>
            <p style="margin:24px 0 0;font-size:12px;color:#9CA3AF;line-height:1.6;">
              If this upgrade was unexpected, contact Vodium Ledger support immediately.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
