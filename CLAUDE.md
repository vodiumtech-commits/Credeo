# Vodium Ledger — Claude Code Project Brief

This file is read by Claude Code (and any AI coding assistant) at the start of every session. It is the source of truth for what we are building, why, and how.

---

## What we're building

**Vodium Ledger** — a WhatsApp-first credit tracking and intelligence platform for Nigerian university campus vendors.

This is **Phase 1 of Vodium**. It builds the data + revenue foundation that earns us the right to launch Vodium Premium (a consumer credit card brand) in Year 2.

---

## North star

Capture proprietary repayment data on tens of thousands of Nigerian consumers in Year 1 by serving the vendors who already extend them credit informally. Every paying vendor and every tracked credit transaction grows the credit graph that no Nigerian fintech currently owns.

---

## Primary user

**Campus vendor.** Small shop, food canteen, laundry, printing, mini-mart on or near a Nigerian university campus. Low digital literacy. Lives in WhatsApp. Will not download a complex app. Loses money to defaults. Will pay ₦2K–₦10K/month for a tool that recovers even one default per term.

## Secondary user

**Student.** 17–25 years old. Uses WhatsApp daily. Takes credit at multiple campus vendors. Pays back when allowance arrives. Wants to build credit history for future financial products.

---

## Product principles

1. **WhatsApp is the product.** The web dashboard is the second-class citizen. Every core action a vendor needs must work via WhatsApp message.
2. **15 seconds to add a credit.** That's the design constraint. If something takes longer, it's wrong.
3. **Speak Nigerian.** Use ₦, Nigerian English, "owing" not "outstanding balance."
4. **Premium feel, simple function.** Inherit Vodium's brand (black + gold serif headers) but strip down to the essentials. Vendors should feel they're using something professional.
5. **Student dignity matters.** Reminders are respectful, never shaming.
6. **Trust signals before features.** Privacy, reliability, and security messaging beats new features.

---

## Tech stack (locked for v1)

- **Next.js 14 + TypeScript** (App Router)
- **Tailwind + shadcn/ui** for styling
- **PostgreSQL via Supabase** + **Prisma** ORM
- **Phone OTP via Twilio Verify** for auth (no passwords, no email)
- **Twilio WhatsApp Business API** for the bot
- **Termii** for SMS fallback
- **Paystack** for vendor subscription billing
- **Upstash Redis** for cache + rate limiting
- **PostHog** for product analytics
- **Sentry** for error monitoring
- **Vercel** for hosting

---

## What NOT to build in v1

- Native mobile apps (vendors won't download)
- In-app payments / direct lending (regulatory, not needed)
- ML credit models (rule-based scoring is fine until we have enough data)
- Multi-language support beyond English
- Offline mode
- Anything related to the future Vodium Premium card

If a feature doesn't directly help a vendor track credit or recover money, **cut it.**

---

## Brand tokens

| Token | Hex | Usage |
|---|---|---|
| `vodium-black` | `#0A0A0A` | Backgrounds, primary text |
| `vodium-gold` | `#C9A961` | Accents, CTAs |
| `vodium-cream` | `#FAFAF7` | Dashboard background |
| `vodium-charcoal` | `#1F1F1F` | Cards on dark |
| `success` | `#16A34A` | Paid status |
| `warning` | `#D97706` | Due soon |
| `danger` | `#DC2626` | Overdue |

Headers: **Playfair Display**. Body: **Inter**.

---

## Code conventions

- TypeScript strict mode, no `any` without comment.
- Naming: `Vendor`, `Student`, `Credit`, `Repayment` — keep model names noun-singular.
- Server Components by default in `app/`, mark Client Components with `"use client"`.
- Prisma client lives in `src/lib/prisma.ts` — always import from there.
- Currency stored as `Decimal(12, 2)` in NGN.
- Phone numbers stored E.164 (`+234…`).
- All Naira display via `formatNaira()` helper.

---

## Folder map

```
prisma/schema.prisma          ← all entities
src/app/                      ← Next.js routes
  api/whatsapp/route.ts       ← Twilio webhook
  api/auth/                   ← phone OTP
  dashboard/                  ← vendor web UI
  login/page.tsx              ← phone OTP login
src/lib/
  prisma.ts                   ← DB client singleton
  utils.ts                    ← cn(), formatNaira(), normalisePhoneNG()
  whatsapp/messages.ts        ← all bot copy
  whatsapp/state-machine.ts   ← conversation logic
  credit-score/score.ts       ← v1 rule-based scoring
scripts/seed.ts               ← dev seed data
```

---

## Current sprint focus

Refer to README for the 90-day roadmap. We're in **Weeks 1–2: Foundation** — get the repo running, ship the landing page, sign 5 pilot vendors.

---

## When you (Claude) help with this project

1. Always read this file first.
2. Always check `prisma/schema.prisma` before designing data flows.
3. Always check `src/lib/whatsapp/messages.ts` before writing new bot copy — keep voice consistent.
4. Prefer editing existing files over creating new ones.
5. Don't introduce new dependencies without asking — the stack above is locked.
6. Walk through architectural decisions out loud before writing code.
