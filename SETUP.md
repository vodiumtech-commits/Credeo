# Vodium Ledger — Local Setup

Step-by-step guide to get the project running on your machine.

## Prerequisites

- **Node.js 20+** (`node -v`)
- **npm** (or pnpm/bun if you prefer)
- A **Supabase** project (free tier is fine) → https://supabase.com
- A **Twilio** account → https://twilio.com (free trial credit)
- A **Paystack** account → https://paystack.com (test mode)

## 1. Install dependencies

```bash
cd vodium-ledger
npm install
```

## 2. Configure environment

```bash
cp .env.example .env.local
```

Then fill in:

### Supabase
- Go to your Supabase project → Settings → Database → Connection string (URI). Copy as `DATABASE_URL` and `DIRECT_URL`.
- Settings → API → copy `Project URL` (`NEXT_PUBLIC_SUPABASE_URL`) and the `anon` + `service_role` keys.

### Twilio
- Console → Account SID + Auth Token.
- Verify → create a service → copy the Service SID into `TWILIO_VERIFY_SERVICE_SID`.
- WhatsApp → Sandbox: follow Twilio's instructions to join your sandbox. Use the sandbox number as `TWILIO_WHATSAPP_FROM`.

### Paystack
- Settings → API Keys → use **test** keys for now.

## 3. Initialize the database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

This creates the schema in your Supabase Postgres and generates the typed Prisma client.

## 4. (Optional) seed pilot data

```bash
npm run seed
```

Creates one university (UNILAG), one vendor, two students, and two open credits.

## 5. Run dev server

```bash
npm run dev
```

Open http://localhost:3000.

## 6. Wire up the WhatsApp webhook

For local testing, expose port 3000 with ngrok:

```bash
npx ngrok http 3000
```

Take the HTTPS URL ngrok gives you (e.g. `https://abc123.ngrok.io`) and configure it in Twilio:

**Twilio Console → Messaging → Try it out → WhatsApp sandbox settings**

- **When a message comes in:** `https://abc123.ngrok.io/api/whatsapp` (POST)

Now send a WhatsApp message to your sandbox number. You should see logs in your dev console and the bot replies.

## 7. Deploy to Vercel

```bash
vercel
```

After deploy:

- Add all `.env.local` variables to Vercel project settings.
- Update Twilio webhook URL to your Vercel URL: `https://vodium-ledger.vercel.app/api/whatsapp`
- Run migrations against production DB: `npx prisma migrate deploy`

## Troubleshooting

**Prisma errors on first migrate?** Make sure `DATABASE_URL` uses the connection pooler URL and `DIRECT_URL` uses the direct one (Supabase exposes both).

**Twilio webhook not firing?** Check the URL is HTTPS and ends in `/api/whatsapp`. Twilio rejects http.

**Build fails on Vercel?** Make sure Vercel runs `prisma generate` — add it to your build command: `prisma generate && next build`.
