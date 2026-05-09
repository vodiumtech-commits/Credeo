# Vodium Ledger

> Africa's credit infrastructure layer — starting with university campus vendors.

A WhatsApp-first credit tracking and intelligence platform that helps Nigerian campus vendors safely extend credit to students, automate repayment reminders, and access cross-vendor credit scores.

This is **Phase 1 of Vodium** — the data + revenue foundation that earns us the right to launch Vodium Premium (the consumer credit card brand) in Year 2.

---

## Vision

```
Phase 1 (Now) -> Campus credit infrastructure (B2B SaaS for vendors)
Phase 2 (Yr 2) -> Consumer credit products for graduates entering the workforce
Phase 3 (Yr 3+) -> Vodium Premium card for affluent professionals & HNWIs
```

Every paying vendor and every tracked student credit transaction builds the proprietary credit graph that no Nigerian fintech currently owns.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | Single codebase for web + API |
| Styling | Tailwind CSS + shadcn/ui | Speed + consistency with Vodium brand |
| Database | PostgreSQL via Supabase | Relational data, generous free tier |
| ORM | Prisma | Type-safe DB access |
| Auth | Phone OTP via Twilio Verify | Vendors don't trust email |
| WhatsApp | Twilio WhatsApp Business API | Easiest entry, migrate to Meta Cloud API at scale |
| SMS fallback | Termii | Cheap & reliable in Nigeria |
| Payments | Paystack | Nigerian-native, supports cards/transfer/USSD |
| Cache/Queues | Upstash Redis | Serverless, generous free tier |
| Analytics | PostHog | Open-source, self-hostable later |
| Errors | Sentry | Free tier covers MVP |
| Hosting | Vercel | Zero-config Next.js deploys |

**Estimated monthly infra cost for first 100 vendors: $30-$80.**

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env vars
cp .env.example .env.local
# Fill in your Supabase, Twilio, Paystack keys

# 3. Set up database
npx prisma migrate dev --name init
npx prisma generate

# 4. Seed pilot data (optional)
npm run seed

# 5. Run dev server
npm run dev
```

App will be live at `http://localhost:3000`.

---

## Project Structure

```
vodium-ledger/
├── prisma/
│   └── schema.prisma          # All entities live here
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── whatsapp/      # Twilio webhook handler
│   │   │   └── auth/          # Phone OTP endpoints
│   │   ├── dashboard/         # Vendor dashboard pages
│   │   ├── login/             # Phone OTP login
│   │   ├── layout.tsx         # Root layout with brand
│   │   ├── globals.css        # Tailwind + Vodium tokens
│   │   └── page.tsx           # Landing page
│   ├── components/ui/         # shadcn components
│   └── lib/
│       ├── prisma.ts          # Prisma client singleton
│       ├── whatsapp/          # Bot conversation logic
│       └── credit-score/      # Cross-vendor scoring
├── public/brand/              # Logo & brand assets
├── scripts/                   # Migration & seed scripts
└── README.md
```

---

## Brand System (Vodium)

| Token | Value | Usage |
|---|---|---|
| `--vodium-black` | `#0A0A0A` | Backgrounds, primary text |
| `--vodium-gold` | `#C9A961` | Accents, CTAs, highlights |
| `--vodium-cream` | `#FAFAF7` | Dashboard background |
| `--vodium-charcoal` | `#1F1F1F` | Cards on dark |
| `--success-green` | `#16A34A` | Paid status |
| `--warning-amber` | `#D97706` | Due soon |
| `--danger-red` | `#DC2626` | Overdue |

Headers use **Playfair Display** (serif). Body uses **Inter** (sans-serif).

---

## 90-Day Roadmap

### Weeks 1-2: Foundation
- [x] Repo + Vercel + Supabase + Twilio set up
- [x] Database schema deployed
- [x] Brand kit finalised
- [ ] Landing page live
- [ ] 5 pilot vendors signed (free 60 days)

### Weeks 3-4: WhatsApp MVP
- [ ] Vendor registers via WhatsApp
- [ ] Vendor adds credit via WhatsApp
- [ ] Vendor marks credit as paid
- [ ] Bot sends auto-reminder 2 days before due

### Weeks 5-6: Web Dashboard v1
- [ ] Phone OTP login
- [ ] Customer list + credit history view
- [ ] Add credit via web
- [ ] 10 pilot vendors live

### Weeks 7-8: Polish + Onboarding
- [ ] 5-min vendor onboarding flow
- [ ] Subscription billing via Paystack
- [ ] 20-25 paying vendors

### Weeks 9-10: Cross-Vendor Credit Score v1
- [ ] Score logic (% on time, volume, defaults)
- [ ] Score visible on student profile lookup
- [ ] **This is the moat — vendors pay for this signal**

### Weeks 11-12: Second Campus
- [ ] Recruit campus rep at university #2
- [ ] Replicate playbook
- [ ] 50+ paying vendors total
- [ ] Begin friends-and-family raise on real traction

---

## Success Metrics (Track from Day 1)

- Paying vendors
- MRR
- Vendor DAU / MAU
- Credits logged per week
- Total ₦ value tracked
- Unique students with credit history
- Repayment rate (overall + per vendor)
- Vendor NPS (quarterly)
- Time-to-first-credit (signup → first credit logged)

---

## Founding Team & Roles

| Role | Owner | Focus |
|---|---|---|
| CEO | Victor Kalejaiye | Strategy, vendor sales, fundraising |
| Co-CEO + Data | Brian Adesina | Credit scoring, analytics, data layer |
| CPO | Demilade Akinsipe | Product, UX, brand |
| CTO | Ogunyade Olamilekan | Engineering lead, infra, code quality |

---

## Security & Compliance Baseline

- Encryption at rest (Supabase default) + TLS in transit
- Phone OTP only — no passwords
- Vendor data isolation (vendor A cannot see vendor B's customers)
- Minimal student data (name, matric, phone) — **no NIN/BVN in v1**
- NDPR-compliant privacy policy + consent flow
- Audit log on every credit/repayment action
- Daily automated Postgres backups

---

## License

Proprietary — Vodium © 2026. All rights reserved.
