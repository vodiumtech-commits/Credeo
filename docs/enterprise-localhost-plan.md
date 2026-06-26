# Enterprise Supermarket Build Plan

This keeps Vodium Ledger affordable while the product is still being proven.

## Localhost First

- App: existing Next.js app
- Database: existing PostgreSQL database
- ORM: Prisma migrations on the same database
- Webhooks locally: Cloudflare Tunnel or ngrok
- Payments: Paystack test mode only
- WhatsApp: Meta WhatsApp Cloud API test setup first
- Cron locally: manual endpoint calls or a local scheduler script

## Tenant Model

The product now supports both:

- Solo vendors
- Supermarket or enterprise organizations with branches

Existing vendors are backfilled into a solo organization and main branch during migration.
Supermarkets should be created by promoting an existing owner vendor account into a
`SUPERMARKET` organization.

## Free Trial Policy

- Solo vendors: 60-day trial
- Supermarket/enterprise tenants: default 30-day trial
- Super admins can set trial days when promoting a supermarket organization

## Money Movement

For now, supermarkets provide the credit and collect customer payment. Vodium should
track agreements, reminders, repayments, and reports.

Do not hold customer funds directly until the business has proper legal and payment
partner structure. Use licensed payment providers for real payments and store only
provider references, not raw card or bank details.

## Route Protection

Global middleware protects:

- `/dashboard/*`
- vendor APIs such as credits, customers, repayments, notifications, Paystack subscribe/verify
- `/admin/*`
- `/api/admin/*`

Public routes remain open only where needed:

- login/register/OTP
- WhatsApp webhook
- Paystack webhook
- cron endpoints, which still require their own `CRON_SECRET`
