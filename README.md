# OPPO Austria Customer Referral Program — V4

Independent Austria referral portal built from the uploaded Stitch UI and a Next.js + Supabase backend.

## Production-facing UI
The Stitch design is preserved directly rather than redrawn:
- PC: `public/portal/desktop.html`
- H5/mobile: `public/portal/mobile.html`
- Responsive entry: `public/portal/index.html`
- API bridge replacing Stitch demo JS: `public/portal/referral-api.js`

`/` redirects to the responsive portal.

## Implemented
- Supabase Auth: email/password + existing-user magic link
- Email-confirmation callback with referral attribution retry
- Profiles + consent logging
- Unique referral code/link generation
- `/r/[code]` 30-day referral attribution cookies
- Self-referral and duplicate-referral rejection
- Real Stitch dashboard binding to profile/referral/reward/tier APIs
- Referral list with masked friend e-mail addresses
- WhatsApp / E-mail / Facebook sharing using the real user referral link
- Reward ledger driven by database rules (no hard-coded €50 in reward service)
- Referrer store-credit reward + friend coupon ledger entry after qualification
- Tier recalculation
- Admin referral/reward APIs backed by a Supabase Edge Function
- Audit logs
- RLS policies and explicit Data API grants
- Privileged mutations isolated in deployed `referral-backend` Supabase Edge Function
- Basic tests

## Intentionally not activated in V1
- OPPO store/order API integration
- Bank payout / IBAN processing
- Real OPPO store-credit or coupon issuance to the commerce platform
- Real QR code generation (the Stitch QR artwork was only a placeholder)
- SAP/ERP/CRM integration
- Complex fraud engine

The UI does not pretend these inactive functions are live: payout and QR actions show an explicit not-yet-enabled message.

## Setup
Read:
- `docs/SETUP.md`
- `docs/API.md`
- `docs/STITCH_INTEGRATION_MAP.md`

## Local commands
```bash
npm install
npm run typecheck
npm test
npm run dev
```

> Note: package registry access was unavailable in the build environment, so dependency-level `npm install` / `next build` verification must be rerun in a normal networked environment before deployment.


## Live Supabase project (created 2026-09-29)

- Project: `OPPO Austria Referral`
- Project ref: `copgtuctijwepryiydug`
- Region: `eu-central-1`
- Database migrations in this repository have been applied to the live project.
- Database/RLS hardening is deployed. Current Auth advisor has one production-setting warning: leaked-password protection is disabled and should be enabled before public password login.

Copy `.env.supabase.example` to `.env.local`. The project URL and browser-safe publishable key are already populated.

The Next.js/Vercel application now requires only three environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL`. A Supabase service-role/secret key is **not** stored in Vercel; privileged referral and admin mutations run inside the deployed Supabase `referral-backend` Edge Function.

Before production, set `NEXT_PUBLIC_SITE_URL` to the final Vercel/custom domain and add the same URL plus `/auth/confirm` to the allowed Supabase Auth redirect URLs.

## Vercel build boundary fix

Vercel/Next.js must not type-check Supabase Edge Function source. `tsconfig.json` now scopes TypeScript to the Next.js application directories, and `.vercelignore` excludes `supabase/functions/`, `stitch-reference/`, and `tests/` from Vercel uploads.


## V4.2 – Real multilingual UI

The Stitch prototype originally only changed the language badge. V4.2 adds a real client-side i18n layer in `public/portal/i18n.js`:

- German (`de`, default)
- English (`en`)
- Simplified Chinese (`zh`)
- Persists the selected language in `localStorage`
- Desktop language menu now supports DE / EN / 中文
- Mobile/H5 receives a compact language selector automatically
- Dynamic referral status rows, dates, currency formatting, dashboard metrics and toasts refresh after a language change
- The existing Stitch visual layout is preserved

The implementation does not use an external translation API and therefore does not transmit page content to third-party translation services.
