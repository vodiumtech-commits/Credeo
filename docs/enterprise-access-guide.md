# Enterprise Access Guide

## Recommended onboarding model

Use **Supermarket request to use the platform**, not open supermarket self-registration.

Why:

- Supermarkets have branches, staff roles, payment terms, WhatsApp numbers, data-protection needs, and custom domains.
- You need to verify who is authorized to create the supermarket account.
- You can agree trial days, branch limits, support expectations, and pricing before enabling enterprise features.
- It prevents fake users from registering as known supermarket brands.

Normal small vendors can continue using self-registration. Supermarkets should request access, then Vodium super admin promotes an existing owner vendor account into a supermarket organization.

## Localhost access

Start the app:

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Main local URLs:

- Vendor login: `http://localhost:3000/login`
- Vendor dashboard: `http://localhost:3000/dashboard`
- Super admin login: `http://localhost:3000/admin/login`
- Admin organizations: `http://localhost:3000/admin/organizations`

## Promote a vendor into a supermarket

1. Register/login one owner vendor account for the supermarket.
2. Login as super admin.
3. Open `http://localhost:3000/admin/organizations`.
4. Find the `SOLO_VENDOR` store.
5. Click **Promote**.
6. Enter the supermarket name, trial days, and branches.
7. Click **Promote and email vendor**.

The owner receives an email after promotion. If `RESEND_API_KEY` is not set, the email content is printed to the server console for local testing.

You can also promote through the API:

```bash
curl -X POST http://localhost:3000/api/admin/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "ownerVendorId": "VENDOR_ID_HERE",
    "name": "Demo Supermarket",
    "type": "SUPERMARKET",
    "trialDays": 30,
    "branches": [
      { "name": "Main Branch", "code": "MAIN" },
      { "name": "Second Branch", "code": "BR2" },
      { "name": "Third Branch", "code": "BR3" }
    ]
  }'
```

After promotion, the owner vendor will see enterprise links in the sidebar.

## Enterprise dashboard URLs

- HQ dashboard: `http://localhost:3000/dashboard/supermarket`
- Branch dashboard: `http://localhost:3000/dashboard/branches/{branchId}`
- BNPL orders: `http://localhost:3000/dashboard/bnpl`
- Coupons: `http://localhost:3000/dashboard/coupons`
- Ledger: `http://localhost:3000/dashboard/ledger`

## Enterprise API endpoints

- Organizations admin: `GET/POST /api/admin/organizations`
- BNPL orders: `GET/POST /api/bnpl/orders`
- Coupons: `GET/POST /api/coupons`
- Ledger report: `GET /api/ledger`
- Payment mandates: `GET/POST /api/payment-mandates`
- Paystack mandate init: `POST /api/payment-mandates/paystack/init`
- Paystack mandate verify: `GET /api/payment-mandates/paystack/verify?reference=...`
- WhatsApp channels: `GET/POST /api/whatsapp/channels`
- Tenant domains: `GET/POST /api/tenant/domains`
- Current tenant by host: `GET /api/tenant/current`

## White-label domain flow

For localhost, test the records through `/api/tenant/domains`.
For production, add DNS records in Cloudflare and mark the domain `VERIFIED` only after DNS is confirmed.
