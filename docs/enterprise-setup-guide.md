# Enterprise Setup Guide

How a supermarket configures WhatsApp, domains, and how Vodium wires the Vercel
wildcard. Audience: Vodium operators + supermarket HQ admins.

---

## 1. WhatsApp configuration (HQ admin → Org settings → WhatsApp channels)

A supermarket can either use the **Vodium-managed number** (nothing to do — it's the
fallback) or connect **their own Meta WhatsApp number**.

### Connect your own number
1. In Meta **Business Manager**, create/verify a WhatsApp Business Account and add a phone number.
2. From the Meta **WhatsApp → API Setup** screen, copy:
   - **Phone number ID** (a long numeric id, not the phone number itself)
   - **WhatsApp Business Account ID**
   - A **permanent access token** (System User token recommended over the temporary 24h token).
3. In Vodium: **Dashboard → Org settings → WhatsApp channels → Add channel**:
   - Display name, phone number, **Phone number ID**, Business account ID.
   - Paste the **access token** in the "stored encrypted" field (AES-256-GCM at rest), **or** put the
     token in an env var and enter that var's name in "access token reference".
   - Save, then set the channel **Active**.
4. Point Meta's **webhook** at `https://<your-app-domain>/api/whatsapp` with the verify token
   `WHATSAPP_VERIFY_TOKEN`. Inbound messages are routed to the right org automatically by
   `phone_number_id` (see `src/app/api/whatsapp/route.ts`).

### How sending picks a number
`src/lib/whatsapp/channel-token.ts` resolves, in order:
1. the org's **ACTIVE** channel's encrypted token (decrypted at send time),
2. the env var named by the channel's **access token reference**,
3. the **global** `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID`.

Overdue reminders already send from the org's channel when configured.

### Requirements / gotchas
- **`SECRET_ENCRYPTION_KEY`** must be set to use the "paste token" option (`openssl rand -base64 32`).
  Without it, use the env-var-reference path.
- Tokens are **never** returned to the browser or written to the audit log.
- Templates for proactive (non-session) messages must be **approved in Meta** first.

---

## 2. Domain configuration (HQ admin → Org settings → Domains)

There are two paths. Most stores should just use the subdomain.

### A. Ready-to-use subdomain (recommended — zero DNS)
Every org has `‹slug›.vodiumledger.com` (shown in Org settings with a Copy button).
It works the moment the org exists, because the Vercel wildcard already routes it and the
app resolves the org by its slug. **Nothing to configure.**

Visiting it shows the store's **branded home** (`src/components/tenant-home.tsx`) with their
logo/colour and a "Staff sign in" button.

### B. Custom domain (e.g. `credit.oreofestores.com`)
1. HQ admin: **Org settings → Domains → "connect your own domain"**, enter the host. It's saved as **PENDING**.
2. In the store's DNS provider, add a record for that host:
   - **CNAME** `credit` → `cname.vercel-dns.com` (recommended), or
   - **A** record → `76.76.21.21` (apex domains that can't CNAME).
3. **Vodium operator** adds the domain to the Vercel project (Project → Settings → Domains → Add).
4. Back in Org settings, click **Verify**. Vodium performs a real DNS check
   (`src/lib/dns-verify.ts`) and only flips the domain to **VERIFIED** if it actually points at
   the platform. Once VERIFIED, `resolveTenantByHost` serves that org on that host.

### Branding by host
- Verified custom domains and `‹slug›.vodiumledger.com` → tenant-branded **home** and **login**.
- Apex (`vodiumledger.com`), `www`, `app`, `localhost` → the Vodium marketing site.

---

## 3. Vercel wildcard domain configuration (one-time, Vodium operator)

This is what makes `*.vodiumledger.com` route every supermarket subdomain to the app.

1. **Add the wildcard to the Vercel project**
   - Vercel → Project → **Settings → Domains → Add** → enter `*.vodiumledger.com`.
   - Also add the apex `vodiumledger.com` and `www.vodiumledger.com` if not present.
2. **DNS records at the domain's nameservers** (Cloudflare or your registrar):
   - Apex `vodiumledger.com`: A → `76.76.21.21` (Vercel), or use Vercel nameservers.
   - `www`: CNAME → `cname.vercel-dns.com`.
   - **Wildcard** `*`: CNAME → `cname.vercel-dns.com`.
   - On **Cloudflare**, set these records to **DNS only (grey cloud)**, not proxied, so Vercel can
     issue TLS for the wildcard.
3. **TLS**: Vercel auto-provisions a wildcard certificate for `*.vodiumledger.com` once DNS resolves.
   Wildcard certs cover one level only — `oreofe.vodiumledger.com` is covered,
   `a.b.vodiumledger.com` is not.
4. **Env vars** (Vercel → Settings → Environment Variables):
   - `NEXT_PUBLIC_APP_DOMAIN=vodiumledger.com`
   - `NEXT_PUBLIC_APP_URL=https://vodiumledger.com`
   - plus the standard production set.
5. **Verify**: open `https://anything.vodiumledger.com` — it should load the app (a non-existent
   slug just shows the marketing site, which is expected).

### Notes
- Reserved subdomains `www`, `app`, `admin` are excluded from tenant resolution
  (`src/lib/tenant-domain.ts`).
- A supermarket's slug is derived from its name at promotion time; keep slugs unique and clean.

---

## 4. Login & password reset

- Auth is **email + password → email OTP** (Resend). No phone/SMS.
- **Forgot password**: `/forgot-password` → emails a 6-digit reset code → set a new password and
  sign in. Linked from the login screen.
- Staff invited via Org settings receive an email to set their password and activate
  (`/staff/accept?token=…`).
